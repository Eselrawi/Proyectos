import { lazy, Suspense, useEffect, useState } from 'react'

// Escena 3D fija de fondo. Se descarga después del primer pintado.
// Mientras carga (o si no hay WebGL) se ve una imagen fija del mismo árbol renderizado,
// así nunca aparece en blanco. La imagen se elige por tema y tamaño de pantalla.
const TreeScene = lazy(() => import('../three/TreeScene'))
const POSTERS = import.meta.glob('../assets/tree/poster-*.jpg', { eager: true, query: '?url', import: 'default' })
const poster = (name) => POSTERS[`../assets/tree/poster-${name}.jpg`]

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function TreeStage() {
  const [load, setLoad] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasWebGL()) return
    let id
    const go = () => {
      id = 'requestIdleCallback' in window ? requestIdleCallback(() => setLoad(true), { timeout: 1200 }) : setTimeout(() => setLoad(true), 300)
    }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => {
      window.removeEventListener('load', go)
      if (id && 'cancelIdleCallback' in window) cancelIdleCallback(id)
    }
  }, [])

  return (
    <div className={`tree-stage${ready ? ' is-ready' : ''}`}>
      <picture className="tree-poster" aria-hidden="true">
        {poster('dark-mobile') && <source media="(prefers-color-scheme: dark) and (max-width: 899px)" srcSet={poster('dark-mobile')} />}
        {poster('dark-desktop') && <source media="(prefers-color-scheme: dark)" srcSet={poster('dark-desktop')} />}
        {poster('light-mobile') && <source media="(max-width: 899px)" srcSet={poster('light-mobile')} />}
        {poster('light-desktop') && <img src={poster('light-desktop')} alt="" decoding="async" fetchpriority="high" />}
      </picture>
      {load && (
        <Suspense fallback={null}>
          <TreeScene onReady={() => setReady(true)} />
        </Suspense>
      )}
    </div>
  )
}
