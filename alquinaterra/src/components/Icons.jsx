// Iconografía propia (trazo, hereda el color del texto/tokens)
const paths = {
  grain: (
    <>
      <path d="M24 44V14" /><path d="M24 22c-5-1-8-4-9-9 5 0 8 3 9 9Z" /><path d="M24 22c5-1 8-4 9-9-5 0-8 3-9 9Z" />
      <path d="M24 31c-5-1-8-4-9-9 5 0 8 3 9 9Z" /><path d="M24 31c5-1 8-4 9-9-5 0-8 3-9 9Z" /><path d="M24 14c-2-3-2-6 0-9 2 3 2 6 0 9Z" />
    </>
  ),
  bottle: (
    <>
      <path d="M18 18h12v20a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V18Z" /><path d="M20 18v-4h8v4" /><path d="M22 14V8a2 2 0 0 1 4 0v6" />
      <path d="M18 28h12" /><path d="M36 10c0 2-1.3 3.5-3 3.5s-3-1.5-3-3.5c0-2 3-5.5 3-5.5s3 3.5 3 5.5Z" />
    </>
  ),
  capsule: (
    <>
      <rect x="8" y="17" width="30" height="13" rx="6.5" transform="rotate(-35 23 23.5)" /><path d="M19 15.5l7.5 10.7" />
      <circle cx="37" cy="36" r="5" /><path d="M33.5 39.5l7-7" />
    </>
  ),
  talk: (
    <>
      <path d="M8 12h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H16l-6 5v-5H8a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4Z" />
      <path d="M32 20h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-1v5l-6-5h-7a4 4 0 0 1-4-4v-4" />
      <path d="M18 24c-3 0-5-2-5-5 3 0 5 2 5 5Zm0 0c0-4 2-6 5-7" />
    </>
  ),
}

export function OfferIcon({ name }) {
  return (
    <svg className="offer-icon" viewBox="0 0 48 48" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.6 3.5h2.6l1.4 4-2 1.4a12 12 0 0 0 6.5 6.5l1.4-2 4 1.4v2.6a1.9 1.9 0 0 1-2 1.9A16.6 16.6 0 0 1 4.6 5.5a1.9 1.9 0 0 1 2-2Z" />
  </svg>
)

// Rama en SVG: intro y respaldo del 3D
export const BranchPaths = () => (
  <>
    <path className="stem" d="M100 178 C 98 140, 104 100, 100 34" />
    <path d="M100 140 C 80 132, 62 118, 52 98 C 74 100, 92 116, 100 140Z" />
    <path d="M100 116 C 120 106, 136 90, 144 70 C 122 74, 106 92, 100 116Z" />
    <path d="M100 86 C 84 78, 74 64, 70 46 C 88 52, 98 66, 100 86Z" />
    <path d="M100 58 C 110 50, 116 40, 118 26 C 106 32, 100 44, 100 58Z" />
  </>
)
