"use client";
import { useEffect, useState } from "react";
import { reservationSchema } from "@/lib/schemas";

const TIMES = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
const field = "w-full rounded-xl border border-linea bg-carbon2 px-4 py-3 text-base text-crema outline-none placeholder:text-crema2/60 focus:border-oro";

export default function Reservations() {
  const [today, setToday] = useState("");
  const [f, setF] = useState({ name: "", phone: "", date: "", time: "21:00", people: 2 });
  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10); // en el cliente: evita fijar la fecha en el prerenderizado
    setToday(t);
    setF((v) => (v.date ? v : { ...v, date: t }));
  }, []);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [fail, setFail] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFail("");
    const p = reservationSchema.safeParse(f);
    if (!p.success) {
      const m: Record<string, string> = {};
      for (const i of p.error.issues) m[String(i.path[0])] = i.path[0] === "phone" ? "Teléfono no válido" : "Revisa este campo";
      return setErr(m);
    }
    if (f.date < today) return setErr({ date: "La fecha ya ha pasado" });
    setErr({});
    setBusy(true);
    const r = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }).catch(() => null);
    setBusy(false);
    if (!r) return setFail("No hay conexión. Inténtalo de nuevo.");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setFail(j.error ?? "No se pudo guardar la reserva.");
    setDone(j);
  }

  const label = "mb-1 block text-xs tracking-wide text-crema2 uppercase";
  const fmt = f.date ? new Date(f.date + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <section id="reservas" className="border-y border-linea bg-carbon2 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <p className="text-xs tracking-[0.25em] text-oro uppercase">Reservas</p>
          <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Una mesa para esta noche</h2>
          <p className="mt-3 max-w-sm text-crema/80">Guardamos tu mesa quince minutos. Para grupos de más de ocho, escríbenos.</p>
          <p className="mt-6 rounded-xl border border-linea p-4 text-sm text-crema2">Esto es una demostración: la reserva no se envía a ningún restaurante real y se borra sola en 24 horas.</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-oro/50 bg-pizarra p-7" role="status">
            <p className="text-3xl">✓</p>
            <h3 className="font-display mt-2 text-2xl font-semibold">Mesa reservada</h3>
            <p className="mt-2 text-crema/85"><b>{f.people} {f.people === 1 ? "persona" : "personas"}</b> · {fmt} · {f.time}</p>
            <p className="text-crema/85">A nombre de {f.name}. Referencia {done.id}.</p>
            <button onClick={() => { setDone(null); setF({ ...f, name: "", phone: "" }); }} className="btn btn-linea mt-5">Hacer otra reserva</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-linea bg-pizarra p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="r-date" className={label}>Fecha</label>
                <input id="r-date" type="date" min={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} aria-invalid={!!err.date} />
                {err.date && <p className="mt-1 text-xs text-terracota-claro" role="alert">{err.date}</p>}
              </div>
              <div>
                <label htmlFor="r-time" className={label}>Hora</label>
                <select id="r-time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className={field}>
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="r-people" className={label}>Personas</label>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Una persona menos" onClick={() => setF({ ...f, people: Math.max(1, f.people - 1) })} className="h-11 w-11 rounded-full border border-linea text-xl">−</button>
                <output id="r-people" className="w-8 text-center text-lg">{f.people}</output>
                <button type="button" aria-label="Una persona más" onClick={() => setF({ ...f, people: Math.min(12, f.people + 1) })} className="h-11 w-11 rounded-full border border-linea text-xl">+</button>
              </div>
            </div>
            <div>
              <label htmlFor="r-name" className={label}>Nombre</label>
              <input id="r-name" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} placeholder="Tu nombre" aria-invalid={!!err.name} />
              {err.name && <p className="mt-1 text-xs text-terracota-claro" role="alert">{err.name}</p>}
            </div>
            <div>
              <label htmlFor="r-phone" className={label}>Teléfono</label>
              <input id="r-phone" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={field} placeholder="600 000 000" aria-invalid={!!err.phone} />
              {err.phone && <p className="mt-1 text-xs text-terracota-claro" role="alert">{err.phone}</p>}
            </div>
            {fail && <p className="text-sm text-terracota-claro" role="alert">{fail}</p>}
            <button disabled={busy} className="btn btn-oro disabled:opacity-60">{busy ? "Guardando…" : "Reservar mesa"}</button>
          </form>
        )}
      </div>
    </section>
  );
}
