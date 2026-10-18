import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping, Vignette, Noise, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useIsDark } from '../lib/theme'
import { store } from '../lib/scrollStore'
import { fruits, stops } from '../data/business'
import meta from '../assets/tree/meta.json'
import skyDayHdr from '../assets/tree/sky_day.hdr?url'
import skyDuskHdr from '../assets/tree/sky_dusk.hdr?url'

/* El árbol de Alquinaterra, fotorrealista.
   Recursos (ver src/assets/tree/LEEME.txt): corteza PBR (Poly Haven, CC0), hojas fotografiadas
   (ambientCG, CC0) en un atlas de 16 hojas, suelo PBR, cielo HDRI fotográfico (Poly Haven, CC0)
   que también ilumina la escena, y madera cortada generada para los muñones.

   - Tronco maduro: sección irregular (lóbulos), contrafuertes en la base, nudos y relieve real
     desplazado desde el mapa de altura de la corteza. Normales, oclusión y rugosidad PBR.
   - Hojas: instanciadas, cada una con su celda del atlas, orientadas a partir de la ramita,
     translucidez cuando el sol está detrás y brisa en el shader.
   - Luz: sol direccional alineado con el sol del HDRI, sombras suaves y rebote ambiental del cielo.
     En ordenador: oclusión ambiental (N8AO), grano, viñeta y gradación discreta.
   - Cámara: rodea el árbol en hélice al bajar con el scroll; el cielo y el suelo se desplazan de
     forma coherente (paralaje real). El encuadre se corrige para que el producto nunca quede
     detrás de la tarjeta de texto ni fuera de pantalla.
   - Móvil: texturas 1K, menos hojas y geometría, sin sombras dinámicas ni postprocesado. */

// ---------- Recursos por calidad ----------
// La vista previa de un solo archivo (npm run build:single) lleva solo el juego de alta calidad
// para no superar el límite de tamaño; la web real carga 'lo' en móvil.
const SINGLE = import.meta.env.MODE === 'single'
const HI = import.meta.glob('../assets/tree/hi/*.jpg', { eager: true, query: '?url', import: 'default' })
const LO = SINGLE ? HI : import.meta.glob('../assets/tree/lo/*.jpg', { eager: true, query: '?url', import: 'default' })
const asset = (q, name) => (q === 'hi' || SINGLE ? HI : LO)[`../assets/tree/${SINGLE ? 'hi' : q}/${name}.jpg`]

// ---------- Disposición del recorrido ----------
const CANOPY_Y = 15
const TRUNK_TOP = 13.4
const GROUND_Y = -6.5
const BRANCH_Y = [11, 8.2, 5.4, 2.6, -0.2, -3.0]
const STOP_Y = [CANOPY_Y, ...BRANCH_Y, GROUND_Y + 1.4]
const SIDES = BRANCH_Y.map((_, i) => (i % 2 === 0 ? 1 : -1)) // 1: rama a la derecha, texto a la izquierda
const FACE_DESKTOP = 0.55 // cuánto apunta la rama hacia la cámara
const FACE_MOBILE = 1.2 // en móvil, más escorzada: el fruto queda delante, sobre la tarjeta
const ORBIT = 0.5 // giro de la cámara alrededor del tronco entre parada y parada (hélice suave)
const THETA = BRANCH_Y.map((_, i) => (SIDES[i] > 0 ? FACE_DESKTOP : Math.PI - FACE_DESKTOP) + ORBIT * i)

function makePhi(face) {
  const b = THETA.map((t, i) => t - (SIDES[i] > 0 ? face : Math.PI - face))
  for (let i = 1; i < b.length; i++) while (b[i] < b[i - 1] - Math.PI) b[i] += Math.PI * 2
  return [b[0] - 0.6, ...b, b[b.length - 1] + 0.6]
}
const PHI_DESKTOP = makePhi(FACE_DESKTOP)
const PHI_MOBILE = makePhi(FACE_MOBILE)

// ---------- Utilidades ----------
function rng(seed) {
  let s = seed % 2147483647
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
const sampleArr = (arr, s) => {
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor(s)))
  const j = Math.min(arr.length - 1, i + 1)
  return [arr[i], arr[j], Math.max(0, Math.min(1, s - i))]
}
const lerp = (a, b, t) => a + (b - a) * t
const UP = new THREE.Vector3(0, 1, 0)

function imageData(img, size) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0, size, size)
  return { data: g.getImageData(0, 0, size, size).data, w: size, h: size }
}

// Rejilla de tubo: anillos de vértices a lo largo de una curva. radiusAt(t, angle, u, v) decide la forma.
function tubeGrid(curve, segs, radial, radiusAt, uRep, vTile) {
  const frames = curve.computeFrenetFrames(segs, false)
  const len = curve.getLength()
  const pos = new Float32Array((segs + 1) * (radial + 1) * 3)
  const uv = new Float32Array((segs + 1) * (radial + 1) * 2)
  const idx = []
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  let k = 0
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    curve.getPointAt(t, p)
    const v = (t * len) / vTile
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2
      const u = (j / radial) * uRep
      n.set(0, 0, 0).addScaledVector(frames.normals[i], Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a))
      const r = radiusAt(t, a, u, v)
      pos[k * 3] = p.x + n.x * r
      pos[k * 3 + 1] = p.y + n.y * r
      pos[k * 3 + 2] = p.z + n.z * r
      uv[k * 2] = u
      uv[k * 2 + 1] = v
      k++
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j
      const b = a + radial + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  // Costura: la primera y la última columna comparten normal (sin línea visible)
  const nor = g.attributes.normal
  for (let i = 0; i <= segs; i++) {
    const a = i * (radial + 1)
    const b = a + radial
    const x = (nor.getX(a) + nor.getX(b)) / 2
    const y = (nor.getY(a) + nor.getY(b)) / 2
    const z = (nor.getZ(a) + nor.getZ(b)) / 2
    nor.setXYZ(a, x, y, z)
    nor.setXYZ(b, x, y, z)
  }
  nor.needsUpdate = true
  return g
}

// Rama: tubo que se estrecha (más fino en móvil)
const branchTube = (curve, segs, radial, r0, r1) =>
  tubeGrid(curve, segs, radial, (t) => lerp(r0, r1, Math.pow(t, 0.8)), 1, 0.9 + r0 * 4)

