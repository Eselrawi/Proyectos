"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { dishes } from "@/lib/dishes";
import { ALLERGENS, type Order, type OrderStatus } from "@/lib/types";
import { money } from "@/lib/cart";

const NEXT: Record<OrderStatus, OrderStatus | null> = { nuevo: "preparando", preparando: "listo", listo: null };
const COLOR: Record<OrderStatus, string> = { nuevo: "bg-terracota text-white", preparando: "bg-oro text-carbon", listo: "bg-[#4b6a37] text-white" };
const COLS: OrderStatus[] = ["nuevo", "preparando", "listo"];

export default function Panel({ demo = false }: { demo?: boolean }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState<"pedidos" | "platos">("pedidos");
  const fails = useRef(0);
  const seen = useRef(new Set<string>());
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/orders", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const list = (await r.json()) as Order[];
      fails.current = 0;
      setOnline(true);
      const novel = list.find((o) => !seen.current.has(o.id) && seen.current.size > 0 && o.status === "nuevo");
      list.forEach((o) => seen.current.add(o.id));
      if (novel) { setFresh(novel.id); setTimeout(() => setFresh(null), 4000); }
      setOrders(list);
    } catch {
      if (++fails.current >= 2) setOnline(false);
    }
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!document.hidden) await load();
      // espera creciente si hay fallos (reconexión sin saturar)
      t = setTimeout(tick, Math.min(15000, 1500 * 2 ** Math.min(fails.current, 3)));
    };
    tick();
    const vis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("online", vis);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", vis); window.removeEventListener("online", vis); };
  }, [load]);

  async function advance(o: Order) {
    const s = NEXT[o.status];
    if (!s) return;
    setOrders((v) => v?.map((x) => (x.id === o.id ? { ...x, status: s } : x)) ?? v);
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) }).catch(() => load());
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-xs text-crema2 hover:text-crema">← Web del restaurante</Link>
          <h1 className="font-display text-2xl font-semibold">Panel de cocina {demo && <span className="ml-2 rounded-full bg-oro px-2.5 py-0.5 align-middle font-sans text-xs text-carbon">Demo</span>}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs ${online ? "text-crema2" : "text-terracota-claro"}`} role="status">
            <span className={`h-2 w-2 rounded-full ${online ? "bg-[#6f9b52]" : "animate-pulse bg-terracota"}`} />
            {online ? "En directo" : "Reconectando…"}
          </span>
          <div className="flex gap-1 rounded-full border border-linea p-1 text-sm">
            {(["pedidos", "platos"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`rounded-full px-4 py-1.5 capitalize ${tab === t ? "bg-oro text-carbon" : "text-crema2"}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {tab === "pedidos" ? (
        orders === null ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Cargando pedidos">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
        ) : !orders.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-linea p-10 text-center">
            <p className="font-display text-xl">Todavía no hay pedidos</p>
            <p className="mt-1 text-sm text-crema2">Cuando alguien pida desde la carta, aparecerá aquí al instante.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {COLS.map((c) => (
              <section key={c} aria-label={c}>
                <h2 className="mb-2 flex items-center gap-2 text-xs tracking-widest text-crema2 uppercase">
                  <span className={`rounded-full px-2.5 py-0.5 ${COLOR[c]}`}>{c}</span>
                  {orders.filter((o) => o.status === c).length}
                </h2>
                <ul className="space-y-3">
                  {orders.filter((o) => o.status === c).map((o) => (
                    <li key={o.id} className={`rounded-2xl border bg-pizarra p-4 transition-colors ${fresh === o.id ? "border-oro shadow-[0_0_0_3px_rgba(212,162,76,.25)]" : "border-linea"}`}>
                      <div className="flex items-baseline justify-between">
                        <p className="font-medium">#{o.id} · {o.customer}</p>
                        <p className="text-xs text-crema2">{o.table}</p>
                      </div>
                      <ul className="mt-2 text-sm text-crema/85">{o.items.map((i) => <li key={i.dishId}>{i.qty} × {i.name}</li>)}</ul>
                      {o.note && <p className="mt-2 text-sm text-oro-claro italic">«{o.note}»</p>}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-display text-lg">{money(o.total)}</span>
                        {NEXT[o.status] && <button onClick={() => advance(o)} className="btn btn-oro !px-4 !py-1.5 text-sm">Pasar a {NEXT[o.status]}</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-crema2">Los platos se editan en <code>data/menu.json</code>; los modelos 3D están en <code>public/scans/</code>. En producción esta lista se conecta a una base de datos.</p>
          {dishes.map((d) => (
            <details key={d.id} className="rounded-2xl border border-linea bg-pizarra p-4">
              <summary className="cursor-pointer font-medium">{d.name} · {money(d.price)} <span className="text-sm text-crema2">({d.country})</span></summary>
              <ul className="mt-3 space-y-1 text-sm">
                {d.ingredients.map((g) => (
                  <li key={g.id}><b>{g.name}</b> <span className="text-crema2">({g.category})</span> — {g.allergens.map((a) => ALLERGENS[a]).join(", ") || "sin alérgenos"}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
