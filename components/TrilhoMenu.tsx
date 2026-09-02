"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ESTACOES = [
  {
    href: "/habitos",
    cor: "habito",
    corPonto: "bg-habito",
    corAnel: "ring-habito/30",
    titulo: "Hábitos",
    texto: "Constância visível, dia após dia.",
  },
  {
    href: "/notas",
    cor: "nota",
    corPonto: "bg-nota",
    corAnel: "ring-nota/30",
    titulo: "Notas",
    texto: "Ideias organizadas, do jeito que fizer sentido.",
  },
  {
    href: "/financas",
    cor: "financa",
    corPonto: "bg-financa",
    corAnel: "ring-financa/30",
    titulo: "Finanças",
    texto: "Cada real, com clareza.",
  },
];

export function TrilhoMenu() {
  // Remonta a sequência de animação toda vez que a tela aparece —
  // inclusive quando a pessoa volta de dentro de uma seção, já que
  // isso é um componente novo sendo montado de novo (é assim que
  // "o vídeo entra de novo" acontece, sem precisar de nenhum truque).
  const [linhaVisivel, setLinhaVisivel] = useState(false);
  const [semAnimacao, setSemAnimacao] = useState(false);

  useEffect(() => {
    const prefereReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSemAnimacao(prefereReduzido);
    const id = requestAnimationFrame(() => setLinhaVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative flex-1 flex items-center py-10">
      {/* A linha "desenha" de cima pra baixo */}
      <div className="absolute left-6 top-0 bottom-0 w-[2px] overflow-hidden">
        <div
          className="w-full trilho-linha rounded-full transition-all ease-out"
          style={{
            height: linhaVisivel || semAnimacao ? "100%" : "0%",
            transitionDuration: semAnimacao ? "0ms" : "1100ms",
          }}
        />
      </div>

      <div className="space-y-16 pl-16 w-full">
        {ESTACOES.map((estacao, i) => (
          <Link
            key={estacao.href}
            href={estacao.href}
            className="group relative block outline-none"
            style={{
              opacity: linhaVisivel || semAnimacao ? 1 : 0,
              transform: linhaVisivel || semAnimacao ? "translateX(0)" : "translateX(-8px)",
              transition: semAnimacao
                ? "none"
                : `opacity 500ms ease-out ${350 + i * 260}ms, transform 500ms ease-out ${350 + i * 260}ms`,
            }}
          >
            <span
              className={`absolute -left-[46px] top-1 w-3 h-3 rounded-full ${estacao.corPonto} ring-4 ring-base-800 transition-transform group-hover:scale-125 group-focus-visible:scale-125`}
            />
            <p className="font-display font-semibold text-lg group-hover:opacity-80 transition-opacity">
              {estacao.titulo}
              <span className="inline-block ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </p>
            <p className="text-ink-400 text-sm mt-1 max-w-[260px]">{estacao.texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
