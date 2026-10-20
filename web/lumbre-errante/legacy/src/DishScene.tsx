"use client";
/* eslint-disable react-hooks/immutability -- three.js: los uniforms y objetos 3D se mutan dentro de useFrame, no durante el render */
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Ingredient } from "@/lib/types";
import type { DishAssets } from "@/lib/dishAssets";
import { selectionMask } from "@/lib/dishAssets";

export interface View {
  tx: number; // inclinación objetivo (rad)
  ty: number;
  zoom: number; // 1..2
  idle: boolean;
  reduced: boolean; // prefers-reduced-motion
}

const LOW = typeof navigator !== "undefined" && (navigator.hardwareConcurrency <= 4 || ((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 2);
const SEG = LOW ? 112 : 192;
const SIZE = 2.4;

function useDishMaterial(a: DishAssets) {
  const mask = useMemo(() => selectionMask(a, 0), [a]);
  const uniforms = useMemo(() => ({ uMask: { value: mask }, uHas: { value: 0 }, uTime: { value: 0 } }), [mask]);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: a.color,
      displacementMap: a.depth,
      displacementScale: 0.2,
      displacementBias: -0.01,
      normalMap: a.normal,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.82,
      metalness: 0,
      transparent: true,
      alphaTest: 0.5,
    });
    m.onBeforeCompile = (s) => {
      s.uniforms.uMask = uniforms.uMask;
      s.uniforms.uHas = uniforms.uHas;
      s.uniforms.uTime = uniforms.uTime;
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uMask;\nuniform float uHas;")
        .replace("#include <displacementmap_vertex>", `#include <displacementmap_vertex>
          transformed += normalize(objectNormal) * smoothstep(0.3, 0.9, texture2D(uMask, uv).r) * 0.05 * uHas;`);
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uMask;\nuniform float uHas;\nuniform float uTime;")
        .replace("#include <map_fragment>", `#include <map_fragment>
          float mk = texture2D(uMask, vMapUv).r;
          float inside = smoothstep(0.35, 0.65, mk);
          // fuera: se apaga y pierde color; dentro: se queda tal cual y gana un poco de brillo
          float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 dim = mix(vec3(lum), diffuseColor.rgb, 0.45) * 0.34;
          diffuseColor.rgb = mix(diffuseColor.rgb, dim, uHas * (1.0 - inside));
          // contorno fino que respira
          float edge = smoothstep(0.2, 0.45, mk) * (1.0 - smoothstep(0.5, 0.8, mk));
          float pulse = 0.75 + 0.25 * sin(uTime * 3.2);
          diffuseColor.rgb += vec3(1.0, 0.78, 0.36) * edge * uHas * 0.75 * pulse;
          diffuseColor.rgb *= 1.0 + 0.16 * uHas * inside;`);
    };
    return m;
  }, [a, uniforms]);
  useEffect(() => () => { material.dispose(); mask.dispose(); }, [material, mask]);
  return { material, uniforms, mask };
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 30, 64, 64, 64);
  r.addColorStop(0, "rgba(0,0,0,0.62)");
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function DishMesh({
  assets, selected, onSelect,
}: { assets: DishAssets; selected: number | null; onSelect: (i: number | null) => void }) {
  const { material, uniforms, mask } = useDishMaterial(assets);
  const k = useRef(0);

  useEffect(() => {
    if (selected) selectionMask(assets, selected, mask);
  }, [selected, assets, mask]);

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value = clock.elapsedTime;
    const target = selected ? 1 : 0;
    k.current += (target - k.current) * (1 - Math.exp(-dt * 9));
    uniforms.uHas.value = k.current;
  });

  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!e.uv) return;
    e.stopPropagation();
    const x = Math.min(assets.size - 1, Math.floor(e.uv.x * assets.size));
    const y = Math.min(assets.size - 1, Math.floor((1 - e.uv.y) * assets.size));
    const v = assets.ids[y * assets.size + x];
    onSelect(v ? v : null);
  };

  return (
    <mesh material={material} onClick={click}>
      <planeGeometry args={[SIZE, SIZE, SEG, SEG]} />
    </mesh>
  );
}

/** Anclas 3D de las bolitas: cada frame se proyectan a pantalla (% del lienzo) en `spots`; el DOM las dibuja fuera del Canvas. */
export type Spots = MutableRefObject<Record<number, [number, number]>>;

