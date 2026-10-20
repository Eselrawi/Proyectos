// Descarga las 3 fotos de ambiente elegidas (hoja amb1 de find-photos) a public/ambiente/. Uso: node scripts/fetch-ambience.mjs <candsDir> 0 1 2
import fs from "node:fs/promises";
import sharp from "sharp";
const [dir, ...idx] = process.argv.slice(2);
const meta = JSON.parse(await fs.readFile(`${dir}/amb1.json`, "utf8"));
const UA = { "User-Agent": "LumbreErranteDemo/0.1 (demo educativa)" };
const out = {};
await fs.mkdir("public/ambiente", { recursive: true });
for (const [n, i] of idx.entries()) {
  const m = meta.find((x) => x.i === +i);
  const name = decodeURIComponent(new URL(m.url).pathname.split("/").pop());
  let buf;
  for (let t = 0; t < 4 && !buf; t++) {
    const r = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1400`, { headers: UA });
    if (r.ok) buf = Buffer.from(await r.arrayBuffer()); else await new Promise((s) => setTimeout(s, 4000 * (t + 1)));
  }
  await sharp(buf).rotate().resize(800, 1000, { fit: "cover", position: "centre" }).jpeg({ quality: 76 }).toFile(`public/ambiente/ambiente-${n + 1}.jpg`);
  out[`Ambiente ${n + 1}`] = { title: m.title, page: m.page, author: m.author, license: m.lic };
}
await fs.writeFile("data/ambience-sources.json", JSON.stringify(out, null, 1));
console.log(out);
