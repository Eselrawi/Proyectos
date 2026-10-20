// NEXT_PUBLIC_CONTACT: email o número de WhatsApp (con prefijo, solo dígitos). Por defecto, el WhatsApp del titular.
const raw = process.env.NEXT_PUBLIC_CONTACT?.trim() || "34640622930";

const MSG = "Hola, he visto la demo de la carta 3D (Lumbre Errante) y me gustaría tenerla en mi restaurante. ¿Podemos hablar?";

export const contactHref = raw.includes("@")
  ? `mailto:${raw}?subject=${encodeURIComponent("Carta 3D para mi restaurante")}&body=${encodeURIComponent(MSG)}`
  : `https://wa.me/${raw.replace(/\D/g, "")}?text=${encodeURIComponent(MSG)}`;