// ---------- Tronco maduro con relieve real ----------
const ROOT_ANGLES = [0.3, 1.15, 2.05, 2.9, 3.85, 4.75, 5.6]
function trunkGeometry(curve, segs, radial, height, amp) {
  const { data, w, h } = height
  const sample = (u, v) => {
    const x = Math.floor((((u % 1) + 1) % 1) * (w - 1))
    const y = Math.floor((((v % 1) + 1) % 1) * (h - 1))
    return data[(y * w + x) * 4] / 255
  }
  const len = curve.getLength()
  // Nudos: abultamientos con la corteza arremolinada alrededor (distribuidos a lo largo del tronco)
  const r = rng(91)
  const knots = Array.from({ length: 9 }, () => ({ t: 0.12 + r() * 0.8, a: r() * Math.PI * 2, s: 0.07 + r() * 0.08, w: 0.18 + r() * 0.2 }))
  return tubeGrid(curve, segs, radial, (t, a, u, v) => {
    const base = lerp(0.98, 0.42, Math.pow(t, 0.75))
    // Sección irregular que cambia con la altura (no es un cilindro)
    const lobes = 1 + 0.11 * Math.sin(3 * a + 1.3 + t * 2.2) + 0.06 * Math.sin(5 * a + 0.4 - t * 3.7) + 0.04 * Math.sin(2 * a + t * 5.1) + 0.025 * Math.sin(7 * a - t * 9)
    // Contrafuertes: la base se abre hacia las raíces superficiales
    let flare = 0
    for (const ra of ROOT_ANGLES) {
      const d = Math.atan2(Math.sin(a - ra), Math.cos(a - ra))
      flare = Math.max(flare, Math.exp(-(d * d) / 0.09))
    }
    const buttress = Math.exp(-t * 11) * (0.35 + 0.75 * flare)
    let rad = base * lobes * (1 + buttress)
    for (const k of knots) {
      const dt = (t - k.t) * len
      const da = Math.atan2(Math.sin(a - k.a), Math.cos(a - k.a)) * base
      const g = Math.exp(-(dt * dt + da * da) / (2 * k.w * k.w))
      rad += k.s * g
    }
    // Relieve de la corteza a dos escalas: placas grandes y surcos profundos + detalle fino
    const hgt = sample(u, v) * 0.55 + sample(u * 0.37 + 0.31, v * 0.29 + 0.17) * 0.45
    return rad + (hgt - 0.52) * 2 * amp
  }, 3, 2.1)
}

