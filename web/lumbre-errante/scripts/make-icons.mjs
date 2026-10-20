import sharp from "sharp";
const bg = { r: 21, g: 18, b: 15, alpha: 1 };
for (const s of [192, 512]) {
  const logo = await sharp("public/brand/logo-dark.svg", { density: 300 }).resize(Math.round(s * 0.8)).png().toBuffer();
  await sharp({ create: { width: s, height: s, channels: 4, background: bg } }).composite([{ input: logo, gravity: "center" }]).png().toFile(`public/icon-${s}.png`);
}
