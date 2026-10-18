import { useEffect, useState } from 'react'

/* Estado del recorrido compartido entre el DOM y la escena 3D, sin re-renderizar React.
   stop   → posición continua en el recorrido (0 = copa … n-1 = raíces).
            Se "detiene" en cada parada mientras su tarjeta está fija en pantalla.
   px/py  → ratón normalizado (-1..1), solo para el parallax de escritorio. */
export const store = { stop: 0, active: 0, px: 0, py: 0 }
if (import.meta.env.DEV) window.__alqStore = store // depuración (solo en desarrollo)
const listeners = new Set()
let centers = []

const smooth = (t) => t * t * (3 - 2 * t)

function measure() {
  const els = [...document.querySelectorAll('[data-stop]')]
  const vh = window.innerHeight
  centers = els.map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    return top + Math.max(0, el.offsetHeight - vh) / 2
  })
  if (centers.length) centers[0] = 0
}

function stopAt(y) {
  if (!centers.length || y <= centers[0]) return 0
  for (let i = 0; i < centers.length - 1; i++) {
    if (y < centers[i + 1]) {
      const f = (y - centers[i]) / (centers[i + 1] - centers[i])
      // Pausa en cada parada: la cámara se queda quieta al principio y al final del tramo
      const g = f < 0.18 ? 0 : f > 0.82 ? 1 : smooth((f - 0.18) / 0.64)
      return i + g
    }
  }
  return centers.length - 1
}

function update() {
  store.stop = stopAt(window.scrollY)
  const a = Math.round(store.stop)
  if (a !== store.active) {
    store.active = a
    listeners.forEach((fn) => fn(a))
  }
}

export function initStopTracker() {
  measure()
  update()
  const onResize = () => { measure(); update() }
  const onMove = (e) => {
    store.px = (e.clientX / window.innerWidth) * 2 - 1
    store.py = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', onResize)
  window.addEventListener('pointermove', onMove, { passive: true })
  const ro = new ResizeObserver(onResize)
  ro.observe(document.body)
  return () => {
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onMove)
    ro.disconnect()
  }
}

// Parada activa (entera) para la interfaz
export function useActiveStop() {
  const [a, setA] = useState(store.active)
  useEffect(() => {
    listeners.add(setA)
    return () => listeners.delete(setA)
  }, [])
  return a
}