// ---------- Generación del árbol ----------
function useTreeLayout(isMobile, height) {
  return useMemo(() => {
    const r = rng(7)
    const wood = []
    const leaves = [] // { p, q, s, cell, tint }
    const sprouts = [] // hojas tiernas de los muñones (más claras)
    const caps = [] // cortes de madera de los muñones
    const m3 = new THREE.Matrix4()
    const q = new THREE.Quaternion()

    // Hoja orientada de forma botánica: el tallo sale de la ramita, la cara mira al cielo con variación
    const leafAt = (p, out, size, list, cellPool, tintBase) => {
      const along = out.clone().multiplyScalar(0.6).add(new THREE.Vector3((r() - 0.5) * 0.9, 0.45 + r() * 0.5, (r() - 0.5) * 0.9)).normalize()
      const face = new THREE.Vector3((r() - 0.5) * 0.8, 1, (r() - 0.5) * 0.8).add(out.clone().multiplyScalar(0.4)).normalize()
      const x = new THREE.Vector3().crossVectors(along, face).normalize()
      if (x.lengthSq() < 1e-4) x.set(1, 0, 0)
      const z = new THREE.Vector3().crossVectors(x, along).normalize()
      m3.makeBasis(x, along, z)
      q.setFromRotationMatrix(m3)
      // pequeño giro sobre el propio eje para romper la uniformidad
      q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, (r() - 0.5) * 0.9))
      list.push({ p: p.clone(), q: q.clone(), s: size * (0.7 + r() * 0.6), cell: cellPool[Math.floor(r() * cellPool.length)], tint: tintBase + r() })
    }
    const ALL_CELLS = Array.from({ length: 16 }, (_, i) => i)
    const FRESH_CELLS = [0, 1, 2, 3, 4, 5, 15] // hojas acorazonadas, verde claro (las del brote de la foto)

    const addLeaves = (curve, count, size) => {
      for (let k = 0; k < count; k++) {
        const t = 0.2 + r() * 0.8
        const p = curve.getPointAt(t)
        const tan = curve.getTangentAt(t)
        const out = new THREE.Vector3().crossVectors(tan, UP)
        if (out.lengthSq() < 1e-3) out.set(1, 0, 0)
        out.normalize().applyAxisAngle(tan, r() * Math.PI * 2).add(tan.clone().multiplyScalar(0.5)).normalize()
        leafAt(p.addScaledVector(out, 0.03), out, size, leaves, ALL_CELLS, 0)
      }
    }

    function grow(start, dir, len, r0, level, cfg) {
      const pts = [start.clone()]
      const d = dir.clone().normalize()
      const p = start.clone()
      for (let k = 0; k < 4; k++) {
        d.add(new THREE.Vector3((r() - 0.5) * cfg.wiggle, (r() - 0.5) * cfg.wiggle + cfg.upPull - cfg.droop * level, (r() - 0.5) * cfg.wiggle)).normalize()
        p.addScaledVector(d, len / 4)
        pts.push(p.clone())
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      const r1 = Math.max(r0 * 0.4, 0.01)
      const radial = level === 0 ? cfg.radial0 : level === 1 ? Math.max(6, cfg.radial0 - 4) : 5
      wood.push(branchTube(curve, level === 0 ? 18 : 9, radial, r0, r1))
      if (level < cfg.maxLevel) {
        const n = cfg.children[level]
        const base = r() * Math.PI * 2
        for (let c = 0; c < n; c++) {
          const t = Math.min(0.3 + (c / n) * 0.6 + r() * 0.08, 0.97)
          const at = curve.getPointAt(t)
          const tan = curve.getTangentAt(t)
          const perp = new THREE.Vector3().crossVectors(tan, Math.abs(tan.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP).normalize()
          perp.applyAxisAngle(tan, base + c * 2.4)
          const cd = tan.clone().applyAxisAngle(perp, cfg.spread * (0.7 + r() * 0.6))
          grow(at, cd, len * cfg.lenK * (0.8 + r() * 0.4), lerp(r0, r1, t) * 0.6, level + 1, cfg)
        }
      }
      if (level >= cfg.maxLevel - 1) addLeaves(curve, level === cfg.maxLevel ? cfg.leaves : Math.round(cfg.leaves * 0.45), cfg.leafSize)
      return curve
    }

    // Eje del tronco con una ligera curvatura natural
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, GROUND_Y - 0.6, 0),
      new THREE.Vector3(0.1, GROUND_Y + 4, 0.06),
      new THREE.Vector3(-0.16, 3, -0.1),
      new THREE.Vector3(0.12, 9, 0.08),
      new THREE.Vector3(0.02, TRUNK_TOP + 0.6, 0),
    ])
    const trunkGeo = trunkGeometry(trunkCurve, isMobile ? 240 : 460, isMobile ? 80 : 200, height, isMobile ? 0.13 : 0.16)

    // Copa: ramas mayores que se ramifican hasta las ramitas con hojas
    const crownCfg = isMobile
      ? { maxLevel: 3, children: [3, 3, 2], lenK: 0.64, spread: 0.8, wiggle: 0.35, upPull: 0.06, droop: 0.04, leaves: 36, leafSize: 0.46, radial0: 10 }
      : { maxLevel: 3, children: [3, 3, 3], lenK: 0.62, spread: 0.8, wiggle: 0.35, upPull: 0.06, droop: 0.04, leaves: 62, leafSize: 0.36, radial0: 16 }
    const nLimbs = isMobile ? 4 : 5
    for (let k = 0; k < nLimbs; k++) {
      const a = (k / nLimbs) * Math.PI * 2 + r() * 0.5
      grow(trunkCurve.getPointAt(0.9 + r() * 0.07), new THREE.Vector3(Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8), 3.9 + r() * 0.6, 0.3, 0, crownCfg)
    }
    grow(trunkCurve.getPointAt(0.98), new THREE.Vector3(0.05, 1, 0), 3.3, 0.24, 0, crownCfg)

    // Ramas de las paradas: rama principal casi horizontal, ramitas y hojas; el fruto cuelga de la punta
    const branchCfg = isMobile
      ? { maxLevel: 2, children: [3, 2], lenK: 0.45, spread: 0.85, wiggle: 0.12, upPull: 0.05, droop: 0.02, leaves: 26, leafSize: 0.3, radial0: 12 }
      : { maxLevel: 2, children: [4, 3], lenK: 0.45, spread: 0.85, wiggle: 0.12, upPull: 0.05, droop: 0.02, leaves: 40, leafSize: 0.25, radial0: 20 }
    const branchList = BRANCH_Y.map((y, i) => {
      const d = new THREE.Vector3(Math.cos(THETA[i]), 0.2, Math.sin(THETA[i]))
      const curve = grow(new THREE.Vector3(0, y - 0.25, 0), d, 3.3, 0.27, 0, branchCfg)
      const tip = curve.getPointAt(1)
      return { tip, fruitPos: tip.clone().add(new THREE.Vector3(0, -0.75, 0)) }
    })

    // Ramas menores entre paradas (hacia atrás) para que el tronco no se vea desnudo
    const extraCfg = { maxLevel: 1, children: [3], lenK: 0.5, spread: 0.8, wiggle: 0.3, upPull: 0.12, droop: 0, leaves: isMobile ? 10 : 16, leafSize: 0.32, radial0: isMobile ? 8 : 12 }
    const nExtra = isMobile ? 4 : 7
    for (let k = 0; k < nExtra; k++) {
      const y = lerp(-1.5, 12, (k + 0.5) / nExtra)
      const a = THETA[k % THETA.length] + Math.PI + (r() - 0.5) * 1.2
      grow(new THREE.Vector3(0, y, 0), new THREE.Vector3(Math.cos(a), 0.6, Math.sin(a)), 1.5 + r() * 0.8, 0.11, 0, extraCfg)
    }

    // Muñones cortados con brotes tiernos (como en la fotografía de referencia),
    // situados de perfil respecto a la cámara en algunas paradas
    const PHI = isMobile ? PHI_MOBILE : PHI_DESKTOP
    const camAngle = (phi) => Math.atan2(Math.cos(phi), -Math.sin(phi))
    ;[{ y: 9.6, s: 1, off: 1.0 }, { y: 4.0, s: 3, off: -1.1 }, { y: -1.6, s: 5, off: 1.0 }].forEach(({ y, s, off }) => {
      const a = camAngle(PHI[s]) + off
      const out = new THREE.Vector3(Math.cos(a), 0.75, Math.sin(a)).normalize()
      const start = new THREE.Vector3(0, y, 0)
      const end = start.clone().addScaledVector(out, 1.7)
      const curve = new THREE.CatmullRomCurve3([start, start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.05, 0)), end])
      wood.push(tubeGrid(curve, 14, isMobile ? 18 : 32, (t, ang) => lerp(0.5, 0.4, t) * (1 + 0.06 * Math.sin(3 * ang)), 1, 1.8))
      caps.push({ p: curve.getPointAt(1), n: curve.getTangentAt(1), r: 0.405 })
      // brotes: ramitas finas que salen del borde del corte
      for (let k = 0; k < 3; k++) {
        const ring = new THREE.Vector3().crossVectors(out, UP).normalize().applyAxisAngle(out, k * 2.1 + r())
        const s0 = end.clone().addScaledVector(ring, 0.3)
        const dir = out.clone().multiplyScalar(0.3).add(UP).add(ring.clone().multiplyScalar(0.5)).normalize()
        const s1 = s0.clone().addScaledVector(dir, 0.35)
        const s2 = s1.clone().add(new THREE.Vector3((r() - 0.5) * 0.3, 0.3, (r() - 0.5) * 0.3))
        const c = new THREE.CatmullRomCurve3([s0, s1, s2])
        wood.push(branchTube(c, 8, 5, 0.018, 0.006))
        for (let n = 0; n < 4; n++) {
          const tt = 0.35 + n * 0.2
          leafAt(c.getPointAt(Math.min(tt, 1)), ring.clone().add(UP.clone().multiplyScalar(0.3)).normalize(), 0.3, sprouts, FRESH_CELLS, 2)
        }
      }
    })

    // Raíces superficiales que salen de los contrafuertes y se hunden en la tierra
    ROOT_ANGLES.slice(0, isMobile ? 5 : 7).forEach((a) => {
      const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
      const len = 3 + r() * 1.6
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, GROUND_Y + 0.9, 0),
        d.clone().multiplyScalar(1.15).add(new THREE.Vector3(0, GROUND_Y + 0.32, 0)),
        d.clone().multiplyScalar(len * 0.6).add(new THREE.Vector3((r() - 0.5) * 0.5, GROUND_Y + 0.08, (r() - 0.5) * 0.5)),
        d.clone().multiplyScalar(len).add(new THREE.Vector3((r() - 0.5) * 0.8, GROUND_Y - 0.35, (r() - 0.5) * 0.8)),
      ])
      wood.push(tubeGrid(c, 24, isMobile ? 12 : 20, (t, ang) => lerp(0.55, 0.05, Math.pow(t, 0.7)) * (1 + 0.12 * Math.sin(2 * ang + t * 6)), 1, 1.6))
    })

    // Oclusión aproximada: las hojas del interior de la copa reciben menos luz
    const crownC = new THREE.Vector3(0, CANOPY_Y + 1.4, 0)
    for (const l of leaves) {
      if (l.p.y > TRUNK_TOP - 1.5) l.ao = THREE.MathUtils.clamp(0.42 + 0.17 * l.p.distanceTo(crownC) + 0.05 * (l.p.y - CANOPY_Y), 0.45, 1.05)
      else l.ao = 0.7 + r() * 0.3
    }
    for (const l of sprouts) l.ao = 1

    const woodGeo = mergeGeometries(wood)
    wood.forEach((g) => g.dispose())

    const pinAngle = (isMobile ? FACE_MOBILE : FACE_DESKTOP) + PHI[PHI.length - 1]
    const pin = new THREE.Vector3(Math.cos(pinAngle) * 2.2, GROUND_Y + 0.02, Math.sin(pinAngle) * 2.2)

    return { trunkGeo, woodGeo, leaves, sprouts, caps, branchList, pin }
  }, [isMobile, height])
}

