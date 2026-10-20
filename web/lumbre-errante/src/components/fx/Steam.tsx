/** Vapor sobre el plato: tres volutas borrosas que suben y se disuelven. */
export default function Steam() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[6%] flex justify-center gap-10 motion-reduce:hidden">
      {[0, 1, 2].map((i) => (
        <span key={i} className="steam" style={{ animationDelay: `${i * 1.6}s`, marginTop: i === 1 ? "-1.5rem" : 0 }} />
      ))}
    </div>
  );
}
