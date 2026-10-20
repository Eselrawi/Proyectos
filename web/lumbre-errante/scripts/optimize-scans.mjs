// Descomprime scans-raw/<id>.zip y lo deja en public/scans/<id>.glb: ~60k caras, texturas WebP a 1K, vértices cuantizados.
// Usa @gltf-transform/cli con npx (no es dependencia del proyecto). Uso: node scripts/optimize-scans.mjs [id...]
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { SCANS } from "./scans.mjs";

const TARGET_FACES = 60000;
const want = process.argv.slice(2);
await fs.mkdir("public/scans", { recursive: true });
const tmpRoot = "scans-raw/_tmp";

for (const [id, s] of Object.entries(SCANS)) {
  if (want.length && !want.includes(id)) continue;
  const zip = `scans-raw/${id}.zip`;
  if (!(await fs.stat(zip).catch(() => null))) { console.log(id, "sin zip"); continue; }
  const dir = `${tmpRoot}/${id}`;
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  // bsdtar de Windows entiende zip; el tar de Git Bash no
  execFileSync(process.platform === "win32" ? "C:\\Windows\\System32\\tar.exe" : "unzip", process.platform === "win32" ? ["-xf", zip, "-C", dir] : ["-q", zip, "-d", dir]);
  const gltf = (await fs.readdir(dir)).find((f) => f.endsWith(".gltf"));
  if (!gltf) { console.log(id, "sin .gltf en el zip"); continue; }

  const meta = await (await fetch(`https://api.sketchfab.com/v3/models/${s.uid}`)).json();
  const ratio = Math.min(1, TARGET_FACES / (meta.faceCount || TARGET_FACES));
  const out = `public/scans/${id}.glb`;
  execFileSync(
    "npx",
    ["--yes", "@gltf-transform/cli", "optimize", `${dir}/${gltf}`, out,
      "--simplify", "true", "--simplify-ratio", ratio.toFixed(4), "--simplify-error", String(s.error ?? 0.02),
      "--compress", "quantize", "--texture-compress", "webp", "--texture-size", "1024"],
    { stdio: "inherit", shell: true },
  );
  const size = (await fs.stat(out)).size;
  console.log(id, `${meta.faceCount} caras -> ratio ${ratio.toFixed(3)}, ${(size / 1048576).toFixed(2)} MB`);
  await fs.rm(dir, { recursive: true, force: true });
}