// ---------- Hojas: atlas, translucidez y brisa ----------
const LEAF_VERTEX = `
  #include <uv_vertex>
  float leafCol = mod(aCell, 8.0);
  float leafRow = floor(aCell / 8.0);
  vec2 cellUv = vec2((leafCol + uv.x) / 8.0, (1.0 - (leafRow + 1.0) / 2.0) + uv.y / 2.0);
  #ifdef USE_MAP
    vMapUv = cellUv;
  #endif
  #ifdef USE_ALPHAMAP
    vAlphaMapUv = cellUv;
  #endif
  #ifdef USE_NORMALMAP
    vNormalMapUv = cellUv;
  #endif
  vLeafUv = cellUv;
`

function patchLeafShader(shader, { uniforms, translucency }) {
  Object.assign(shader.uniforms, uniforms)
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
      attribute float aCell;
      uniform float uTime;
      uniform float uWind;
      varying vec2 vLeafUv;`)
    .replace('#include <uv_vertex>', LEAF_VERTEX)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 leafOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      float gust = 0.6 + 0.4 * sin(uTime * 0.35 + leafOrigin.y * 0.15);
      float sway = (sin(uTime * 1.7 + leafOrigin.x * 0.9 + leafOrigin.z * 0.7 + leafOrigin.y * 0.4) * 0.05
                  + sin(uTime * 3.9 + leafOrigin.y * 1.7 + leafOrigin.x) * 0.018) * gust * uWind;
      transformed.z += sway * position.y;
      transformed.x += sway * 0.4 * position.y;`)
  if (!translucency) return
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
      uniform sampler2D uTrans;
      uniform vec3 uSunDirView;
      uniform vec3 uSunColor;
      uniform float uTransStrength;
      varying vec2 vLeafUv;`)
    .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      {
        float tr = texture2D(uTrans, vLeafUv).r;
        vec3 toFrag = normalize(-vViewPosition);
        float back = pow(clamp(dot(toFrag, uSunDirView), 0.0, 1.0), 4.0);
        reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * tr * (0.12 + 1.5 * back) * uTransStrength;
      }`)
}

function useLeafMaterials(tex, quality, sun) {
  return useMemo(() => {
    const uniforms = {
      uTime: { value: 0 },
      uWind: { value: 1 },
      uTrans: { value: tex.leafTrans },
      uSunDirView: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uTransStrength: { value: 1 },
    }
    const mat = new THREE.MeshStandardMaterial({
      map: tex.leafColor,
      alphaMap: tex.leafAlpha,
      alphaTest: 0.45,
      normalMap: tex.leafNormal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.7,
      metalness: 0,
      side: THREE.DoubleSide,
      alphaToCoverage: quality === 'hi',
      envMapIntensity: 0.75,
    })
    mat.onBeforeCompile = (s) => patchLeafShader(s, { uniforms, translucency: true })
    mat.customProgramCacheKey = () => 'leaf-photo'
    // Sombra recortada con la silueta real de cada hoja
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: tex.leafAlpha, alphaTest: 0.45, side: THREE.DoubleSide })
    depth.onBeforeCompile = (s) => patchLeafShader(s, { uniforms, translucency: false })
    depth.customProgramCacheKey = () => 'leaf-depth'
    return { mat, depth, uniforms }
  }, [tex, quality, sun])
}

