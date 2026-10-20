"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartTotal, money, useCart } from "@/lib/cart";

const LINKS = [
  { href: "/#carta", label: "Carta" },
  { href: "/#oferta", label: "Qué ofrezco" },
  { href: "/#reservas", label: "Reservas" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Header() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const total = useCart((s) => cartTotal(s.lines));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    // QR de mesa: /mesa/N redirige a /?mesa=N; se recuerda para rellenar el pedido
    try {
      const m = new URLSearchParams(window.location.search).get("mesa");
      if (m && /^\d{1,2}$/.test(m)) localStorage.setItem("mesa", m);
    } catch { /* sin almacenamiento */ }
  }, []);
  const n = ready ? count : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-linea/70 bg-carbon/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Lumbre Errante, inicio">
            <Image src="/brand/logo-dark.svg" alt="" width={34} height={34} priority />
            <span className="font-display text-lg font-semibold tracking-tight">Lumbre Errante</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-crema2 md:flex" aria-label="Principal">
            {LINKS.map((l) => <Link key={l.href} href={l.href} className="hover:text-crema">{l.label}</Link>)}
          </nav>
          <Link href="/cesta" data-cart className="btn btn-oro !px-4 !py-2 text-sm" aria-label={`Cesta, ${n} platos`}>
            Cesta
            {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-carbon px-1 text-xs text-oro">{n}</span>}
          </Link>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-linea bg-carbon/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Navegación móvil">
        {[
          { href: "/#inicio", label: "Inicio", d: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
          { href: "/#carta", label: "Carta", d: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 8h6M9 12h6" },
          { href: "/#reservas", label: "Reservar", d: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" },
          { href: "/cesta", label: "Cesta", d: "M5 8h14l-1.2 11H6.2zM9 8a3 3 0 0 1 6 0" },
        ].map((l) => (
          <Link key={l.label} href={l.href} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-crema2 active:text-oro">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={l.d} /></svg>
            {l.label === "Cesta" && n > 0 ? money(total) : l.label}
            {l.label === "Cesta" && n > 0 && <span className="absolute top-1.5 right-[28%] grid h-4 min-w-4 place-items-center rounded-full bg-terracota px-1 text-[10px] text-white">{n}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}
