import logo from '../assets/img/logo-placeholder.svg'
import { business } from '../data/business'
import { toggleTheme } from '../lib/theme'

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a className="brand" href="#inicio" aria-label="Alquinaterra, ir al inicio">
          {/* [PENDIENTE] logo definitivo del cliente */}
          <img src={logo} width="40" height="40" alt="Logotipo provisional de Alquinaterra" />
          <span className="brand-name">Alquinaterra</span>
        </a>
        <nav className="nav" aria-label="Principal">
          <a href="#ofrecemos">Qué ofrecemos</a>
          <a href="#resenas">Reseñas</a>
          <a href="#horario">Horario</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Cambiar entre modo claro y oscuro">
            <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
            </svg>
            <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            </svg>
          </button>
          <a className="btn btn-small" href={business.phoneHref}>Llamar</a>
        </div>
      </div>
    </header>
  )
}
