import { useEffect, useState } from 'react'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function isDark() {
  const t = document.documentElement.getAttribute('data-theme')
  return t ? t === 'dark' : media().matches
}

export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  try { localStorage.setItem('alq-theme', next) } catch { /* sin almacenamiento: solo esta visita */ }
  window.dispatchEvent(new CustomEvent('alq:themechange'))
}

// Devuelve true/false y se actualiza con el botón o con el modo del sistema
export function useIsDark() {
  const [dark, setDark] = useState(() => isDark())
  useEffect(() => {
    const update = () => setDark(isDark())
    window.addEventListener('alq:themechange', update)
    const mq = media()
    mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('alq:themechange', update)
      mq.removeEventListener('change', update)
    }
  }, [])
  return dark
}

// Lee un color de los tokens CSS (para la escena 3D)
export const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
