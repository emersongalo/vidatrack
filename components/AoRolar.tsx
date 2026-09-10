"use client";

import { useEffect, useRef, useState } from "react";

export function AoRolar({
  children,
  atraso = 0,
  className = "",
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
