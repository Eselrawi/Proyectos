// Datos del negocio en un solo sitio.
// [REAL] = verificado · [EJEMPLO] = redactado para la maqueta · [PENDIENTE] = falta del cliente
// [PRUEBA] = material provisional (fotos de Unsplash que NO son de la tienda)

import interior from '../assets/img/prueba/prueba-interior-unsplash-bundo-kim.jpg'
import producto from '../assets/img/prueba/prueba-producto-unsplash-kelly-sikkema.jpg'
import esencias from '../assets/img/prueba/prueba-esencias-unsplash-laura-olsen.jpg'

export const business = {
  name: 'Alquinaterra', // [REAL]
  category: 'Herbolario · Salud y bienestar', // [REAL]
  street: 'C. de los Cantos, 24', // [REAL]
  postal: '28260', // [REAL]
  city: 'Galapagar', // [REAL]
  region: 'Madrid', // [REAL]
  phone: '918 58 66 43', // [REAL]
  phoneHref: 'tel:+34918586643', // [REAL]
  instagram: '@alquinaterra', // [REAL]
  instagramUrl: 'https://www.instagram.com/alquinaterra/', // [REAL]
  rating: 4.7, // [REAL] verificado en Google Maps
  reviews: 60, // [REAL] verificado en Google Maps
  whatsapp: null, // [PENDIENTE] el 918 es fijo; poner aquí un móvil con WhatsApp si lo hay ('34XXXXXXXXX')
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Alquinaterra%2C%20C.%20de%20los%20Cantos%2024%2C%2028260%20Galapagar', // [REAL]
  // [PENDIENTE] sustituir por https://search.google.com/local/writereview?placeid=PLACE_ID
  reviewUrl: 'https://www.google.com/maps/search/?api=1&query=Alquinaterra%20Galapagar',
}

// [EJEMPLO] frase del hero
export const heroLede =
  'Herbolario ecológico en Galapagar. Alimentación, cosmética natural, suplementos y esencias, con alguien detrás del mostrador que conoce lo que vende y se toma el tiempo de explicártelo.'

// [PRUEBA] fotos provisionales
const testPhoto = (src, alt) => ({ src, alt, test: true })

// Ramas de producto. Categorías [REAL]; textos [EJEMPLO], sin afirmaciones de salud.
// `fruit` es el objeto 3D que cuelga de cada rama (ver src/three/TreeScene.jsx).
export const branches = [
  {
    id: 'alimentacion',
    fruit: 'grain',
    title: 'Alimentación ecológica',
    text: 'Productos ecológicos para la despensa de cada día: legumbres, cereales, aceites, harinas, endulzantes y más.',
    photo: null, // [PENDIENTE] foto real de la sección de alimentación
  },
  {
    id: 'cosmetica',
    fruit: 'bottle',
    title: 'Cosmética natural y esencias',
    text: 'Cuidado facial, corporal y capilar con fórmulas de origen natural, además de esencias y aceites.',
    photo: testPhoto(esencias, 'Foto de prueba: frascos ámbar de esencias junto a flores de lavanda secas'),
  },
  {
    id: 'suplementos',
    fruit: 'capsule',
    title: 'Suplementos',
    text: 'Complementos alimenticios de marcas seleccionadas. Te explicamos qué lleva cada uno; para cualquier cuestión de salud, consulta con tu médico.',
    photo: testPhoto(producto, 'Foto de prueba: cuentagotas sobre un frasco ámbar'),
  },
  {
    id: 'asesoramiento',
    fruit: 'lantern',
    title: 'Asesoramiento cercano',
    text: 'Tiempo para atenderte en tienda, resolver dudas sobre ingredientes y ayudarte a encontrar lo que buscas.',
    photo: testPhoto(interior, 'Foto de prueba: botes de cristal con hierbas secas y frascos ámbar en una estantería'),
  },
]

// Orden del recorrido de arriba abajo. Lo usan la escena 3D, el indicador lateral y las secciones.
export const stops = [
  { id: 'inicio', label: 'Copa' },
  ...branches.map((b) => ({ id: b.id, label: b.title.split(' ')[0] })),
  { id: 'resenas', label: 'Reseñas' },
  { id: 'horario', label: 'Horario' },
  { id: 'contacto', label: 'Contacto' },
]

// Objeto 3D de cada parada intermedia (rama), en el mismo orden que `stops` sin copa ni raíces
export const fruits = [...branches.map((b) => b.fruit), 'stars', 'sign']

export const photoCredit = 'Bundo Kim, Kelly Sikkema y Laura Olsen en Unsplash'

// [PENDIENTE] horario sin confirmar: no publicar horas hasta que el cliente las valide
export const hours = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => ({ day, time: null }))
