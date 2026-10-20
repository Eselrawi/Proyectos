"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cartTotal, money, useCart } from "@/lib/cart";
import Header from "@/components/site/Header";

const DEMO = process.env.NEXT_PUBLIC_DEMO !== "false";
const field = "w-full rounded-xl border border-linea bg-carbon2 px-4 py-3 text-base text-crema outline-none placeholder:text-crema2/60 focus:border-oro";

function Cesta() {
  const { lines, setQty, clear } = useCart();
  const param = useSearchParams().get("mesa");
  const [mesa, setMesa] = useState<string | null>(param);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (param) return;
    try { setMesa(localStorage.getItem("mesa")); } catch { /* sin almacenamiento */ }
  }, [param]);
  const [form, setForm] = useState({ customer: "", table: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; total: number } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => setReady(true), []);
  useEffect(() => { if (mesa) setForm((f) => ({ ...f, table: `Mesa ${mesa}` })); }, [mesa]);
  const total = cartTotal(lines);

  async function submit() {
    setErr("");
    if (!form.customer.trim() || !form.table.trim()) return setErr("Escribe tu nombre y la mesa o un teléfono.");
    setBusy(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: lines.map((l) => ({ dishId: l.dishId, qty: l.qty })) }),
    }).catch(() => null);
    setBusy(false);
    if (!r) return setErr("No hay conexión. Tu cesta sigue aquí; inténtalo de nuevo.");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error ?? "No se pudo enviar el pedido.");
    setDone(j);
    clear();
  }

  if (done)
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center" role="status">
        <p className="text-4xl">✓</p>
        <h1 className="font-display mt-3 text-3xl font-semibold">Pedido enviado</h1>
        <p className="mt-2 text-crema/85">Pedido nº {done.id} · {money(done.total)}. Ya lo tiene la cocina.</p>
        {DEMO && (
          <div className="mt-8 rounded-2xl border border-oro/50 bg-pizarra p-6">
            <h2 className="font-display text-xl text-oro-claro">Así le llegaría a tu cocina</h2>
            <p className="mt-2 text-sm text-crema/80">Abre el panel del restaurante en otra pantalla: tu pedido aparece al instante y se pasa de «nuevo» a «preparando» y «listo» con un toque.</p>
            <Link href="/panel/demo" className="btn btn-oro mt-4">Ver el panel del restaurante</Link>
          </div>
        )}
        <Link href="/" className="btn btn-linea mt-6">Volver a la carta</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-xl px-4 py-8 pb-28">
      <Link href="/#carta" className="text-sm text-crema2 hover:text-crema">← Seguir mirando la carta</Link>
      <h1 className="font-display mt-2 text-3xl font-semibold">Tu cesta</h1>
      {!ready ? (
        <div className="mt-6 space-y-3" aria-hidden>{[0, 1].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : !lines.length ? (
        <div className="mt-8 rounded-2xl border border-dashed border-linea p-8 text-center">
          <p className="font-display text-xl">Tu cesta está vacía</p>
          <p className="mt-1 text-sm text-crema2">Elige algún plato de la carta.</p>
          <Link href="/#carta" className="btn btn-oro mt-4">Ver carta</Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-linea/70 rounded-2xl border border-linea bg-carbon2 px-4">
            {lines.map((l) => (
              <li key={l.dishId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="text-sm text-crema2">{money(l.price)} · {money(l.price * l.qty)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label={`Quitar uno de ${l.name}`} onClick={() => setQty(l.dishId, l.qty - 1)} className="h-10 w-10 rounded-full border border-linea text-lg">−</button>
                  <span className="w-6 text-center" aria-live="polite">{l.qty}</span>
                  <button aria-label={`Añadir uno de ${l.name}`} onClick={() => setQty(l.dishId, l.qty + 1)} className="h-10 w-10 rounded-full border border-linea text-lg">+</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-3">
            <label className="block"><span className="sr-only">Nombre</span><input className={field} autoComplete="name" placeholder="Tu nombre" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></label>
            <label className="block"><span className="sr-only">Mesa o teléfono</span><input className={field} placeholder="Mesa o teléfono" value={form.table} onChange={(e) => setForm({ ...form, table: e.target.value })} /></label>
            <label className="block"><span className="sr-only">Nota</span><textarea className={field} rows={2} placeholder="Nota (opcional): sin cebolla, alergias…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
          </div>
          {err && <p className="mt-3 text-sm text-terracota-claro" role="alert">{err}</p>}
          <button disabled={busy} onClick={submit} className="btn btn-terra mt-5 w-full disabled:opacity-60">
            {busy ? "Enviando…" : `Hacer pedido · ${money(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-crema2">Pago en el local. IVA incluido.</p>
        </>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <Suspense><Cesta /></Suspense>
    </>
  );
}
