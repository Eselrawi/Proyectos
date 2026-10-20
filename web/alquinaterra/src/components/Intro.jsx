import { BranchPaths } from './Icons'

// Intro: la rama se dibuja y la cortina sube. Animación CSS pura:
// se retira sola aunque falle el JS. Una vez por sesión (ver index.html).
export default function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <svg className="intro-art" viewBox="0 0 200 200">
        <BranchPaths />
      </svg>
      <p className="intro-word">Alquinaterra</p>
    </div>
  )
}
