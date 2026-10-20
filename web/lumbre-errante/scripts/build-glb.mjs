// Genera public/dishes/<id>/plato.glb (relieve + foto) para ver cada plato en realidad aumentada.
// Uso: node scripts/build-glb.mjs [id ...]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const menu = JSON.parse(fs.readFileSync(path.join(root, "data/menu.json"), "utf8"));
const all = (menu.dishes ?? menu).map((d) => d.id);
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;

const D = 0.3; // diámetro real del plato en metros
const R = D / 2;
const N = 96; // celdas por lado
const RELIEF = 0.2 / 2.4 * D; // misma proporción que el visor web
const TEX = 1024;

async function depthField(file) {
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  return (u, v) => {
    const x = Math.min(w - 1.001, Math.max(0, u * (w - 1))), y = Math.min(h - 1.001, Math.max(0, v * (h - 1)));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const g = (xx, yy) => data[yy * w + xx] / 255;
    return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
  };
}

function build(height, jpg) {
  const pos = [], uv = [], idx = [], vid = new Map();
  const hgt = (i, j) => height(i / N, j / N) * RELIEF;
  const inside = (i, j) => Math.hypot(i / N - 0.5, j / N - 0.5) <= 0.5 - 0.002;
  const vert = (i, j) => {
    const k = j * (N + 1) + i;
    if (!vid.has(k)) {
      vid.set(k, pos.length / 3);
      pos.push((i / N - 0.5) * D, hgt(i, j), (j / N - 0.5) * D);
      uv.push(i / N, j / N);
    }
    return vid.get(k);
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!inside(i, j) || !inside(i + 1, j) || !inside(i, j + 1) || !inside(i + 1, j + 1)) continue;
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  // normales por diferencias del campo de alturas
  const nrm = new Array(pos.length).fill(0);
  for (const [k, n] of vid) {
    const i = k % (N + 1), j = Math.floor(k / (N + 1));
    const dx = (hgt(Math.min(N, i + 1), j) - hgt(Math.max(0, i - 1), j)) / (2 * D / N);
    const dz = (hgt(i, Math.min(N, j + 1)) - hgt(i, Math.max(0, j - 1))) / (2 * D / N);
    const l = Math.hypot(dx, 1, dz);
    nrm[n * 3] = -dx / l; nrm[n * 3 + 1] = 1 / l; nrm[n * 3 + 2] = -dz / l;
  }
  // base: disco inferior y pared lateral
  const seg = 96, top = 0.012, bot = -0.012;
  const bp = [], bn = [], bi = [];
  bp.push(0, bot, 0); bn.push(0, -1, 0);
  for (let s = 0; s <= seg; s++) { const t = (s / seg) * Math.PI * 2; bp.push(Math.cos(t) * R * 0.995, bot, Math.sin(t) * R * 0.995); bn.push(0, -1, 0); }
  for (let s = 0; s < seg; s++) bi.push(0, 1 + s, 2 + s);
  const wallStart = bp.length / 3;
  for (let s = 0; s <= seg; s++) {
    const t = (s / seg) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
    bp.push(c * R * 0.995, top, sn * R * 0.995, c * R * 0.995, bot, sn * R * 0.995);
    bn.push(c, 0, sn, c, 0, sn);
  }
  for (let s = 0; s < seg; s++) { const a = wallStart + s * 2; bi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }

  // empaquetar
  const f32 = (a) => Buffer.from(new Float32Array(a).buffer);
  const u32 = (a) => Buffer.from(new Uint32Array(a).buffer);
  const pad = (b) => (b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - (b.length % 4))]) : b);
  const parts = [f32(pos), f32(nrm), f32(uv), u32(idx), f32(bp), f32(bn), u32(bi), jpg].map(pad);
  const offs = []; let o = 0;
  for (const p of parts) { offs.push(o); o += p.length; }
  const bounds = (arr) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let k = 0; k < arr.length; k += 3) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], arr[k + c]); mx[c] = Math.max(mx[c], arr[k + c]); } return { min: mn, max: mx }; };
  const raw = [pos, nrm, uv, idx, bp, bn, bi];
  const lens = [pos.length, nrm.length, uv.length, idx.length, bp.length, bn.length, bi.length];
  const json = {
    asset: { version: "2.0", generator: "lumbre-errante build-glb" },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [
      { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 },
      { attributes: { POSITION: 4, NORMAL: 5 }, indices: 6, material: 1 },
    ] }],
    materials: [
      { pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.85 } },
      { pbrMetallicRoughness: { baseColorFactor: [0.1, 0.08, 0.065, 1], metallicFactor: 0, roughnessFactor: 0.6 } },
    ],
    textures: [{ source: 0, sampler: 0 }], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: 7, mimeType: "image/jpeg" }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: lens[0] / 3, type: "VEC3", ...bounds(pos) },
      { bufferView: 1, componentType: 5126, count: lens[1] / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5126, count: lens[2] / 2, type: "VEC2" },
      { bufferView: 3, componentType: 5125, count: lens[3], type: "SCALAR" },
      { bufferView: 4, componentType: 5126, count: lens[4] / 3, type: "VEC3", ...bounds(bp) },
      { bufferView: 5, componentType: 5126, count: lens[5] / 3, type: "VEC3" },
      { bufferView: 6, componentType: 5125, count: lens[6], type: "SCALAR" },
    ],
    bufferViews: parts.map((p, k) => ({ buffer: 0, byteOffset: offs[k], byteLength: k === 7 ? jpg.length : raw[k].length * 4 })),
    buffers: [{ byteLength: o }],
  };
  void raw;
  const js = pad(Buffer.from(JSON.stringify(json).padEnd(Math.ceil(JSON.stringify(json).length / 4) * 4, " ")));
  const bin = Buffer.concat(parts);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, js, bh, bin]);
}

for (const id of ids) {
  const dir = path.join(root, "public/dishes", id);
  const jpg = await sharp(path.join(dir, "color.webp")).resize(TEX, TEX, { fit: "fill" }).jpeg({ quality: 82 }).toBuffer();
  const height = await depthField(path.join(dir, "depth.webp"));
  const glb = build(height, jpg);
  fs.writeFileSync(path.join(dir, "plato.glb"), glb);
  console.log(id, (glb.length / 1024).toFixed(0) + " KB");
}
