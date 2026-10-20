"use client";
import { useEffect, useState } from "react";
import { contactHref } from "@/lib/contact";

const DEMO = process.env.NEXT_PUBLIC_DEMO !== "false";

export function DemoBand() {
  if (!DEMO) return null;
  return (
    <div className="bg-oro px-4 py-1.5 text-center text-xs font-medium text-carbon" role="note">
      Demo · Restaurante ficticio
    </div>
  );
}

export function DemoCTA() {
  // En móvil el botón espera a que se pase la portada para no tapar el plato.
  const [late, setLate] = useState(false);
  useEffect(() => {
    const on = () => setLate(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (!DEMO) return null;
  return (
    <a
      href={contactHref}
      className={`btn btn-terra fixed right-3 bottom-[76px] z-30 !px-4 !py-2.5 text-sm shadow-2xl shadow-black/60 transition-[opacity,transform] duration-300 md:right-6 md:bottom-6 md:translate-y-0 md:opacity-100 md:pointer-events-auto ${
        late ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      Quiero esto para mi restaurante
    </a>
  );
}
