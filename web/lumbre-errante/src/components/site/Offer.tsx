"use client";
import { contactHref } from "@/lib/contact";
import { Reveal, Tilt } from "./Fx";
import SplitText from "@/components/fx/SplitText";

const I = (d: string) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const FEATURES = [
  {
    t: "Carta en 3D",
    d: "Cada plato se escanea y se puede girar con el dedo o el ratón. El cliente ve lo que va a comer antes de pedirlo.",
    icon: I("M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10"),
    big: true,
  },
  {
    t: "Realidad aumentada",
    d: "El plato aparece en la mesa del cliente a tamaño real, desde el móvil y sin instalar nada.",
    icon: I("M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M12 8l4 2v4l-4 2-4-2v-4z"),
  },
  {
    t: "Ingredientes y alérgenos",
    d: "Puntos sobre el plato con cada ingrediente y sus alérgenos. Filtros por dieta: vegetariano, vegano, sin gluten.",
    icon: I("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16v.01"),
  },
  {
    t: "Pedidos desde la mesa",
    d: "Cesta y pedido sin esperar al camarero. Menos tiempo perdido y tickets más altos.",
    icon: I("M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 20a1 1 0 1 0 0-.01M18 20a1 1 0 1 0 0-.01"),
  },
  {
    t: "Reservas online",
    d: "Formulario de reservas con aviso al restaurante. Sin llamadas ni mensajes sueltos.",
    icon: I("M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"),
  },
  {
    t: "Panel para el dueño",
    d: "Cambia precios, platos y alérgenos tú mismo, sin llamar a nadie y sin tocar código.",
    icon: I("M4 5h16v11H4zM8 20h8M12 16v4"),
    wide: true,
  },
];

const STEPS = [
  { n: "01", t: "Escaneamos tus platos", d: "Los modelos 3D salen de tus platos reales, no de fotos con efecto." },
  { n: "02", t: "Montamos tu carta", d: "Con tu marca, tus precios, tus alérgenos y tus fotos." },
  { n: "03", t: "Tus clientes la usan", d: "Un código QR en la mesa y la carta se abre en el móvil." },
];

export default function Offer() {
  return (
    <section id="oferta" className="mx-auto max-w-6xl px-4 py-20">
      <Reveal>
        <p className="text-xs tracking-[0.3em] text-oro uppercase">Qué ofrezco</p>
      </Reveal>
      <div className="mt-2 grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
        <SplitText text="Una carta que se ve, se toca y se pide" className="font-display text-4xl leading-[1.05] font-semibold sm:text-6xl" />
        <Reveal delay={0.1}>
          <p className="max-w-md text-crema/80">
            Esta web es una demo de lo que puedo montar para tu restaurante: la carta en 3D con tus platos escaneados, pedidos y reservas en un mismo sitio.
          </p>
        </Reveal>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <li key={f.t} className={f.big ? "lg:col-span-2" : f.wide ? "sm:col-span-2 lg:col-span-3" : ""}>
            <Reveal delay={(i % 3) * 0.08}>
              <Tilt max={4}>
                <div className="group h-full rounded-2xl border border-linea bg-carbon2 p-6 transition-colors hover:border-oro/60">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-oro/10 text-oro-claro transition-colors group-hover:bg-oro group-hover:text-carbon">{f.icon}</span>
                  <h3 className="font-display mt-4 text-xl font-semibold text-crema">{f.t}</h3>
                  <p className="mt-1.5 max-w-lg text-sm text-crema/80">{f.d}</p>
                </div>
              </Tilt>
            </Reveal>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="h-full border-t border-linea pt-4">
              <p className="font-display text-3xl text-oro">{s.n}</p>
              <h3 className="mt-1 font-semibold text-crema">{s.t}</h3>
              <p className="mt-1 text-sm text-crema/75">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-oro/40 bg-gradient-to-r from-oro/10 to-transparent p-6">
          <p className="font-display text-2xl font-semibold">¿Quieres esto para tu restaurante?</p>
          <a href={contactHref} className="btn btn-terra !px-7 !py-3.5">Hablamos</a>
        </div>
      </Reveal>
    </section>
  );
}