function LeafInstances({ list, materials, shadows, freshTint }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.5, 1, 4, 4)
    g.translate(0, 0.5, 0) // tallo en el origen: la brisa mueve la punta
    // Ligeramente cóncava a lo ancho y caída hacia la punta, como una hoja real
    const pa = g.attributes.position
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i) / 0.25
      const y = pa.getY(i)
      pa.setZ(i, 0.06 * x * x - 0.08 * y * y)
    }
    g.computeVertexNormals()
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(list.map((l) => l.cell)), 1))
    return g
  }, [list])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const sc = new THREE.Vector3()
    const col = new THREE.Color()
    list.forEach((l, i) => {
      sc.setScalar(l.s)
      m.compose(l.p, l.q, sc)
      ref.current.setMatrixAt(i, m)
      // Variación natural de verdes; alguna hoja más amarilla o más oscura
      const v = l.tint % 1
      if (freshTint) col.setRGB(1.0 + v * 0.08, 1.02 + v * 0.06, 0.9)
      else if (v > 0.965) col.setRGB(1.05, 0.95, 0.55) // alguna hoja amarillenta
      else col.setRGB(0.72 + v * 0.22, 0.74 + v * 0.2, 0.62 + v * 0.16)
      col.multiplyScalar(l.ao ?? 1)
      ref.current.setColorAt(i, col)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [list, freshTint])
  return (
    <instancedMesh ref={ref} args={[geo, materials.mat, list.length]} customDepthMaterial={materials.depth} castShadow={shadows} receiveShadow={shadows} />
  )
}

// Hojas que caen (realistas, del mismo atlas); en el espacio del mundo
function FallingLeaves({ count, materials }) {
  const ref = useRef()
  const items = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 9, z: -2 + r() * 5, y: GROUND_Y + r() * (CANOPY_Y - GROUND_Y),
      v: 0.3 + r() * 0.3, ph: r() * 6, spin: 0.5 + r(), cell: Math.floor(r() * 16),
    }))
  }, [count])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.16, 0.32)
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(items.map((i) => i.cell)), 1))
    return g
  }, [items])
  const d = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    const col = new THREE.Color(1.05, 0.95, 0.62) // hojas que caen, algo secas
    items.forEach((_, i) => ref.current.setColorAt(i, col))
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items])
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const step = Math.min(dt, 0.05)
    items.forEach((it, i) => {
      it.y -= it.v * step
      if (it.y < GROUND_Y) it.y = CANOPY_Y + 1
      d.position.set(it.x + Math.sin(t * 0.7 + it.ph) * 0.6, it.y, it.z + Math.cos(t * 0.5 + it.ph) * 0.3)
      d.rotation.set(t * it.spin + it.ph, t * 0.45 * it.spin, Math.sin(t + it.ph))
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, materials.mat, count]} frustumCulled={false} />
}

// ---------- Frutos (productos) ----------
function Glow({ size = 1, opacity = 0.6, map }) {
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial map={map} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,214,140,1)')
  grad.addColorStop(0.35, 'rgba(255,180,90,0.4)')
  grad.addColorStop(1, 'rgba(255,170,80,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

function StarGeometry() {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const rr = i % 2 ? 0.045 : 0.1
      i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    }
    return new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 })
  }, [])
  return <primitive object={geo} attach="geometry" />
}

const GOLD = '#b8893a'
function FruitShape({ kind, tex, glow }) {
  const gold = { color: GOLD, roughness: 0.35, metalness: 0.8 }
  switch (kind) {
    case 'grain':
      return (
        <group>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.012, 0.015, 0.9, 6]} /><meshStandardMaterial color="#b89148" roughness={0.75} /></mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[(i % 2 ? 0.06 : -0.06), 0.38 - i * 0.065, 0]} rotation={[0, 0, i % 2 ? -0.45 : 0.45]} scale={[0.055, 0.11, 0.055]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color="#cf9f52" roughness={0.6} />
            </mesh>
          ))}
        </group>
      )
    case 'bottle':
      return (
        <group>
          <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.17, 0.18, 0.42, 32]} /><meshPhysicalMaterial color="#8a4a12" roughness={0.08} metalness={0} clearcoat={1} clearcoatRoughness={0.05} transparent opacity={0.94} /></mesh>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.07, 0.17, 0.08, 32]} /><meshPhysicalMaterial color="#8a4a12" roughness={0.08} clearcoat={1} /></mesh>
          <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.08, 0.08, 0.13, 24]} /><meshStandardMaterial color="#1c1c18" roughness={0.45} /></mesh>
          <mesh position={[0, 0.36, 0]}><sphereGeometry args={[0.07, 20, 14]} /><meshStandardMaterial color="#1c1c18" roughness={0.4} /></mesh>
        </group>
      )
    case 'capsule':
      return (
        <group>
          <mesh rotation={[0, 0, 0.6]}><capsuleGeometry args={[0.09, 0.26, 8, 20]} /><meshPhysicalMaterial color="#d4a046" roughness={0.3} clearcoat={0.6} /></mesh>
          <mesh rotation={[0.4, 0, -0.7]} position={[0.13, -0.12, 0.05]}><capsuleGeometry args={[0.08, 0.22, 8, 20]} /><meshPhysicalMaterial color="#6f8a45" roughness={0.3} clearcoat={0.6} /></mesh>
        </group>
      )
    case 'lantern':
      return (
        <group>
          <mesh><octahedronGeometry args={[0.3, 0]} /><meshStandardMaterial {...gold} wireframe /></mesh>
          <mesh><sphereGeometry args={[0.11, 20, 14]} /><meshBasicMaterial color="#ffd08a" toneMapped={false} /></mesh>
          <Glow size={1.1} opacity={0.55} map={glow} />
          <pointLight color="#ffc070" intensity={1.2} distance={3} />
        </group>
      )
    case 'stars':
      return (
        <group>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[(i - 2) * 0.22, -Math.abs(i - 2) * 0.07, 0]} rotation={[0, 0, (i - 2) * 0.15]}>
              <StarGeometry />
              <meshStandardMaterial {...gold} />
            </mesh>
          ))}
        </group>
      )
    case 'sign':
      return (
        <group>
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.32, 0]}><cylinderGeometry args={[0.006, 0.006, 0.4, 5]} /><meshStandardMaterial color="#8c7a5a" roughness={0.9} /></mesh>
          ))}
          <mesh><boxGeometry args={[0.8, 0.38, 0.05]} /><meshStandardMaterial map={tex.cutWood} roughness={0.85} /></mesh>
        </group>
      )
    default:
      return null
  }
}

