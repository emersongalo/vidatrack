"use client";

// Etapa 367 — Tudo · Compartilhada · Meu (só aparece quando tem conta dos dois jeitos)
import { temOsDoisTipos, type Escopo } from "@/lib/financas/escopo";
import { vibrar } from "@/lib/app/vibrar";

const OPCOES: { valor: Escopo; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "compartilhada", rotulo: "👥 Compartilhada" },
  { valor: "meu", rotulo: "🔒 Meu" },
];

export function SeletorEscopoFinancas({
  contas,
  meuId,
  escopo,
  aoMudar,
  className = "",
}: {
  contas: any[];
  meuId: string | null | undefined;
  escopo: Escopo;
  aoMudar: (e: Escopo) => void;
  className?: string;
}) {
  if (!temOsDoisTipos(contas, meuId)) return null;
  return (
    <div role="tablist" aria-label="Quais contas mostrar" className={`flex bg-base-800 border border-base-600 rounded-full p-1 ${className}`}>
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          aria-selected={escopo === o.valor}
          onClick={() => {
            vibrar(8);
            aoMudar(o.valor);
          }}
          className={`flex-1 py-2 rounded-full text-sm transition ${
            escopo === o.valor ? "bg-financa text-base-900 font-semibold" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
