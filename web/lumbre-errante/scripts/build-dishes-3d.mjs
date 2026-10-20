// Foto real cenital -> color.webp + depth.webp + ids.png por plato.
// Uso: node scripts/build-dishes-3d.mjs [id ...] [--force] [--only-fetch]
// Entrada por plato: data/photos/<id>.jpg (foto propia, tiene prioridad) o la fuente elegida en data/photo-sources.json (Wikimedia Commons).
// Anotación: data/annotations/<id>.json { crop:{cx,cy,r}, ingredients:[{id,name,category,description,allergens,components?,points:[[x,y]...]}] }
// Coordenadas normalizadas (0-1) sobre la foto original. Cache: public/dishes/<id>/.hash
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyFetch = args.includes("--only-fetch");
const wanted = args.filter((a) => !a.startsWith("--"));
const UA = { "User-Agent": "LumbreErranteDemo/0.1 (demo educativa)" };
const N = 512; // resolución de depth e ids
const COLOR = 1024;

const exists = (p) => fs.stat(p).then(() => true, () => false);
const readJson = async (p, d) => JSON.parse(await fs.readFile(p, "utf8").catch(() => "null")) ?? d;

const menu = await readJson("data/menu.json");
const sources = await readJson("data/photo-sources.json", {});
const ids = (wanted.length ? wanted : menu.dishes.map((d) => d.id));