function Fruit({ kind, index, position, tip, reduce, tex, glow }) {
  const g = useRef()
  useFrame((state, dt) => {
    store.fruits = store.fruits || []
    store.fruits[index] = g.current.getWorldPosition(store.fruits[index] || new THREE.Vector3())
    const a = Math.max(0, 1 - Math.abs(store.stop - (index + 1)))
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, 1.3 * (1 + 0.25 * a), 4, dt))
    if (!reduce) {
      g.current.rotation.y += dt * (0.15 + 0.45 * a)
      g.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 1.1 + index) * 0.035
    }
  })
  const threadLen = tip.y - position.y - 0.25
  return (
    <>
      <mesh position={[tip.x, tip.y - threadLen / 2, tip.z]}>
        <cylinderGeometry args={[0.004, 0.004, threadLen, 4]} />
        <meshStandardMaterial color="#c9b58f" roughness={0.9} />
      </mesh>
      <group ref={g} position={position}>
        <FruitShape kind={kind} tex={tex} glow={glow} />
      </group>
    </>
  )
}

// ---------- Árbol completo ----------
function Tree({ quality, reduce, tex, leafMats, sproutMats, treeRot, shadows }) {
  const isMobile = quality === 'lo'
  const height = useMemo(() => imageData(tex.barkHeight.image, isMobile ? 512 : 1024), [tex.barkHeight, isMobile])
  const T = useTreeLayout(isMobile, height)
  const glow = useMemo(() => glowTexture(), [])
  const pinHalo = useRef()

  useFrame((state) => {
    if (pinHalo.current && !reduce) {
      const k = (state.clock.elapsedTime % 2.6) / 2.6
      pinHalo.current.scale.setScalar(0.6 + k * 1.8)
      pinHalo.current.material.opacity = 0.45 * (1 - k)
    }
  })

  return (
    <group rotation-y={treeRot}>
      <mesh geometry={T.trunkGeo} castShadow={shadows} receiveShadow={shadows}>
        <meshStandardMaterial map={tex.barkColor} normalMap={tex.barkNormal} normalScale={[2.2, 2.2]} aoMap={tex.barkArm} aoMapIntensity={1} roughnessMap={tex.barkArm} roughness={1} metalness={0} envMapIntensity={0.85} />
      </mesh>
      <mesh geometry={T.woodGeo} castShadow={shadows} receiveShadow={shadows}>
        <meshStandardMaterial map={tex.barkColorB} normalMap={tex.barkNormalB} normalScale={[1, 1]} aoMap={tex.barkArmB} roughnessMap={tex.barkArmB} roughness={1} metalness={0} envMapIntensity={0.85} />
      </mesh>
      {T.caps.map((c, i) => (
        <mesh key={i} position={c.p} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.n)} receiveShadow={shadows}>
          <circleGeometry args={[c.r, 48]} />
          <meshStandardMaterial map={tex.cutWood} bumpMap={tex.cutWood} bumpScale={2} roughness={0.9} />
        </mesh>
      ))}
      <LeafInstances list={T.leaves} materials={leafMats} shadows={shadows} />
      <LeafInstances list={T.sprouts} materials={sproutMats} shadows={shadows} freshTint />

      {T.branchList.map((b, i) => (
        <Fruit key={i} kind={fruits[i]} index={i} position={b.fruitPos} tip={b.tip} reduce={reduce} tex={tex} glow={glow} />
      ))}

      {/* Ubicación: pin dorado al pie del árbol */}
      <group position={T.pin} scale={1.5}>
        <mesh position={[0, 0.36, 0]} castShadow={shadows}><sphereGeometry args={[0.15, 28, 20]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} /></mesh>
        <mesh position={[0, 0.15, 0]} rotation-x={Math.PI} castShadow={shadows}><coneGeometry args={[0.12, 0.3, 28]} /><meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} /></mesh>
        <mesh ref={pinHalo} rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.16, 0.2, 48]} />
          <meshBasicMaterial color="#e2c27a" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

function Ground({ tex, shadows }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, GROUND_Y, 0]} receiveShadow={shadows}>
      <planeGeometry args={[700, 700]} />
      <meshStandardMaterial map={tex.groundColor} normalMap={tex.groundNormal} aoMap={tex.groundArm} roughnessMap={tex.groundArm} roughness={1} envMapIntensity={0.6} />
    </mesh>
  )
}

// ---------- Cielo, sol y atmósfera ----------
function Sky({ dark, quality }) {
  const scene = useThree((s) => s.scene)
  const hdr = useLoader(HDRLoader, dark ? skyDuskHdr : skyDayHdr)
  const bg = useLoader(THREE.TextureLoader, asset(quality, dark ? 'sky_dusk' : 'sky_day'))
  useLayoutEffect(() => {
    hdr.mapping = THREE.EquirectangularReflectionMapping
    bg.mapping = THREE.EquirectangularReflectionMapping
    bg.colorSpace = THREE.SRGBColorSpace
    scene.environment = hdr
    scene.environmentIntensity = dark ? 0.75 : 0.9
    scene.background = bg
    scene.backgroundIntensity = 1
    scene.fog = new THREE.Fog(meta[dark ? 'horizon_dusk' : 'horizon_day'], 30, 170)
    return () => { scene.environment = null; scene.background = null; scene.fog = null }
  }, [scene, hdr, bg, dark])
  return null
}

function Sun({ dir, dark, shadows, quality }) {
  const light = useRef()
  const target = useMemo(() => new THREE.Object3D(), [])
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    scene.add(target)
    light.current.target = target
    return () => scene.remove(target)
  }, [scene, target])
  useFrame(({ camera }) => {
    // La sombra sigue a la zona que se está viendo (encajada en la rejilla para evitar parpadeos)
    const look = store.look || camera.position
    const snap = (v) => Math.round(v * 4) / 4
    target.position.set(snap(look.x), snap(look.y), snap(look.z))
    light.current.position.copy(target.position).addScaledVector(dir, 40)
  })
  return (
    <directionalLight
      ref={light}
      color={dark ? '#ffb27a' : '#ffe6c4'}
      intensity={dark ? 2.2 : 3.4}
      castShadow={shadows}
      shadow-mapSize={[quality === 'hi' ? 2048 : 1024, quality === 'hi' ? 2048 : 1024]}
      shadow-camera-left={-9}
      shadow-camera-right={9}
      shadow-camera-top={9}
      shadow-camera-bottom={-9}
      shadow-camera-near={5}
      shadow-camera-far={90}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
      shadow-radius={4}
    />
  )
}

