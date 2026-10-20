import { restaurant } from "@/lib/dishes";

const BLOCKS: [number, number, number, number][] = [
  [18, 18, 112, 78], [148, 18, 104, 78], [270, 18, 132, 78],
  [18, 126, 112, 66], [290, 126, 112, 66],
  [18, 222, 112, 62], [148, 222, 104, 62], [270, 222, 132, 62],
];

/** Mapa dibujado a mano (sin Google Maps): manzanas, calles, plaza arbolada y un río alrededor del local. */
function Map() {
  return (
    <svg viewBox="0 0 420 300" className="h-full w-full" role="img" aria-label="Mapa estilizado: el local está en la Calle del Cuaderno, junto a la plaza">
      <defs>
        <radialGradient id="mp-luz" cx="50%" cy="38%" r="60%">
          <stop offset="0" stopColor="#e8913a" stopOpacity=".22" />
          <stop offset="1" stopColor="#e8913a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mp-rio" x1="0" x2="1">
          <stop offset="0" stopColor="#1f2e33" />
          <stop offset="1" stopColor="#263a40" />
        </linearGradient>
        <pattern id="mp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M0 0v6" stroke="#3a332b" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="420" height="300" fill="#1a1612" />
      <path d="M-10 296 C 80 270, 160 292, 240 280 S 380 262, 430 284 V 310 H -10Z" fill="url(#mp-rio)" />
      <path d="M-10 296 C 80 270, 160 292, 240 280 S 380 262, 430 284" fill="none" stroke="#3b5760" strokeWidth="1.5" opacity=".7" />
      {BLOCKS.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="8" fill="#26211c" stroke="#3a332b" />
          <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="5" fill="url(#mp-hatch)" opacity=".55" />
        </g>
      ))}
      <rect x="148" y="126" width="124" height="66" rx="30" fill="#25321f" stroke="#3f5232" />
      {[[176, 158, 7], [210, 150, 6], [238, 166, 7], [196, 176, 5], [254, 150, 5]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#4b6a37" opacity={0.9 - i * 0.08} />
      ))}
      <path d="M0 109h420M0 207h420M139 0v300M261 0v300" stroke="#4a4136" strokeWidth="2" strokeDasharray="1 7" fill="none" strokeLinecap="round" />
      <circle cx="205" cy="62" r="46" fill="url(#mp-luz)" />
      <text x="26" y="104" fontSize="9" fill="#bfb2a0" fontFamily="sans-serif" letterSpacing=".6">C. DEL CUADERNO</text>
      <text x="170" y="203" fontSize="9" fill="#bfb2a0" fontFamily="sans-serif" letterSpacing=".6">PLAZA DEL FARO</text>
      <text x="300" y="296" fontSize="8" fill="#6f8f98" fontFamily="sans-serif" letterSpacing="1.2" fontStyle="italic">río</text>
      <g transform="translate(205 100)">
        <ellipse cy="2" rx="9" ry="3" fill="#000" opacity=".45" />
        <path d="M0 0c-9-12-14-18-14-26a14 14 0 0 1 28 0c0 8-5 14-14 26z" fill="#c4572f" stroke="#15120f" strokeWidth="2" />
        <circle cy="-26" r="5" fill="#f3e9d8" />
      </g>
      <text x="226" y="66" fontSize="12" fontWeight="700" fill="#e8c27a" fontFamily="serif">Lumbre Errante</text>
      <g transform="translate(386 34)" fill="none" stroke="#bfb2a0" strokeWidth="1.2">
        <circle r="13" opacity=".5" />
        <path d="M0 -9 L4 3 L0 0 L-4 3Z" fill="#e8c27a" stroke="none" />
        <text y="-17" fontSize="8" fill="#bfb2a0" stroke="none" textAnchor="middle" fontFamily="sans-serif">N</text>
      </g>
    </svg>
  );
}

export default function Contact() {
  return (
    <section id="contacto" className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs tracking-[0.25em] text-oro uppercase">Horario y contacto</p>
      <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">Dónde encontrarnos</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="aspect-[7/5] overflow-hidden rounded-2xl border border-linea shadow-xl shadow-black/30"><Map /></div>
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-lg text-oro-claro">Horario</h3>
            <dl className="mt-2 divide-y divide-linea/70 text-sm">
              {restaurant.hours.map((h) => (
                <div key={h.d} className="flex justify-between gap-4 py-2"><dt className="text-crema2">{h.d}</dt><dd>{h.h}</dd></div>
              ))}
            </dl>
          </div>
          <address className="space-y-1 text-sm not-italic">
            <h3 className="font-display text-lg text-oro-claro">Contacto</h3>
            <p>{restaurant.address}</p>
            <p>Tel. {restaurant.phone}</p>
            <p>{restaurant.email}</p>
          </address>
        </div>
      </div>
    </section>
  );
}
