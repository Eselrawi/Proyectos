import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'

/* Una parada del recorrido. La sección es más alta que la pantalla y su contenido
   queda fijo (sticky) mientras la cámara se detiene en la rama correspondiente.
   side: 'left' | 'right' | 'center' → lado donde va la tarjeta de texto. */
export default function Stop({ id, side = 'left', className = '', fadeIn = true, fadeOut = true, labelledBy, children }) {
  const root = useRef(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return
    const card = root.current.querySelector('.stop-card')
    const split = root.current.querySelectorAll('.split .char')
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    })
    // Línea de tiempo normalizada a 1: entra en el primer tramo, sale en el último
    if (fadeIn) {
      tl.fromTo(card, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.2)
      if (split.length) tl.from(split, { yPercent: 60, opacity: 0, stagger: 0.004, duration: 0.1, ease: 'power2.out' }, 0.24)
    }
    if (fadeOut) {
      tl.to(card, { opacity: 0, y: -70, duration: 0.16, ease: 'power2.in' }, 0.66)
    }
    tl.set({}, {}, 1)
  }, { scope: root })

  return (
    <section id={id} data-stop className={`stop ${className}`} data-side={side} aria-labelledby={labelledBy} ref={root}>
      <div className="stop-inner wrap">{children}</div>
    </section>
  )
}

// Título troceado en letras para la entrada animada (accesible: aria-label con el texto completo)
export function SplitTitle({ as: Tag = 'h2', id, className = '', children }) {
  const words = String(children).split(' ')
  return (
    <Tag id={id} className={`split ${className}`} aria-label={children}>
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="word" aria-hidden="true">
            {w.split('').map((c, ci) => <span className="char" key={ci}>{c}</span>)}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}