// ---------- Cámara: baja rodeando el tronco ----------
// Contrapicado, como en la fotografía de referencia: la cámara mira hacia arriba, así en la copa
// y en las ramas el fondo es solo cielo; el suelo aparece al llegar al pie del árbol.
const minCamY = GROUND_Y + 0.7
function stopCamera(i, isMobile) {
  const y = STOP_Y[i]
  if (i === 0) {
    return isMobile
      ? { pos: [-3.4, CANOPY_Y - 4.6, 19], look: [-3.4, CANOPY_Y + 2.6, 0] }
      : { pos: [-5.4, CANOPY_Y - 2.6, 16.5], look: [-5.4, CANOPY_Y + 3.4, 0] }
  }
  const last = i === STOP_Y.length - 1
  const side = last ? 1 : SIDES[i - 1]
  if (last) {
    // Pie del árbol: a ras de suelo, mirando las raíces y la base del tronco
    return isMobile
      ? { pos: [-0.4, GROUND_Y + 1.5, 10], look: [-0.4, GROUND_Y + 1.2, 0] }
      : { pos: [-1.6, GROUND_Y + 1.25, 8.8], look: [-1.6, GROUND_Y + 1.3, 0] }
  }
  if (isMobile) {
    // Cámara por debajo de la rama: la rama y su producto quedan en la mitad superior, sobre la tarjeta
    const mx = side * 0.7
    const cy = Math.max(minCamY, y - 4.6)
    return { pos: [mx, cy, 10], look: [mx, y + 0.6, 0] }
  }
  const lx = -side * 0.2
  const cy = Math.max(minCamY, y - 1.0)
  return { pos: [lx, cy, 7.6], look: [lx, y + 1.5, 0] }
}

function CameraRig({ isMobile, reduce, treeRot, leafUniforms, sunDir }) {
  const PHI = isMobile ? PHI_MOBILE : PHI_DESKTOP
  const targets = useMemo(() => STOP_Y.map((_, i) => stopCamera(i, isMobile)), [isMobile])
  const local = useRef({ pos: new THREE.Vector3(...targets[0].pos), look: new THREE.Vector3(...targets[0].look), phi: PHI[0] })
  const vPos = useMemo(() => new THREE.Vector3(), [])
  const vLook = useMemo(() => new THREE.Vector3(), [])
  const wPos = useMemo(() => new THREE.Vector3(), [])
  const wLook = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const size = useThree((s) => s.size)
  const corr = useRef({ x: 0, y: 0 })
  const cards = useMemo(() => stops.map((s) => document.querySelector(`#${s.id} .stop-card`)), [])
  store.look = store.look || new THREE.Vector3()

  useFrame(({ camera, clock }, dt) => {
    const [a, b, f] = sampleArr(targets, store.stop)
    vPos.set(lerp(a.pos[0], b.pos[0], f), lerp(a.pos[1], b.pos[1], f), lerp(a.pos[2], b.pos[2], f))
    vLook.set(lerp(a.look[0], b.look[0], f), lerp(a.look[1], b.look[1], f), lerp(a.look[2], b.look[2], f))
    if (!isMobile && !reduce) {
      vPos.x += store.px * 0.25
      vPos.y -= store.py * 0.15
    }

    // Encuadre: el producto de la rama activa, fuera de la tarjeta y dentro de la pantalla
    const ai = Math.round(store.stop)
    let cx = 0
    let cy = 0
    const fw = store.fruits?.[ai - 1]
    const card = cards[ai]
    if (ai >= 1 && ai <= fruits.length && fw && card && Math.abs(store.stop - ai) < 0.4) {
      const rect = card.getBoundingClientRect()
      tmp.copy(fw).project(camera)
      const sx = ((tmp.x + 1) / 2) * size.width
      const sy = ((1 - tmp.y) / 2) * size.height
      const dist = camera.position.distanceTo(fw)
      const ppu = size.height / (2 * dist * Math.tan((camera.fov * Math.PI) / 360))
      const fr = 0.6 * ppu
      const m = 32
      const fit = (scr, c, lo, hi, k, lim) => {
        const s0 = scr - k * ppu * c
        let p0 = (lo - s0) / (k * ppu)
        let p1 = (hi - s0) / (k * ppu)
        if (p0 > p1) [p0, p1] = [p1, p0]
        const v = lo > hi ? (p0 + p1) / 2 : Math.min(Math.max(0, p0), p1)
        return THREE.MathUtils.clamp(v, -lim, lim)
      }
      if (isMobile) {
        cy = fit(sy, corr.current.y, 72 + fr, rect.top - m - fr, 1, 3)
        cx = fit(sx, corr.current.x, 16 + fr, size.width - 16 - fr, -1, 1.5)
      } else if (rect.left < size.width / 2) {
        cx = fit(sx, corr.current.x, rect.right + m + fr, size.width - 150 - fr, -1, 2.5)
      } else {
        cx = fit(sx, corr.current.x, 24 + fr, rect.left - m - fr, -1, 2.5)
      }
    }
    corr.current.x = reduce ? cx : THREE.MathUtils.damp(corr.current.x, cx, 2.5, dt)
    corr.current.y = reduce ? cy : THREE.MathUtils.damp(corr.current.y, cy, 2.5, dt)
    vPos.x += corr.current.x
    vLook.x += corr.current.x
    vPos.y += corr.current.y
    vLook.y += corr.current.y

    // Movimiento cinematográfico: todo se amortigua con la misma suavidad
    const [p0, p1, pf] = sampleArr(PHI, store.stop)
    const phiTarget = lerp(p0, p1, pf)
    const L = local.current
    if (reduce) {
      L.pos.copy(vPos)
      L.look.copy(vLook)
      L.phi = phiTarget
    } else {
      const k = 1 - Math.exp(-dt * 3.2)
      L.pos.lerp(vPos, k)
      L.look.lerp(vLook, k)
      L.phi = THREE.MathUtils.damp(L.phi, phiTarget, 3.2, dt)
    }
    // La cámara rodea el árbol (que está quieto): cielo, sol y suelo se mueven con coherencia
    const rot = treeRot - L.phi
    wPos.copy(L.pos).applyAxisAngle(UP, rot)
    wLook.copy(L.look).applyAxisAngle(UP, rot)
    camera.position.copy(wPos)
    camera.lookAt(wLook)
    store.look.copy(wLook)

    // Uniformes de las hojas: brisa y dirección del sol en espacio de cámara (translucidez)
    for (const u of leafUniforms) {
      u.uTime.value = reduce ? 0 : clock.elapsedTime
      u.uSunDirView.value.copy(sunDir).transformDirection(camera.matrixWorldInverse)
    }
  })
  return null
}

