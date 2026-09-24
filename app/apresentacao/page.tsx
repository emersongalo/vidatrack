"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface CelularProps {
  src: string;
  alt: string;
  classeDestaque?: string;
  estiloTransform: string;
}

function ItemCelular({ src, alt, classeDestaque = "", estiloTransform }: CelularProps) {
  return (
    <div
      style={{ transform: estiloTransform }}
      className={`absolute top-0 left-1/2 -translate-x-1/2 w-[220px] sm:w-[270px] md:w-[290px] rounded-[42px] p-2 bg-gradient-to-b from-neutral-700 via-neutral-900 to-black border border-neutral-700/60 shadow-2xl shadow-black/90 transition-all duration-700 ease-out will-change-transform ${classeDestaque}`}
    >
      {/* Dynamic Island / Notch */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
        <div className="w-2 h-2 rounded-full bg-neutral-800" />
      </div>

      {/* Tela */}
      <div className="relative rounded-[34px] overflow-hidden bg-[#090a0f] aspect-[9/19.5] border border-neutral-800/80">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[34px] pointer-events-none" />
      </div>
    </div>
  );
}

export function HeroDeck() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const tratarScroll = () => {
      // Abre o leque após rolar 70px para baixo
      if (window.scrollY > 70) {
        setAberto(true);
      } else {
        setAberto(false);
      }
    };

    window.addEventListener("scroll", tratarScroll, { passive: true });
    return () => window.removeEventListener("scroll", tratarScroll);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[480px] sm:h-[580px] md:h-[640px] mt-12 mb-8 perspective-[1200px]">
      
      {/* 1. Extrema Esquerda (Timer) */}
      <ItemCelular
        src="/apresentacao/timer.jpg"
        alt="Timer e Blocos de Tempo"
        classeDestaque="z-10 brightness-[0.7] hover:brightness-100 hidden sm:block"
        estiloTransform={
          aberto
            ? "translateX(-155%) translateY(45px) rotate(-14deg) scale(0.85)"
            : "translateX(-50%) translateY(0px) rotate(0deg) scale(0.95)"
        }
      />

      {/* 2. Meia Esquerda (Hábitos & Hoje) */}
      <ItemCelular
        src="/apresentacao/hoje.jpg"
        alt="Hoje e Hábitos Diários"
        classeDestaque="z-20 brightness-[0.85] hover:brightness-100"
        estiloTransform={
          aberto
            ? "translateX(-105%) translateY(20px) rotate(-7deg) scale(0.92)"
            : "translateX(-50%) translateY(0px) rotate(0deg) scale(0.98)"
        }
      />

      {/* 3. Meia Direita (Despesas por Categoria / Gráfico) */}
      <ItemCelular
        src="/apresentacao/despesas-categoria.jpg"
        alt="Gráfico de Categorias e Despesas"
        classeDestaque="z-20 brightness-[0.85] hover:brightness-100"
        estiloTransform={
          aberto
            ? "translateX(5%) translateY(20px) rotate(7deg) scale(0.92)"
            : "translateX(-50%) translateY(0px) rotate(0deg) scale(0.98)"
        }
      />

      {/* 4. Extrema Direita (Extrato / Análise) */}
      <ItemCelular
        src="/apresentacao/extrato.jpg"
        alt="Extrato detalhado e lançamentos"
        classeDestaque="z-10 brightness-[0.7] hover:brightness-100 hidden sm:block"
        estiloTransform={
          aberto
            ? "translateX(55%) translateY(45px) rotate(14deg) scale(0.85)"
            : "translateX(-50%) translateY(0px) rotate(0deg) scale(0.95)"
        }
      />

      {/* 5. Celular Central Principal (Painel de Finanças / Home) */}
      <ItemCelular
        src="/apresentacao/painel-financas.jpg"
        alt="Painel Principal VidaTrack"
        classeDestaque="z-30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-emerald-500/20"
        estiloTransform={
          aberto
            ? "translateX(-50%) translateY(-10px) scale(1.02)"
            : "translateX(-50%) translateY(0px) scale(1)"
        }
      />

      {/* Indicador interativo sutil na primeira dobra */}
      {!aberto && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-400 bg-neutral-900/80 px-4 py-1.5 rounded-full border border-neutral-800 animate-bounce">
          Role para baixo para expandir as telas ↓
        </div>
      )}
    </div>
  );
}