function Hotspots({ assets, ingredients, spots }: { assets: DishAssets; ingredients: Ingredient[]; spots: Spots }) {
  const anchors = useMemo(() => {
    const cv = assets.depth.image as HTMLCanvasElement;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    return ingredients.flatMap((g) => {
      const c = assets.centroids[g.index];
      if (!c) return [];
      const h = ctx ? ctx.getImageData(Math.min(cv.width - 1, Math.floor(c[0] * cv.width)), Math.min(cv.height - 1, Math.floor(c[1] * cv.height)), 1, 1).data[0] / 255 : 0;
      return [{ index: g.index, pos: [(c[0] - 0.5) * SIZE, (0.5 - c[1]) * SIZE, h * 0.2 - 0.01 + 0.05] as [number, number, number] }];
    });
  }, [assets, ingredients]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const v = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  useFrame(() => {
    anchors.forEach((a, i) => {
      const o = refs.current[i];
      if (!o) return;
      o.updateWorldMatrix(true, false);
      v.setFromMatrixPosition(o.matrixWorld).project(camera);
      spots.current[a.index] = [(v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100];
    });
  });
  useEffect(() => { const s = spots.current; return () => { for (const k of Object.keys(s)) delete s[+k]; }; }, [assets, spots]);

  return (
    <>
      {anchors.map((a, i) => <group key={a.index} ref={(o) => { refs.current[i] = o; }} position={a.pos} />)}
    </>
  );
}

function Slot({
  assets, selected, onSelect, view, dir, leaving, onGone, ingredients, spots,
}: {
  assets: DishAssets; selected: number | null; onSelect: (i: number | null) => void;
  view: MutableRefObject<View>; dir: number; leaving?: boolean; onGone?: () => void; ingredients?: Ingredient[]; spots?: Spots;
}) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  const done = useRef(false);
  const shadow = useMemo(() => shadowTexture(), []);
  useEffect(() => () => shadow.dispose(), [shadow]);

  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    t.current = view.current.reduced ? 1 : Math.min(1, t.current + dt * (leaving ? 2.4 : 2));
    const p = t.current;
    const e = 1 - Math.pow(1 - p, 3);
    const spin = leaving ? e : 1 - e;
    o.position.x = (leaving ? -dir : dir) * 3.4 * (leaving ? e : 1 - e);
    o.rotation.z = (leaving ? -dir : dir) * 1.1 * (leaving ? e : 1 - e);
    o.scale.setScalar(leaving ? 1 - 0.25 * e : 0.78 + 0.22 * e);
    const v = view.current;
    const sway = v.idle ? Math.sin(clock.elapsedTime * 0.6) * 0.07 : 0;
    const k = 1 - Math.exp(-dt * 7);
    o.rotation.x += (v.ty + (v.idle ? Math.cos(clock.elapsedTime * 0.5) * 0.05 : 0) - o.rotation.x) * k * (leaving ? 0 : 1);
    o.rotation.y += (v.tx + sway - o.rotation.y) * k * (leaving ? 0 : 1);
    void spin;
    if (leaving && p >= 1 && !done.current) { done.current = true; onGone?.(); }
  });

  return (
    <group ref={g}>
      <mesh position={[0.06, -0.08, -0.12]} scale={1.18}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.045]}>
        <circleGeometry args={[SIZE / 2 - 0.004, 64]} />
        <meshStandardMaterial color="#1b1612" roughness={0.6} />
      </mesh>
      <DishMesh assets={assets} selected={selected} onSelect={onSelect} />
      {ingredients && spots && !leaving && <Hotspots assets={assets} ingredients={ingredients} spots={spots} />}
    </group>
  );
}

function Rig({ view }: { view: MutableRefObject<View> }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    const target = 4.6 / view.current.zoom;
    camera.position.z += (target - camera.position.z) * (1 - Math.exp(-dt * 6));
  });
  return null;
}

export default function DishScene({
  assets, selected, onSelect, view, dir, onContext, ingredients, spots,
}: {
  assets: DishAssets; selected: number | null; onSelect: (i: number | null) => void;
  view: MutableRefObject<View>; dir: number; onContext?: (lost: boolean) => void; ingredients?: Ingredient[]; spots?: Spots;
}) {
  const [leaving, setLeaving] = useState<{ a: DishAssets; dir: number; key: number }[]>([]);
  const prev = useRef<DishAssets | null>(null);
  const n = useRef(0);

  useEffect(() => {
    const p = prev.current;
    if (p && p.id !== assets.id) setLeaving((l) => [...l, { a: p, dir, key: n.current++ }]);
    prev.current = assets;
  }, [assets, dir]);

  return (
    <Canvas
      dpr={[1, LOW ? 1.25 : 1.75]}
      camera={{ position: [0, 0, 4.6], fov: 32 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onContext?.(true); });
      }}
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[-2, 3, 4]} intensity={1.6} color="#ffe2bd" />
      <directionalLight position={[3, -2, 2]} intensity={0.35} color="#9db5ff" />
      <Rig view={view} />
      <Slot key={assets.id} assets={assets} selected={selected} onSelect={onSelect} view={view} dir={dir} ingredients={ingredients} spots={spots} />
      {leaving.map((l) => (
        <Slot key={"out" + l.key} assets={l.a} selected={null} onSelect={() => {}} view={view} dir={l.dir} leaving onGone={() => setLeaving((x) => x.filter((y) => y.key !== l.key))} />
      ))}
    </Canvas>
  );
}
