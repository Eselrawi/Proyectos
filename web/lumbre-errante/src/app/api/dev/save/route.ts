import fs from "node:fs/promises";
import path from "node:path";

/** Solo desarrollo: guarda en public/scans lo que envía la herramienta /dev/scans (pósters). */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("No disponible", { status: 404 });
  const name = new URL(req.url).searchParams.get("name") ?? "";
  if (!/^[a-z0-9-]+\.(webp|png)$/.test(name)) return new Response("Nombre no válido", { status: 400 });
  await fs.writeFile(path.join(process.cwd(), "public", "scans", name), Buffer.from(await req.arrayBuffer()));
  return new Response("ok");
}
