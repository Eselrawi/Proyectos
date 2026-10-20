// Almacén clave-valor con caducidad. Memoria del proceso por defecto; Upstash Redis (REST) si hay credenciales,
// necesario en Vercel porque las funciones no comparten memoria entre instancias.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const usingRedis = Boolean(url && token);
export const TTL_MS = 24 * 60 * 60 * 1000;

async function cmd<T>(...args: (string | number)[]): Promise<T> {
  const r = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const j = (await r.json()) as { result: T; error?: string };
  if (j.error) throw new Error(j.error);
  return j.result;
}

const g = globalThis as unknown as { __kv?: Map<string, Map<string, string>> };
const mem = (g.__kv ??= new Map());

export async function put(coll: string, id: string, value: object) {
  const s = JSON.stringify(value);
  if (usingRedis) {
    await cmd("HSET", coll, id, s);
    await cmd("EXPIRE", coll, TTL_MS / 1000);
  } else {
    if (!mem.has(coll)) mem.set(coll, new Map());
    mem.get(coll)!.set(id, s);
  }
}

export async function getOne<T>(coll: string, id: string): Promise<T | null> {
  const s = usingRedis ? await cmd<string | null>("HGET", coll, id) : (mem.get(coll)?.get(id) ?? null);
  return s ? (JSON.parse(s) as T) : null;
}

export async function all<T extends { createdAt: number }>(coll: string): Promise<T[]> {
  let rows: [string, string][];
  if (usingRedis) {
    const flat = await cmd<string[]>("HGETALL", coll);
    rows = [];
    for (let i = 0; i < flat.length; i += 2) rows.push([flat[i], flat[i + 1]]);
  } else rows = [...(mem.get(coll)?.entries() ?? [])];
  const now = Date.now();
  const out: T[] = [];
  for (const [id, s] of rows) {
    const v = JSON.parse(s) as T;
    if (now - v.createdAt > TTL_MS) { void del(coll, id); continue; }
    out.push(v);
  }
  return out;
}

export async function del(coll: string, id: string) {
  if (usingRedis) await cmd("HDEL", coll, id);
  else mem.get(coll)?.delete(id);
}

export async function nextSeq(): Promise<number> {
  if (usingRedis) return cmd<number>("INCR", "seq");
  const h = globalThis as unknown as { __seq?: number };
  return (h.__seq = (h.__seq ?? 0) + 1);
}
