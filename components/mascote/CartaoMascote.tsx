"use client";

// Etapa 298 — cartãozinho do mascote na aba Hábitos: mostra o bichinho com
// o humor do dia, uma frase, as moedas e quanto falta pra próxima fase.
// Quem ainda não tem mascote vê um ovinho chamando pra chocar.
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMascote } from "@/lib/mascote/useMascote";
import { fraseDoHumor } from "@/lib/mascote/mascote";
import { Mascote } from "@/components/mascote/Mascote";

export function CartaoMascote({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const { mascote, fase, humor, moedas, dia } = useMascote(snapshot, hoje);
  if (!snapshot) return null;

  if (!mascote) {
    return (
      <Link
        href="/habitos/mascote"
        className="mt-3 flex items-center gap-3 rounded-2xl pl-2 pr-4 py-2 border border-habito/30 bg-habito/10 hover:border-habito transition"
      >
        <Mascote cor="verde" fase={0} humor="feliz" tamanho={64} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">Tem um ovinho pra você 🥚</p>
          <p className="text-xs text-ink-400">Choque seu mascote: ele cresce com seus hábitos e ganha roupinhas.</p>
        </div>
        <ChevronRight size={18} className="text-ink-400 shrink-0" />
      </Link>
    );
  }

  const semente = (dia?.habitos.feitos ?? 0) + new Date().getDate();
  return (
    <Link
      href="/habitos/mascote"
      className="mt-3 flex items-center gap-3 rounded-2xl pl-2 pr-4 py-2 border border-habito/30 hover:border-habito transition"
      style={{ background: "linear-gradient(120deg, rgb(var(--c-habito) / 0.14), rgb(var(--c-nota) / 0.06))" }}
    >
      <Mascote cor={mascote.cor} fase={fase.nivel} humor={humor} equipados={mascote.equipados} tamanho={72} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{mascote.nome}</p>
          <span className="text-[10px] font-semibold rounded-full bg-habito/15 text-habito px-1.5 py-0.5 shrink-0">{fase.nome}</span>
          <span className="ml-auto text-xs font-mono font-semibold text-financa shrink-0">🪙 {moedas}</span>
        </div>
        <p className="text-xs text-ink-300 truncate">{fraseDoHumor(humor, semente)}</p>
        {fase.proxima && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-base-900/60 overflow-hidden">
              <div className="h-full rounded-full bg-habito transition-all duration-700" style={{ width: `${Math.round(fase.progresso * 100)}%` }} />
            </div>
            <span className="text-[10px] text-ink-400 shrink-0">
              {fase.faltam} p/ {fase.proxima.nome}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
