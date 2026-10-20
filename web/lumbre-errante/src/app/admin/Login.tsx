"use client";
import { useState } from "react";

export default function Login() {
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: p }) });
    if (r.ok) location.reload();
    else setErr(true);
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-2xl font-semibold">Panel del restaurante</h1>
      <form onSubmit={go} className="mt-6 space-y-3">
        <label htmlFor="pw" className="sr-only">Contraseña</label>
        <input id="pw" type="password" autoFocus value={p} onChange={(e) => setP(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl border border-linea bg-carbon2 px-4 py-3 text-crema outline-none focus:border-oro" />
        {err && <p className="text-sm text-terracota-claro" role="alert">Contraseña incorrecta</p>}
        <button className="btn btn-oro w-full">Entrar</button>
      </form>
    </main>
  );
}
