import type { Dish, OrderItem } from "./types";

export interface Line { dishId: string; name: string; price: number; qty: number }

const cents = (n: number) => Math.round(n * 100);

/** Suma en céntimos para no arrastrar errores de coma flotante. */
export function orderTotal(items: { price: number; qty: number }[]) {
  return items.reduce((s, i) => s + cents(i.price) * i.qty, 0) / 100;
}

export function addLine(lines: Line[], d: Pick<Dish, "id" | "name" | "price">): Line[] {
  const l = lines.find((x) => x.dishId === d.id);
  if (l) return lines.map((x) => (x === l ? { ...x, qty: Math.min(20, x.qty + 1) } : x));
  return [...lines, { dishId: d.id, name: d.name, price: d.price, qty: 1 }];
}

export function setLineQty(lines: Line[], id: string, qty: number): Line[] {
  if (!Number.isFinite(qty) || qty <= 0) return lines.filter((x) => x.dishId !== id);
  return lines.map((x) => (x.dishId === id ? { ...x, qty: Math.min(20, Math.floor(qty)) } : x));
}

/** Servidor: ignora precios y nombres del cliente; usa solo el id y la cantidad. */
export function priceItems(raw: { dishId: string; qty: number }[], catalog: Pick<Dish, "id" | "name" | "price">[]): OrderItem[] {
  const out = new Map<string, OrderItem>();
  for (const r of raw) {
    const d = catalog.find((x) => x.id === r.dishId);
    if (!d || !Number.isFinite(r.qty) || r.qty < 1) continue;
    const prev = out.get(d.id);
    const qty = Math.min(20, (prev?.qty ?? 0) + Math.floor(r.qty));
    out.set(d.id, { dishId: d.id, name: d.name, price: d.price, qty });
  }
  return [...out.values()];
}
