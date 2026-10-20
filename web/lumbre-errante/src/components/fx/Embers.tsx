"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Field = dynamic(() => import("./EmberField"), { ssr: false });

export default function Embers() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(matchMedia("(min-width: 768px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return on ? <div aria-hidden className="pointer-events-none absolute inset-0"><Field /></div> : null;
}
