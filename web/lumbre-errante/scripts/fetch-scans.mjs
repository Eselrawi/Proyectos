// Descarga de Sketchfab (cuenta del usuario, SKETCHFAB_TOKEN en .env.local) los glTF escaneados de la carta a scans-raw/<id>.zip.
// Uso: node scripts/fetch-scans.mjs [id...]  (sin ids, todos)
import fs from "node:fs/promises";
import { SCANS } from "./scans.mjs";

const env = await fs.readFile(".env.local", "utf8").catch(() => "");
const token = env.match(/^SKETCHFAB_TOKEN=(.+)$/m)?.[1]?.trim();
if (!token) throw new Error("Falta SKETCHFAB_TOKEN en .env.local");

const want = process.argv.slice(2);
await fs.mkdir("scans-raw", { recursive: true });
for (const [id, s] of Object.entries(SCANS)) {
  if (want.length && !want.includes(id)) continue;
  const out = `scans-raw/${id}.zip`;
  if (await fs.stat(out).catch(() => null)) { console.log(id, "ya descargado"); continue; }
  const r = await fetch(`https://api.sketchfab.com/v3/models/${s.uid}/download`, { headers: { Authorization: `Token ${token}` } });
  if (!r.ok) { console.log(id, "ERROR", r.status, (await r.text()).slice(0, 160)); continue; }
  const j = await r.json();
  const g = j.gltf;
  if (!g) { console.log(id, "sin glTF", Object.keys(j)); continue; }
  const f = await fetch(g.url);
  const buf = Buffer.from(await f.arrayBuffer());
  await fs.writeFile(out, buf);
  console.log(id, `${(buf.length / 1048576).toFixed(1)} MB`);
}
