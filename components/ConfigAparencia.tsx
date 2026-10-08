"use client";

import { useEffect, useState } from "react";
import { lerAparencia, salvarAparencia, type TamanhoFonte } from "@/lib/preferencias/aparencia";
import { SeletorPaleta } from "@/components/SeletorPaleta";

// Etapa 215 — acessibilidade: texto maior e alto contraste
const TAMANHOS: { valor: TamanhoFonte; rotulo: string; classe: string }[] = [
  { valor: "normal", rotulo: "Normal", classe: "text-sm" },
  { valor: "grande", rotulo: "Grande", classe: "text-base" },
  { valor: "maior", rotulo: "Maior", classe: "text-lg" },
];

export function ConfigAparencia() {
  const [fonte, setFonte] = useState<TamanhoFonte>("normal");
  const [contraste, setContraste] = useState(false);
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const a = lerAparencia();
    setFonte(a.fonte);
    setContraste(a.contrasteAlto);
    try {
      setTema((localStorage.getItem("vidatrack-tema") as "dark" | "light") || "dark");
    } catch {}
  }, []);

  const mudar = (f: TamanhoFonte, c: boolean) => {
    setFonte(f);
    setContraste(c);
    salvarAparencia(f, c);
  };

  const mudarTema = (t: "dark" | "light") => {
    setTema(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("vidatrack-tema", t);
    } catch {}
  };

  return (
    <section className="mt-10 pt-6 border-t border-base-600">
      <h2 className="font-display font-semibold">🔤 Aparência</h2>
      <p className="text-xs text-ink-400 mt-1 mb-4">Vale só para este aparelho.</p>

      <p className="text-sm text-ink-400 mb-2">Tamanho do texto</p>
      <div className="grid grid-cols-3 gap-2 max-w-sm mb-5">
        {TAMANHOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => mudar(t.valor, contraste)}
            aria-pressed={fonte === t.valor}
            className={`rounded-lg border py-2.5 ${t.classe} transition ${
              fonte === t.valor ? "border-ink-100 bg-base-700" : "border-base-600 text-ink-400"
            }`}
          >
            Aa <span className="block text-xs">{t.rotulo}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-400 mb-2">Tema</p>
      <div className="grid grid-cols-2 gap-2 max-w-sm mb-5">
        {(["dark", "light"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => mudarTema(t)}
            aria-pressed={tema === t}
            className={`rounded-lg border py-2.5 text-sm transition ${tema === t ? "border-ink-100 bg-base-700" : "border-base-600 text-ink-400"}`}
          >
            {t === "dark" ? "🌙 Escuro" : "☀️ Claro"}
          </button>
        ))}
      </div>

      {/* Etapa 276 — paletas extras (recompensa de convite) */}
      <SeletorPaleta />

      <label className="flex items-center justify-between gap-3 max-w-sm cursor-pointer">
        <span>
          <span className="block text-sm">Alto contraste</span>
          <span className="block text-xs text-ink-400">Textos secundários e bordas mais fortes</span>
        </span>
        <input
          type="checkbox"
          checked={contraste}
          onChange={(e) => mudar(fonte, e.target.checked)}
          className="w-5 h-5 accent-current"
        />
      </label>
    </section>
  );
}
