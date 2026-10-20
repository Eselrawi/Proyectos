"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

const N = 90;

function Embers() {
  const ref = useRef<THREE.Points>(null);
  const { pos, speed, sway } = useMemo(() => {
    // PRNG con semilla fija: el render sigue siendo puro
    let a = 7;
    const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pos = new Float32Array(N * 3), speed = new Float32Array(N), sway = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rnd() - 0.5) * 16;
      pos[i * 3 + 1] = (rnd() - 0.5) * 9;
      pos[i * 3 + 2] = (rnd() - 0.5) * 4;
      speed[i] = 0.25 + rnd() * 0.6;
      sway[i] = rnd() * 6.28;
    }
    return { pos, speed, sway };
  }, []);

  useFrame((s, dt) => {
    const a = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!a) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      let y = a.getY(i) + speed[i] * dt;
      if (y > 4.8) { y = -4.8; a.setX(i, (Math.random() - 0.5) * 16); }
      a.setY(i, y);
      a.setX(i, a.getX(i) + Math.sin(t * 0.8 + sway[i]) * dt * 0.25);
    }
    a.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffb25a" size={0.07} sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Brasas en WebGL con bloom. Solo se monta en pantallas anchas y sin reduced-motion. */
export default function EmberField() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} style={{ background: "transparent" }}>
      <Embers />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.6} luminanceThreshold={0.1} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
