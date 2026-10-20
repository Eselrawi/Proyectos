// Límite por IP en memoria (suficiente para la demo; en producción, Redis/Upstash).
const g = globalThis as unknown as { __rl?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__rl ??= new Map<string, number[]>());

export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return arr.length > max;
}

export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
