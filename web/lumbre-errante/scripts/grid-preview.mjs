// Vista previa con cuadrícula del 10% para anotar puntos. Uso: node scripts/grid-preview.mjs <outDir> <id>...
import sharp from "sharp";
import fs from "node:fs/promises";
const [out, ...ids] = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });
for (const id of ids) {
  const img = sharp(`data/photos/${id}.jpg`);
  const m = await img.metadata();
  const W = 760, H = Math.round((W * m.height) / m.width);
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 1; i < 10; i++) {
    const x = (W * i) / 10, y = (H * i) / 10;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-opacity=".55"/><line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-opacity=".55"/>`;
    svg += `<text x="${x + 2}" y="12" font-size="12" fill="#ff0" stroke="#000" stroke-width=".4">${i / 10}</text><text x="2" y="${y - 2}" font-size="12" fill="#0ff" stroke="#000" stroke-width=".4">${i / 10}</text>`;
  }
  await sharp(await img.resize(W, H).toBuffer()).composite([{ input: Buffer.from(svg + "</svg>") }]).jpeg({ quality: 80 }).toFile(`${out}/${id}.jpg`);
}
