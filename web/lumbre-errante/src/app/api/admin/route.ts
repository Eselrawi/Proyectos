import { NextResponse } from "next/server";
import { adminCookieValue, checkPassword } from "@/lib/auth";
import { clientIp, limited } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (limited("login:" + clientIp(req), 10, 10 * 60_000)) return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!checkPassword(String(password ?? ""))) return NextResponse.json({ error: "contraseña incorrecta" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", adminCookieValue(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
