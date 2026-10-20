// Imagen Open Graph 1200x630: logo, nombre, eslogan y el plato estrella. Salida: public/og.jpg
import sharp from "sharp";

const W = 1200, H = 630;
const plate = await sharp("public/dishes/paella/color.webp").resize(520, 520).toBuffer();
const logo = await sharp("public/brand/logo-dark.svg", { density: 300 }).resize(84).png().toBuffer();

const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="78%" cy="50%" r="60%"><stop offset="0" stop-color="#4a2e18"/><stop offset="1" stop-color="#15120f"/></radialGradient>
    <radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset=".6" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <ellipse cx="900" cy="338" rx="320" ry="320" fill="url(#s)"/>
  <text x="84" y="330" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#f3e9d8">Lumbre</text>
  <text x="84" y="426" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#f3e9d8">Errante</text>
  <text x="88" y="486" font-family="Arial, sans-serif" font-size="30" fill="#d4a24c">Cocina sin fronteras, a fuego lento</text>
  <text x="88" y="560" font-family="Arial, sans-serif" font-size="24" fill="#bfb2a0">Carta 3D: toca los ingredientes y pide desde la mesa</text>
  <rect x="84" y="60" width="388" height="38" rx="19" fill="#d4a24c"/>
  <text x="278" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#15120f">DEMO · RESTAURANTE FICTICIO</text>
</svg>`);

await sharp(bg)
  .composite([{ input: plate, left: 640, top: 55 }, { input: logo, left: 1060, top: 40 }])
  .jpeg({ quality: 86 })
  .toFile("public/og.jpg");
console.log("public/og.jpg");