// ---------- Escena ----------
function useTreeTextures(quality) {
  const names = ['bark_color', 'bark_normal', 'bark_arm', 'bark_height', 'leaf_color', 'leaf_alpha', 'leaf_normal', 'leaf_trans', 'ground_color', 'ground_normal', 'ground_arm', 'cut_wood']
  const loaded = useLoader(THREE.TextureLoader, names.map((n) => asset(quality, n)))
  const gl = useThree((s) => s.gl)
  return useMemo(() => {
    const t = Object.fromEntries(names.map((n, i) => [n.replace(/_(\w)/g, (_, c) => c.toUpperCase()), loaded[i]]))
    const aniso = Math.min(quality === 'hi' ? 8 : 4, gl.capabilities.getMaxAnisotropy())
    ;['barkColor', 'leafColor', 'groundColor', 'cutWood'].forEach((k) => (t[k].colorSpace = THREE.SRGBColorSpace))
    ;['barkColor', 'barkNormal', 'barkArm', 'groundColor', 'groundNormal', 'groundArm'].forEach((k) => {
      t[k].wrapS = t[k].wrapT = THREE.RepeatWrapping
      t[k].anisotropy = aniso
    })
    ;['groundColor', 'groundNormal', 'groundArm'].forEach((k) => t[k].repeat.set(140, 140))
    ;['leafColor', 'leafAlpha', 'leafNormal', 'leafTrans'].forEach((k) => (t[k].anisotropy = aniso))
    // Copias para las ramas (misma corteza, la UV de las ramas ya lleva su escala)
    t.barkColorB = t.barkColor
    t.barkNormalB = t.barkNormal
    t.barkArmB = t.barkArm
    Object.values(t).forEach((x) => (x.needsUpdate = true))
    return t
  }, [loaded, quality, gl])
}

function Scene({ quality, reduce, dark, onReady }) {
  const isMobile = quality === 'lo'
  const shadows = quality === 'hi'
  const tex = useTreeTextures(quality)
  const sunArr = meta[dark ? 'sun_dusk' : 'sun_day']
  const sunDir = useMemo(() => new THREE.Vector3(...sunArr).normalize(), [sunArr])
  // Orientación del árbol respecto al sol. La cámara rodea el árbol 0,5 rad por parada: en la copa el
  // sol llega de lado y por detrás (hojas translúcidas), y al bajar la luz es lateral y casi frontal
  // sobre la corteza, que es donde más se ven sus surcos.
  const treeRot = useMemo(() => Math.atan2(sunDir.x, sunDir.z) + 1.9, [sunDir])
  const leafMats = useLeafMaterials(tex, quality, sunArr)
  const sproutMats = useLeafMaterials(tex, quality, sunArr)
  useEffect(() => {
    const c = new THREE.Color(dark ? '#ffb27a' : '#ffe6c4').multiplyScalar(dark ? 1.6 : 2.2)
    for (const m of [leafMats, sproutMats]) {
      m.uniforms.uSunColor.value.copy(c)
      m.uniforms.uTransStrength.value = dark ? 1.3 : 1
      m.uniforms.uWind.value = reduce ? 0 : 1
    }
  }, [leafMats, sproutMats, dark, reduce])
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()))
    return () => cancelAnimationFrame(id)
  }, [onReady])

  return (
    <>
      <Sky dark={dark} quality={quality} />
      <Sun dir={sunDir} dark={dark} shadows={shadows} quality={quality} />
      <CameraRig isMobile={isMobile} reduce={reduce} treeRot={treeRot} leafUniforms={[leafMats.uniforms, sproutMats.uniforms]} sunDir={sunDir} />
      <Tree quality={quality} reduce={reduce} tex={tex} leafMats={leafMats} sproutMats={sproutMats} treeRot={treeRot} shadows={shadows} />
      <Ground tex={tex} shadows={shadows} />
      {!reduce && <FallingLeaves count={isMobile ? 6 : 14} materials={leafMats} />}
    </>
  )
}

// Postprocesado fotográfico (solo ordenador): oclusión ambiental, gradación discreta, viñeta y grano
function Photo({ level }) {
  if (level === 0) return null
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      {level >= 2 ? <N8AO aoRadius={1.1} distanceFalloff={0.7} intensity={2.2} halfRes quality="medium" /> : null}
      <HueSaturation saturation={-0.06} />
      <BrightnessContrast brightness={0} contrast={0.06} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.28} darkness={0.42} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.07} />
    </EffectComposer>
  )
}

export default function TreeScene({ onReady }) {
  const dark = useIsDark()
  const isMobile = useMemo(() => window.matchMedia('(max-width: 899px)').matches, [])
  const reduce = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const quality = isMobile ? 'lo' : 'hi'
  // Parámetros de prueba opcionales (?dpr=0.5&fx=0): solo para capturas en equipos sin GPU
  const test = useMemo(() => new URLSearchParams(window.location.search), [])
  // Nivel del postprocesado: 2 = completo, 1 = sin oclusión, 0 = nada. Baja solo si faltan fps.
  const [fx, setFx] = useState(test.has('fx') ? +test.get('fx') : isMobile ? 0 : 2)
  const [dpr, setDpr] = useState(test.has('dpr') ? +test.get('dpr') : isMobile ? 1.25 : 1.5)
  const first = stopCamera(0, isMobile)

  return (
    <div className="tree-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        shadows={quality === 'hi' ? 'soft' : false}
        camera={{ position: first.pos, fov: isMobile ? 46 : 36, near: 0.1, far: 900 }}
        gl={{ antialias: fx === 0, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.0 }}
      >
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => {
            if (fx > 0) setFx((v) => v - 1)
            else setDpr(1)
          }}
          onFallback={() => { setFx(0); setDpr(1) }}
        />
        <Suspense fallback={null}>
          <Scene quality={quality} reduce={reduce} dark={dark} onReady={onReady} />
          <Photo level={fx} />
        </Suspense>
      </Canvas>
    </div>
  )
}
