import logo from '../assets/img/logo-placeholder.svg'
import { business, photoCredit } from '../data/business'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <img src={logo} width="48" height="48" alt="Logotipo provisional de Alquinaterra" />
          <p>
            <strong>{business.name}</strong><br />
            {business.category}<br />
            {business.street} · {business.postal} {business.city} ({business.region})<br />
            {business.phone}
          </p>
        </div>
        <div className="footer-legal">
          <p className="small">La información de esta web es general y orientativa. No sustituye el consejo de un profesional sanitario ni constituye diagnóstico o tratamiento.</p>
          <details>
            <summary>Aviso legal y privacidad</summary>
            {/* [PENDIENTE] Datos identificativos obligatorios (LSSI art. 10) a facilitar por el cliente */}
            <div className="legal-body">
              <p><strong>Titular:</strong> [RAZÓN SOCIAL PENDIENTE] · <strong>NIF:</strong> [PENDIENTE]<br />
                <strong>Domicilio:</strong> {business.street}, {business.postal} {business.city} ({business.region})<br />
                <strong>Contacto:</strong> {business.phone} · [EMAIL PENDIENTE]</p>
              <p>Esta web es informativa: no recoge datos personales mediante formularios ni instala cookies de analítica o publicidad. La preferencia de modo claro u oscuro se guarda solo en tu navegador.</p>
              <p>Los enlaces a Google Maps e Instagram llevan a servicios de terceros, con sus propias políticas de privacidad.</p>
            </div>
          </details>
          {/* [PRUEBA] Quitar este crédito al sustituir las fotos de prueba */}
          <p className="small">Fotos de prueba (no son de la tienda): {photoCredit}.</p>
          <p className="small">© {new Date().getFullYear()} {business.name}</p>
        </div>
      </div>
    </footer>
  )
}
