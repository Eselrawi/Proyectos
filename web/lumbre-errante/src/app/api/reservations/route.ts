import { NextResponse } from "next/server";
import { clientIp, limited } from "@/lib/ratelimit";
import { createReservation } from "@/lib/orders";
import { reservationSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  if (limited("res:" + clientIp(req), 5, 10 * 60_000)) return NextResponse.json({ error: "Demasiadas reservas seguidas. Espera unos minutos." }, { status: 429 });
  const parsed = reservationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la reserva." }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.date < today) return NextResponse.json({ error: "La fecha ya ha pasado." }, { status: 400 });
  const r = await createReservation(parsed.data);
  return NextResponse.json({ id: r.id });
}
