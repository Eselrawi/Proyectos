import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { setStatus } from "@/lib/orders";
import { statusSchema } from "@/lib/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const parsed = statusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "estado no válido" }, { status: 400 });
  const { id } = await params;
  return NextResponse.json((await setStatus(id, parsed.data.status)) ?? null);
}
