// Uso: PEXELS_API_KEY=xxx node scripts/build-assets.mjs
// Sin clave, no hace nada: la web dibuja los ingredientes sola.
// Para usar una foto propia, deja public/ingredients/<id>.webp (se respeta y no se sobrescribe).
import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.PEXELS_API_KEY;
const OUT = "public/ingredients";
const META = path.join(OUT, "_credits.json");

if (!KEY) {
  console.log("Sin PEXELS_API_KEY: se usan ingredientes procedurales. Nada que hacer.");
  process.exit(0);
}

const { removeBackground } = await import("@imgly/background-removal-node");
const sharp = (await import("sharp").catch(() => null))?.default;

const { dishes } = JSON.parse(await fs.readFile("data/dishes.json", "utf8"));
const ingredients = new Map();
for (const d of dishes) for (const i of d.ingredients) ingredients.set(i.id, i);

await fs.mkdir(OUT, { recursive: true });
const credits = JSON.parse(await fs.readFile(META, "utf8").catch(() => "{}"));

for (const [id, ing] of ingredients) {
  const file = path.join(OUT, `${id}.webp`);
  if (await fs.stat(file).then(() => true, () => false)) continue; // cache / foto propia

  const q = encodeURIComponent(`${ing.name} top view isolated`);
  const res = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=1&size=medium`, { headers: { Authorization: KEY } });
  const photo = (await res.json()).photos?.[0];
  if (!photo) { console.warn(`sin foto: ${id} (fallback procedural)`); continue; }

  try {
    const img = await (await fetch(photo.src.medium)).blob();
    const cut = await removeBackground(img);
    let buf = Buffer.from(await cut.arrayBuffer());
    if (sharp) buf = await sharp(buf).resize(512, 512, { fit: "inside" }).webp({ quality: 82 }).toBuffer();
    else console.warn("sharp no instalado: se guarda sin redimensionar");
    await fs.writeFile(file, buf);
    credits[id] = { author: photo.photographer, url: photo.url };
    console.log("ok", id);
  } catch (e) {
    console.warn(`recorte fallido: ${id} (fallback procedural)`, e.message);
  }
}

await fs.writeFile(META, JSON.stringify(credits, null, 1));
const md = ["# Créditos", "", "Fotos de [Pexels](https://www.pexels.com).", "",
  ...Object.entries(credits).map(([id, c]) => `- ${id}: ${c.author} — ${c.url}`)].join("\n");
await fs.writeFile("CREDITS.md", md + "\n");
