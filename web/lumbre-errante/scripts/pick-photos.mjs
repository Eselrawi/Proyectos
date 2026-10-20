// Guarda en data/photo-sources.json las fotos elegidas (id=carpeta:indice) a partir de las hojas de find-photos.
import fs from "node:fs/promises";
const [dir, ...picks] = process.argv.slice(2);
const out = {};
for (const p of picks) {
  const [id, sheet, i] = p.split(":");
  const m = JSON.parse(await fs.readFile(`${dir}/${sheet}.json`, "utf8")).find((x) => x.i === +i);
  out[id] = { title: m.title, url: m.url, page: m.page, author: m.author, license: m.lic, width: m.w, height: m.h };
}
await fs.mkdir("data", { recursive: true });
await fs.writeFile("data/photo-sources.json", JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, "fotos");
