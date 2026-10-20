// Busca candidatos de fotos reales en Wikimedia Commons y genera una hoja de contactos por plato.
// Uso: node scripts/find-photos.mjs <outDir> "<id>=<consulta>" ...
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UA = { "User-Agent": "LumbreErranteDemo/0.1 (demo educativa)" };
const [out, ...specs] = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });

async function search(q) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=14&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=420&format=json&gsrsearch=" +
    encodeURIComponent(q + " filetype:bitmap");
  let r;
  for (let t = 0; t < 4 && !r; t++) {
    try { r = await (await fetch(u, { headers: UA })).json(); } catch { await new Promise((s) => setTimeout(s, 4000 * (t + 1))); }
  }
  if (!r) return [];
  return Object.values(r.query?.pages ?? {})
    .map((p) => ({ title: p.title, ...p.imageinfo?.[0] }))
    .filter((p) => p.width >= 1600 && p.height >= 1200 && /jpeg/.test(p.mime ?? ""));
}

for (const spec of specs) {
  const [id, q] = spec.split("=");
  const list = (await search(q)).slice(0, 12);
  const tiles = [];
  const meta = [];
  for (const [i, p] of list.entries()) {
    try {
      const buf = Buffer.from(await (await fetch(p.thumburl, { headers: UA })).arrayBuffer());
      const img = await sharp(buf).resize(300, 300, { fit: "cover" }).toBuffer();
      const label = Buffer.from(`<svg width="300" height="300"><rect width="34" height="26" fill="#000"/><text x="6" y="19" font-size="18" fill="#fff" font-family="Arial">${i}</text></svg>`);
      tiles.push(await sharp(img).composite([{ input: label }]).toBuffer());
      meta.push({ i, title: p.title, url: p.url, w: p.width, h: p.height, page: p.descriptionurl, lic: p.extmetadata?.LicenseShortName?.value, author: (p.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "") });
    } catch {}
  }
  const cols = 4, rows = Math.ceil(tiles.length / cols) || 1;
  await sharp({ create: { width: cols * 300, height: rows * 300, channels: 3, background: "#222" } })
    .composite(tiles.map((t, k) => ({ input: t, left: (k % cols) * 300, top: Math.floor(k / cols) * 300 })))
    .jpeg({ quality: 70 }).toFile(path.join(out, `${id}.jpg`));
  await fs.writeFile(path.join(out, `${id}.json`), JSON.stringify(meta, null, 1));
  console.log(id, meta.length);
}
