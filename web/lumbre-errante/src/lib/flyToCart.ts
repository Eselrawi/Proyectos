/** El plato sale del botón "Añadir" y vuela hasta la cesta de la cabecera; el contador rebota al llegar. */
export function flyToCart(from: HTMLElement | null, src: string) {
  const target = document.querySelector<HTMLElement>("[data-cart]");
  if (!from || !target) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 64;
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - x0;
  const dy = b.top + b.height / 2 - size / 2 - y0;

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  Object.assign(img.style, {
    position: "fixed", left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px`,
    borderRadius: "999px", objectFit: "cover", zIndex: "80", pointerEvents: "none",
    boxShadow: "0 10px 30px rgba(0,0,0,.55)",
  });
  document.body.appendChild(img);

  // Arco: sube un poco a mitad de camino antes de caer en la cesta
  const fly = img.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(.8)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.4 },
    ],
    { duration: 750, easing: "cubic-bezier(.5,0,.3,1)" },
  );
  fly.onfinish = () => {
    img.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }],
      { duration: 420, easing: "ease-out" },
    );
  };
}
