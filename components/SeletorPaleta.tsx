"use client";

// Etapa 276 — paletas extras do tema escuro. Liberam quando 1 pessoa que
// entrou pelo seu convite usa o app de verdade (7+ dias de conta).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import {
  PALETAS,
  aplicarPaleta,
  lerPaleta,
  marcarPaletasLiberadas,
  paletasLiberadasNoAparelho,
  type Paleta,
} from "@/lib/preferencias/paletas";
import { explodirEm } from "@/lib/app/festa";

export function SeletorPaleta() {
  const [paleta, setPaleta] = useState<Paleta>("padrao");
  const [liberadas, setLiberadas] = useState(false);

  useEffect(() => {
    setPaleta(lerPaleta());
    if (paletasLiberadasNoAparelho()) {
      setLiberadas(true);
      return;
    }
    if (!navigator.onLine) return;
    fetch("/api/indicacoes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.ativos > 0) {
          marcarPaletasLiberadas();
          setLiberadas(true);
        }
      })
      .catch(() => {});
  }, []);

  function escolher(p: Paleta, el: HTMLElement) {
    setPaleta(p);
    aplicarPaleta(p);
    if (p !== "padrao") explodirEm(el, { quantidade: 10 });
  }

  return (
    <div className="mb-5">
      <p className="text-sm text-ink-400 mb-2">Cores do tema escuro</p>
      <div className="grid grid-cols-4 gap-2 max-w-sm">
        {PALETAS.map((p) => {
          const bloqueada = p.recompensa && !liberadas;
          return (
            <button
              key={p.valor}
              type="button"
              disabled={bloqueada}
              onClick={(e) => escolher(p.valor, e.currentTarget)}
              aria-pressed={paleta === p.valor}
              className={`relative rounded-xl border p-1.5 text-center transition disabled:cursor-not-allowed ${
                paleta === p.valor ? "border-ink-100 ring-1 ring-inset ring-ink-100" : "border-base-600"
              }`}
            >
              <span className="flex h-8 rounded-lg overflow-hidden" aria-hidden>
                {p.amostra.map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className={`block text-[11px] mt-1 ${bloqueada ? "text-ink-400" : ""}`}>
                {p.emoji} {p.nome}
              </span>
              {bloqueada && (
                <span className="absolute inset-0 rounded-xl bg-base-900/50 flex items-center justify-center">
                  <Lock size={14} className="text-ink-100" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!liberadas && (
        <p className="text-xs text-ink-400 mt-2 max-w-sm">
          🎁 Libere Oceano, Floresta e Ameixa: convide 1 amigo que use o VidaTrack por uma semana.{" "}
          <Link href="/convidar" className="text-habito hover:underline">
            Convidar →
          </Link>
        </p>
      )}
      <p className="text-[11px] text-ink-400 mt-1">Vale no tema escuro.</p>
    </div>
  );
}
