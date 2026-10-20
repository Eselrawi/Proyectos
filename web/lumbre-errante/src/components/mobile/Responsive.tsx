"use client";
import { useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(min-width: 768px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Monta solo una de las dos webs: la de móvil (también en el servidor) o la de escritorio. */
export default function Responsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return <>{wide ? desktop : mobile}</>;
}
