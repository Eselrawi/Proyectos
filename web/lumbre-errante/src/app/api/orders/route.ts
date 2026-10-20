import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createOrder, listOrders, notifyRestaurant } from "@/lib/orders";
import { dishes } from "@/lib/dishes";
import { clientIp, limited } from "@/lib/ratelimit";
import { orderSchema } from "@/lib/schemas";
import { priceItems } from "@/lib/totals";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  return NextResponse.json(await listOrders(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (limited("order:" + clientIp(req), 8, 10 * 60_000)) return NextResponse.json({ error: "Demasiados pedidos seguidos. Espera unos minutos." }, { status: 429 });
  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Faltan datos: nombre, mesa o teléfono y algún plato." }, { status: 400 });
  const { items: raw, ...rest } = parsed.data;
  const items = priceItems(raw, dishes); // precios siempre del servidor
  if (!items.length) return NextResponse.json({ error: "Platos no válidos" }, { status: 400 });
  const order = await createOrder({ ...rest, items });
  notifyRestaurant(order).catch((e) => console.error("email", e));
  return NextResponse.json({ id: order.id, total: order.total });
}
