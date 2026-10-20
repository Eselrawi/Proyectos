import { stops } from '../data/business'
import { useActiveStop } from '../lib/scrollStore'

// Indicador lateral: en qué altura del árbol estás (de la copa a las raíces). Solo escritorio.
export default function DepthNav() {
  const active = useActiveStop()
  return (
    <nav className="depth" aria-label="Recorrido por el árbol">
      <ol>
        {stops.map((s, i) => (
          <li key={s.id} className={i === active ? 'is-active' : ''}>
            <a href={`#${s.id}`} aria-current={i === active ? 'step' : undefined}>
              <span className="depth-label">{s.label}</span>
              <span className="depth-dot" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
