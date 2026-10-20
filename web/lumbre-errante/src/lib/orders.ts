import type { Order, OrderStatus } from "./types";
import { env } from "./env";
import { all, getOne, nextSeq, put } from "./store";

export interface Reservation {
  id: string;
  createdAt: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  demo: boolean;
}

const ORD = "orders";
const RES = "reservations";

/** Tres pedidos de ejemplo para el panel de demostración (se vuelven a crear al caducar). */
async function seed(existing: Order[]) {
  if (!env.demo) return existing;
  const now = Date.now();
  const mk = (n: number, mins: number, status: OrderStatus, customer: string, table: string, items: Order["items"], note = ""): Order => ({
    id: "ej" + n, createdAt: now - mins * 60000, status, customer, table, note, items, demo: true,
    total: items.reduce((s, i) => s + Math.round(i.price * 100) * i.qty, 0) / 100,
  });
  const have = new Set(existing.map((o) => o.id));
  const defs: Order[] = [
    mk(1, 4, "nuevo", "Lucía", "Mesa 4", [{ dishId: "paella", name: "Paella de mejillones", price: 17.5, qty: 2 }, { dishId: "hummus", name: "Hummus de la casa", price: 7.5, qty: 1 }], "Sin perejil, por favor"),
    mk(2, 12, "preparando", "Marcos", "Mesa 9", [{ dishId: "ramen", name: "Ramen picante", price: 13.9, qty: 1 }, { dishId: "gyoza", name: "Gyozas a la plancha", price: 8.9, qty: 1 }]),
    mk(3, 26, "listo", "Aitana", "Mesa 2", [{ dishId: "pannacotta", name: "Panna cotta con frutos rojos", price: 6.5, qty: 2 }]),
  ];
  const added: Order[] = [];
  for (const d of defs) if (!have.has(d.id)) { await put(ORD, d.id, d); added.push(d); }
  return [...existing, ...added];
}

export async function listOrders() {
  const rows = await seed(await all<Order>(ORD));
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createOrder(o: Omit<Order, "id" | "createdAt" | "status" | "total" | "demo">): Promise<Order> {
  const order: Order = {
    ...o,
    id: String(await nextSeq()).padStart(3, "0"),
    createdAt: Date.now(),
    status: "nuevo",
    total: o.items.reduce((s, i) => s + Math.round(i.price * 100) * i.qty, 0) / 100,
    demo: env.demo,
  };
  await put(ORD, order.id, order);
  return order;
}

export async function setStatus(id: string, status: OrderStatus) {
  const o = await getOne<Order>(ORD, id);
  if (!o) return null;
  o.status = status;
  await put(ORD, id, o);
  return o;
}

export async function createReservation(r: Omit<Reservation, "id" | "createdAt" | "demo">): Promise<Reservation> {
  const res = { ...r, id: "R" + String(await nextSeq()).padStart(3, "0"), createdAt: Date.now(), demo: env.demo };
  await put(RES, res.id, res);
  return res;
}

export async function notifyRestaurant(o: Order) {
  // Modo demo: nunca se envía email real.
  const lines = o.items.map((i) => `${i.qty} × ${i.name}`).join("\n");
  const text = `Pedido #${o.id} — ${o.customer} (${o.table})\n${lines}\nTotal: ${o.total.toFixed(2)} €\n${o.note}`;
  if (env.demo || !env.RESEND_API_KEY || !env.RESTAURANT_EMAIL) return console.log("[email no enviado]\n" + text);
  const { Resend } = await import("resend");
  await new Resend(env.RESEND_API_KEY).emails.send({
    from: process.env.RESEND_FROM ?? "Pedidos <onboarding@resend.dev>",
    to: env.RESTAURANT_EMAIL,
    subject: `Nuevo pedido #${o.id}`,
    text,
  });
}
