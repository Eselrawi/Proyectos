import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run build`         → build normal para Vercel (código dividido, el 3D se carga aparte)
// `npm run build:single`  → todo en un solo bloque con imágenes incrustadas (vista previa compartible)
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    // Rutas relativas: la web funciona igual en un dominio propio o en usuario.github.io/repositorio/
    base: './',
    plugins: [react()],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      cssCodeSplit: !single,
      chunkSizeWarningLimit: 1200,
      rollupOptions: single ? { output: { inlineDynamicImports: true } } : {},
    },
  }
})