async function fetchPhoto(id) {
  const file = `data/photos/${id}.jpg`;
  if (await exists(file)) return file;
  const s = sources[id];
  if (!s) throw new Error(`sin foto ni fuente para ${id}`);
  const name = decodeURIComponent(new URL(s.url).pathname.split("/").pop());
  const u = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=2000`;
  let buf;
  for (let t = 0; t < 4 && !buf; t++) {
    const r = await fetch(u, { headers: UA });
    if (r.ok) buf = Buffer.from(await r.arrayBuffer());
    else await new Promise((x) => setTimeout(x, 4000 * (t + 1)));
  }
  if (!buf) throw new Error(`descarga fallida ${id}`);
  await fs.mkdir("data/photos", { recursive: true });
  await sharp(buf).rotate().jpeg({ quality: 90 }).toFile(file);
  return file;
}

if (onlyFetch) {
  for (const id of ids) console.log("foto", id, await fetchPhoto(id));
  process.exit(0);
}

const { pipeline, SamModel, AutoProcessor, RawImage } = await import("@huggingface/transformers");
let depthPipe, samModel, samProc;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

for (const id of ids) {
  const ann = await readJson(`data/annotations/${id}.json`);
  if (!ann) { console.warn("sin anotación:", id); continue; }
  const photo = await fetchPhoto(id);
  const outDir = `public/dishes/${id}`;
  const hash = crypto.createHash("md5").update(JSON.stringify(ann)).update(await fs.readFile(photo)).digest("hex");
  if (!force && (await readJson(`${outDir}/.hash.json`)) === hash) { console.log("cache", id); continue; }
  await fs.mkdir(outDir, { recursive: true });

  // Recorte cuadrado alrededor del plato
  const meta = await sharp(photo).metadata();
  const { cx, cy, r } = ann.crop;
  const side = Math.round(2 * r * Math.max(meta.width, meta.height) * (ann.cropScale ?? 1));
  const px = cx * meta.width, py = cy * meta.height;
  const left = Math.max(0, Math.round(px - side / 2)), top = Math.max(0, Math.round(py - side / 2));
  const w = Math.min(side, meta.width - left), h = Math.min(side, meta.height - top);
  const sq = Math.min(w, h);
  const crop = sharp(photo).extract({ left, top, width: sq, height: sq });
  // coordenadas normalizadas de la foto -> del recorte
  const toCrop = ([x, y]) => [(x * meta.width - left) / sq, (y * meta.height - top) / sq];

  // Color: círculo transparente 1024
  const circle = Buffer.from(`<svg width="${COLOR}" height="${COLOR}"><circle cx="${COLOR / 2}" cy="${COLOR / 2}" r="${COLOR / 2 - 2}" fill="#fff"/></svg>`);
  let q = 82;
  let colorBuf;
  do {
    colorBuf = await crop.clone().resize(COLOR, COLOR).composite([{ input: circle, blend: "dest-in" }]).webp({ quality: q, alphaQuality: 80 }).toBuffer();
    q -= 8;
  } while (colorBuf.length > 230_000 && q > 40);
  await fs.writeFile(`${outDir}/color.webp`, colorBuf);

  // Profundidad
  depthPipe ??= await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small", { dtype: "fp32" });
  const png = await crop.clone().resize(518, 518).png().toBuffer();
  const dep = (await depthPipe(await RawImage.fromBlob(new Blob([png])))).depth;
  const dRaw = await sharp(Buffer.from(dep.data), { raw: { width: dep.width, height: dep.height, channels: 1 } }).resize(N, N).raw().toBuffer();
  let lo = 255, hi = 0;
  for (const v of dRaw) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const depth = Buffer.alloc(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const d = Math.hypot((x - N / 2) / (N / 2), (y - N / 2) / (N / 2));
    const base = (dRaw[y * N + x] - lo) / Math.max(1, hi - lo);
    depth[y * N + x] = Math.round(255 * base * (1 - smooth(0.82, 1, d)) * 0.9 + 12);
  }
  await sharp(depth, { raw: { width: N, height: N, channels: 1 } })
    .blur(1.2).webp({ quality: 78 }).toFile(`${outDir}/depth.webp`);

  // Máscaras por ingrediente (SlimSAM) -> mapa de ids
  samModel ??= await SamModel.from_pretrained("Xenova/slimsam-77-uniform", { dtype: "fp32" });
  samProc ??= await AutoProcessor.from_pretrained("Xenova/slimsam-77-uniform");
  const small = await crop.clone().resize(N, N).png().toBuffer();
  const image = await RawImage.fromBlob(new Blob([small]));
  const inputs = await samProc(image);
  const emb = await samModel.get_image_embeddings(inputs);
  const area = new Int32Array(ann.ingredients.length + 1);
  const owner = new Uint8Array(N * N);
  const unions = ann.ingredients.map(() => null);
  for (const [k, ing] of ann.ingredients.entries()) {
    if (ing.rest) continue;
    const idv = k + 1;
    const union = new Uint8Array(N * N);
    unions[k] = union;
    for (const pt of ing.points) {
      const [nx, ny] = toCrop(pt);
      // puntos negativos: otros ingredientes (los más cercanos) y el borde del plato
      const others = ann.ingredients.flatMap((g, j) => (j === k ? [] : g.points.map(toCrop)))
        .sort((a, b) => Math.hypot(a[0] - nx, a[1] - ny) - Math.hypot(b[0] - nx, b[1] - ny)).slice(0, 6);
      const rim = [0, 1, 2, 3, 4, 5].map((t) => [0.5 + 0.47 * Math.cos((t * Math.PI) / 3), 0.5 + 0.47 * Math.sin((t * Math.PI) / 3)]);
      const neg = ing.noNegatives ? [] : [...others, ...rim];
      const input_points = [[[[nx * N, ny * N], ...neg.map(([x, y]) => [x * N, y * N])]]];
      const input_labels = [[[1, ...neg.map(() => 0)]]];
      const pr = await samProc(image, { input_points, input_labels });
      const out = await samModel({ ...emb, input_points: pr.input_points, input_labels: pr.input_labels });
      const masks = await samProc.post_process_masks(out.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes);
      const scores = out.iou_scores.data;
      let bi = 0;
      for (let i = 1; i < 3; i++) if (scores[i] > scores[bi]) bi = i;
      // si la máscara de mayor puntuación ocupa más del cap, usar la más pequeña
      const m = masks[0];
      const sizes = [0, 1, 2].map((i) => m.data.slice(i * N * N, (i + 1) * N * N).reduce((a, b) => a + (b ? 1 : 0), 0));
      const cap = (ing.maxArea ?? 0.4) * N * N;
      if (sizes[bi] > cap) bi = sizes.map((s, i) => [s, i]).filter(([s]) => s > 50).sort((a, b) => a[0] - b[0])[0]?.[1] ?? bi;
      if (sizes[bi] > cap * 1.15) { console.warn(`  máscara descartada (${ing.id}, ${Math.round((sizes[bi] / (N * N)) * 100)}% del plato)`); continue; }
      for (let i = 0; i < N * N; i++) if (m.data[bi * N * N + i]) union[i] = 1;
    }
  }
  // Resolución: las máscaras de SAM se solapan o dejan huecos. Se decide cada píxel por semillas
  // (píxeles reclamados por un solo ingrediente) con distancia color + posición.
  const rgb = await sharp(small).blur(1.5).removeAlpha().raw().toBuffer();
  const restIdx = ann.ingredients.findIndex((g) => g.rest);
  const rr = (ann.restRadius ?? 0.9) * (N / 2);
  const claims = new Uint8Array(N * N);
  for (const u of unions) if (u) for (let i = 0; i < N * N; i++) claims[i] += u[i];
  const seeds = []; // [x, y, r, g, b, k]
  for (const [k, u] of unions.entries()) {
    if (!u) continue;
    for (let y = 2; y < N - 2; y += 3) for (let x = 2; x < N - 2; x += 3) {
      const i = y * N + x;
      if (u[i] && claims[i] === 1 && u[i - 2] && u[i + 2] && u[i - 2 * N] && u[i + 2 * N] && claims[i - 2] === 1 && claims[i + 2] === 1)
        seeds.push([x, y, rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], k]);
    }
  }
  // semillas de plato: sin reclamar y lejos de cualquier ingrediente
  const near = new Uint8Array(N * N);
  {
    const R = ann.plateGap ?? 16;
    const tmp = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let hit = 0;
      for (let dx = -R; dx <= R && !hit; dx += 2) { const xx = x + dx; if (xx >= 0 && xx < N && claims[y * N + xx]) hit = 1; }
      tmp[y * N + x] = hit;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let hit = 0;
      for (let dy = -R; dy <= R && !hit; dy += 2) { const yy = y + dy; if (yy >= 0 && yy < N && tmp[yy * N + x]) hit = 1; }
      near[y * N + x] = hit;
    }
    for (let y = 2; y < N - 2; y += 3) for (let x = 2; x < N - 2; x += 3) {
      const i = y * N + x;
      const dd = Math.hypot(x - N / 2, y - N / 2);
      if (!claims[i] && (dd > 0.92 * (N / 2) || (!near[i] && (restIdx < 0 || dd > rr)))) seeds.push([x, y, rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], -1]);
    }
  }
  const lam = ann.spatial ?? 0.45, T2 = (ann.maxDist ?? 70) ** 2;
  const nearest = (i, only) => {
    const x = i % N, y = (i / N) | 0, r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    let bd = Infinity, bk = -1;
    for (const s of seeds) {
      if (only ? s[5] < 0 || !unions[s[5]][i] : false) continue;
      const d = (s[2] - r) ** 2 + (s[3] - g) ** 2 + (s[4] - b) ** 2 + (lam * lam) * ((s[0] - x) ** 2 + (s[1] - y) ** 2);
      if (d < bd) { bd = d; bk = s[5]; }
    }
    return [bk, bd];
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, d = Math.hypot(x - N / 2, y - N / 2);
    if (d > N / 2 - 1) continue;
    if (claims[i] === 1) { owner[i] = unions.findIndex((u) => u && u[i]) + 1; }
    else if (claims[i] > 1) owner[i] = nearest(i, true)[0] + 1;
    else if (restIdx >= 0 && d < rr) owner[i] = restIdx + 1;
    else if (restIdx < 0 && d < rr) { const [k, dist] = nearest(i, false); owner[i] = dist < T2 ? k + 1 : 0; }
  }
  // filtro de moda: quita el moteado donde se solapan máscaras
  const K = ann.smooth ?? 5, nIds = ann.ingredients.length + 1;
  let cur = owner;
  for (let pass = 0; pass < 2; pass++) {
    const nxt = new Uint8Array(N * N);
    const cnt = new Int32Array(nIds);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      cnt.fill(0);
      for (let dy = -K; dy <= K; dy += 2) for (let dx = -K; dx <= K; dx += 2) {
        const yy = Math.min(N - 1, Math.max(0, y + dy)), xx = Math.min(N - 1, Math.max(0, x + dx));
        cnt[cur[yy * N + xx]]++;
      }
      let b = cur[y * N + x];
      for (let i = 0; i < nIds; i++) if (cnt[i] > cnt[b]) b = i;
      nxt[y * N + x] = b;
    }
    cur = nxt;
  }
  owner.set(cur);
  for (let i = 0; i < nIds; i++) area[i] = 0;
  for (const v of owner) area[v]++;
  await sharp(Buffer.from(owner), { raw: { width: N, height: N, channels: 1 } }).png({ compressionLevel: 9 }).toFile(`${outDir}/ids.png`);

  await fs.writeFile(`${outDir}/.hash.json`, JSON.stringify(hash));
  const sz = (await Promise.all(["color.webp", "depth.webp", "ids.png"].map((f) => fs.stat(`${outDir}/${f}`)))).reduce((s, x) => s + x.size, 0);
  console.log("ok", id, Math.round(sz / 1024) + " KB", ann.ingredients.map((g, k) => `${g.id}:${Math.round((area[k + 1] / (N * N)) * 100)}%`).join(" "));
}

// Datos finales del visor
const dishes = [];
for (const d of menu.dishes) {
  const ann = await readJson(`data/annotations/${d.id}.json`);
  if (!ann) continue;
  // ingredientes cuya máscara quedó vacía (< 0,4 % del plato) no se pueden tocar: se omiten de la ficha
  const { data: idData } = await sharp(`public/dishes/${d.id}/ids.png`).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const counts = new Int32Array(ann.ingredients.length + 1);
  for (const v of idData) counts[v]++;
  const keep = (k) => counts[k + 1] / idData.length >= 0.004;
  ann.ingredients.forEach((g, k) => { if (!keep(k)) console.warn(`  ingrediente omitido (máscara vacía): ${d.id}/${g.id}`); });
  dishes.push({
    ...d,
    ingredients: ann.ingredients.map(({ points, maxArea, rest, ...g }, k) => ({ ...g, index: k + 1, _k: k })).filter((g) => keep(g._k)).map(({ _k, ...g }) => g),
    assets: { color: `/dishes/${d.id}/color.webp`, depth: `/dishes/${d.id}/depth.webp`, ids: `/dishes/${d.id}/ids.png` },
  });
}
await fs.writeFile("data/dishes.json", JSON.stringify({ pendienteConfirmar: true, categories: menu.categories, dishes }, null, 1));

// Créditos
const credit = Object.entries(sources).filter(([id]) => menu.dishes.some((d) => d.id === id))
  .map(([id, s]) => `- ${menu.dishes.find((d) => d.id === id).name}: ${s.author || "autor desconocido"} · ${s.license} · [${s.title.replace("File:", "")}](${s.page})`);
await fs.writeFile("CREDITS.md", ["# Créditos de fotos", "", "Fotos de [Wikimedia Commons](https://commons.wikimedia.org). Recortadas y procesadas para la demo; las licencias CC BY-SA obligan a citar autoría y licencia.", "", ...credit, ""].join("\n"));
