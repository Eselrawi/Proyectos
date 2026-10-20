// Superpone máscaras y puntos sobre color.webp para revisarlas. Uso: node scripts/overlay.mjs <outDir> <id>...
import sharp from "sharp";
import fs from "node:fs/promises";
const [out, ...ids] = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });
const pal = [[255,0,0],[0,200,255],[255,220,0],[0,255,0],[255,0,255],[255,128,0],[120,80,255],[0,255,160],[255,100,160],[160,255,0]];
for (const id of ids) {
  const ann = JSON.parse(await fs.readFile(`data/annotations/${id}.json`, "utf8"));
  const dir = `public/dishes/${id}`;
  const S = 512;
  const meta = await sharp(`data/photos/${id}.jpg`).metadata();
  const side = Math.round(2 * ann.crop.r * meta.width * (ann.cropScale ?? 1));
  const left = Math.max(0, Math.round(ann.crop.cx * meta.width - side / 2)), top = Math.max(0, Math.round(ann.crop.cy * meta.height - side / 2));
  const sq = Math.min(side, meta.width - left, meta.height - top);
  const color = await sharp(`${dir}/color.webp`).resize(S, S).flatten({ background: "#888" }).raw().toBuffer();
  const ids_ = await sharp(`${dir}/ids.png`).resize(S, S, { kernel: "nearest" }).extractChannel(0).raw().toBuffer();
  const px = Buffer.from(color);
  for (let i = 0; i < S * S; i++) {
    const v = ids_[i];
    if (!v) continue;
    const c = pal[(v - 1) % pal.length];
    for (let k = 0; k < 3; k++) px[i * 3 + k] = Math.round(px[i * 3 + k] * 0.55 + c[k] * 0.45);
  }
  const legend = ann.ingredients.map((g, k) => `<rect x="6" y="${6 + k * 18}" width="12" height="12" fill="rgb(${pal[k % pal.length]})"/><text x="22" y="${16 + k * 18}" font-size="13" fill="#fff" stroke="#000" stroke-width=".5">${k + 1} ${g.name}</text>`).join("");
  const dots = ann.ingredients.flatMap((g, k) => g.points.map(([x, y]) => {
    const cx = ((x * meta.width - left) / sq) * S, cy = ((y * meta.height - top) / sq) * S;
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="none" stroke="#fff" stroke-width="2"/><text x="${cx - 4}" y="${cy + 4}" font-size="11" fill="#fff" stroke="#000" stroke-width=".6">${k + 1}</text>`;
  })).join("");
  await sharp(px, { raw: { width: S, height: S, channels: 3 } })
    .composite([{ input: Buffer.from(`<svg width="${S}" height="${S}">${legend}${dots}</svg>`) }])
    .jpeg({ quality: 82 }).toFile(`${out}/${id}.jpg`);
}
