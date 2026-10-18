import { useRef, useState } from 'react'
import { business, branches, hours, heroLede } from '../data/business'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import Stop, { SplitTitle } from './Stop'
import { PhoneIcon } from './Icons'

// Lado de la tarjeta en cada rama: alterna (la rama sale hacia el lado contrario)
const cardSide = (i) => (i % 2 === 0 ? 'left' : 'right')

/* ---------- Copa: portada ---------- */
export function CanopyStop() {
  const root = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    const d = document.documentElement.classList.contains('no-intro') ? 0.15 : 1.75
    gsap.from('.display .char', {
      yPercent: 70, rotate: 7, opacity: 0, transformOrigin: '0% 100%',
      duration: 1.2, ease: 'expo.out', stagger: 0.045, delay: d,
    })
    gsap.from(['.specimen', '.hero-lede', '.hero-ctas'], {
      y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: d + 0.45,
    })
  }, { scope: root })

  return (
    <div ref={root}>
      <Stop id="inicio" side="left" className="stop-canopy" fadeIn={false} labelledBy="hero-title">
        <div className="canopy-copy stop-card">
          {/* [REAL] localidad. Coordenadas aproximadas del municipio (no del local) */}
          <p className="specimen" aria-label="Galapagar, Sierra de Guadarrama">
            <span>Galapagar</span><span aria-hidden="true">·</span><span>40°34′ N&nbsp;&nbsp;4°00′ O</span>
          </p>
          <h1 id="hero-title" className="display" aria-label={business.name}>
            <span className="word" aria-hidden="true">
              {business.name.split('').map((c, i) => <span className="char" key={i}>{c}</span>)}
            </span>
          </h1>
          <div className="hero-card">
            {/* [EJEMPLO] frase del hero */}
            <p className="hero-lede">{heroLede}</p>
            <div className="hero-ctas">
              <a className="btn" href={business.phoneHref}><PhoneIcon /> Llamar · {business.phone}</a>
              {business.whatsapp && (
                <a className="btn btn-ghost" href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>
              )}
              <a className="btn btn-ghost" href={business.mapsUrl} target="_blank" rel="noopener">Cómo llegar</a>
            </div>
          </div>
        </div>
      </Stop>
    </div>
  )
}

/* ---------- Ramas de producto ---------- */
export function BranchStops() {
  return branches.map((b, i) => (
    <Stop key={b.id} id={b.id} side={cardSide(i)} labelledBy={`${b.id}-title`}>
      <article className="stop-card">
        <p className="eyebrow">Rama {i + 1} · En la tienda</p>
        <SplitTitle id={`${b.id}-title`} className="h2">{b.title}</SplitTitle>
        <p className="card-text">{b.text}</p>
        {b.photo && (
          <figure className="card-photo">
            <img src={b.photo.src} alt={b.photo.alt} loading="lazy" />
            {/* [PRUEBA] foto de Unsplash, no es de la tienda */}
            {b.photo.test && <figcaption className="test-badge">Foto de prueba</figcaption>}
          </figure>
        )}
      </article>
    </Stop>
  ))
}

/* ---------- Rama 5: reseñas ---------- */
export function ReviewsStop() {
  const i = branches.length
  return (
    <Stop id="resenas" side={cardSide(i)} labelledBy="resenas-title">
      <article className="stop-card">
        <p className="eyebrow">Rama {i + 1} · Opiniones</p>
        <div className="score-row">
          {/* [REAL] 4,7 sobre 60 reseñas, verificado en Google Maps */}
          <p className="score" aria-hidden="true">4,7</p>
          <div>
            <span className="stars stars-lg" style={{ '--r': business.rating }} role="img" aria-label="4,7 de 5 estrellas" />
            <p className="score-meta">{business.reviews} reseñas en Google</p>
          </div>
        </div>
        <SplitTitle id="resenas-title" className="h3">Lo que dicen quienes ya vienen</SplitTitle>
        <p className="card-text">Puedes leer todas las opiniones en Google Maps y, si ya nos conoces, dejar la tuya.</p>
        <div className="hero-ctas">
          <a className="btn" href={business.reviewUrl} target="_blank" rel="noopener">Dejar una reseña</a>
          <a className="btn btn-ghost" href={business.reviewUrl} target="_blank" rel="noopener">Leer reseñas</a>
        </div>
      </article>
    </Stop>
  )
}

/* ---------- Rama 6: horario ---------- */
export function HoursStop() {
  const i = branches.length + 1
  return (
    <Stop id="horario" side={cardSide(i)} labelledBy="horario-title">
      <article className="stop-card">
        <p className="eyebrow">Rama {i + 1} · Horario</p>
        <SplitTitle id="horario-title" className="h2">Cuándo puedes venir</SplitTitle>
        {/* [PENDIENTE] horario sin confirmar con el cliente */}
        <p className="stamp">Pendiente de confirmar con el cliente</p>
        <dl className="hours-list">
          {hours.map((h) => (
            <div key={h.day}><dt>{h.day}</dt><dd>{h.time ?? '— : —'}</dd></div>
          ))}
        </dl>
        <p className="card-text small">Antes de venir, puedes llamarnos al <a href={business.phoneHref}>{business.phone}</a>.</p>
      </article>
    </Stop>
  )
}

/* ---------- Ubicación y contacto (al pie del árbol) ---------- */
export function RootsStop() {
  const [status, setStatus] = useState('')
  const phoneRef = useRef(null)
  const timer = useRef()
  const say = (msg) => {
    setStatus(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus(''), 2500)
  }
  const selectPhone = () => {
    const range = document.createRange()
    range.selectNodeContents(phoneRef.current)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }
  const copy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(business.phone).then(() => say('Copiado'), () => { selectPhone(); say('Selecciónalo y cópialo') })
    } else { selectPhone(); say('Selecciónalo y cópialo') }
  }

  return (
    <Stop id="contacto" side="left" className="stop-roots" fadeOut={false} labelledBy="contacto-title">
      <article className="stop-card">
        <p className="eyebrow">Ubicación y contacto</p>
        <SplitTitle id="contacto-title" className="h2">Ven a vernos a Galapagar</SplitTitle>
        {/* Todos los datos de este bloque son [REAL] */}
        <address className="contact-list">
          <div className="contact-row">
            <span className="label">Dirección</span>
            <span>{business.street}<br />{business.postal} {business.city} ({business.region})</span>
          </div>
          <div className="contact-row">
            <span className="label">Teléfono</span>
            <span className="phone-line">
              <a href={business.phoneHref} ref={phoneRef}>{business.phone}</a>
              <button type="button" className="copy-btn" onClick={copy}>Copiar</button>
              <span className="copy-status" role="status" aria-live="polite">{status}</span>
            </span>
          </div>
          <div className="contact-row">
            <span className="label">Instagram</span>
            <a href={business.instagramUrl} target="_blank" rel="noopener">{business.instagram}</a>
          </div>
        </address>
        <div className="hero-ctas">
          <a className="btn" href={business.mapsUrl} target="_blank" rel="noopener">Abrir en Google Maps ↗</a>
        </div>
      </article>
    </Stop>
  )
}
