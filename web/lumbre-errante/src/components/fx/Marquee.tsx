/** Cinta de texto infinita (CSS puro, se pausa al pasar el ratón). */
export default function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (k: string) => (
    <ul key={k} aria-hidden={k === "b"} className="marquee-row flex shrink-0 items-center gap-10 pr-10">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-10 whitespace-nowrap">
          {t}
          <span className="text-terracota">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee flex overflow-hidden ${className ?? ""}`}>
      {row("a")}
      {row("b")}
    </div>
  );
}
