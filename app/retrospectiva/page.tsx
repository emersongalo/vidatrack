"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { calcularRetrospectiva } from "@/lib/geral/retrospectiva";
import { emojiDoHumor } from "@/lib/habitos/diario";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";

// Etapa 215 — retrospectiva do ano (dá pra ver a qualquer momento: "até agora")
export default function RetrospectivaPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function Cartao({ emoji, titulo, valor, detalhe, cor = "financa" }: { emoji: string; titulo: string; valor: string; detalhe?: string; cor?: string }) {
  const bordas: Record<string, string> = { financa: "border-financa/40", habito: "border-habito/40", nota: "border-nota/40" };
  return (
    <div className={`bg-base-800 border ${bordas[cor] ?? bordas.financa} rounded-xl2 p-4`}>
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xs text-ink-400">{titulo}</p>
      <p className="text-xl font-display font-semibold break-words">{valor}</p>
      {detalhe && <p className="text-xs text-ink-400 mt-1">{detalhe}</p>}
    </div>
  );
}

function Conteudo() {
  const params = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const ocultos = useValoresOcultos();
  const hoje = hojeISO();
  const anoAtual = Number(hoje.slice(0, 4));
  const ano = Number(params.get("ano")) || anoAtual;
  const [aviso, setAviso] = useState<string | null>(null);

  if (snapshot === undefined) {
    return <main className="min-h-screen p-6 md:p-12 pagina animate-pulse"><div className="h-64 bg-base-800 rounded-xl2" /></main>;
  }
  if (!snapshot) {
    return <main className="min-h-screen p-6 md:p-12 pagina"><p className="text-ink-400">Abra o app com internet uma vez pra montar sua retrospectiva.</p></main>;
  }

  const r = calcularRetrospectiva(snapshot, ano, hoje);
  const dinheiro = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));
  const parcial = r.ateData < `${ano}-12-31`;

  const textoCompartilhar = [
    `Minha retrospectiva ${ano} no VidaTrack${parcial ? " (até agora)" : ""}:`,
    r.habitos.diasComHabito ? `✅ ${r.habitos.diasComHabito} dias cuidando dos meus hábitos` : null,
    r.habitos.maiorSequencia ? `🔥 Maior sequência: ${r.habitos.maiorSequencia.dias} dias de ${r.habitos.maiorSequencia.nome}` : null,
    r.tarefasConcluidas ? `📝 ${r.tarefasConcluidas} tarefas concluídas` : null,
    r.metasConcluidas ? `🎯 ${r.metasConcluidas} meta(s) de economia alcançada(s)` : null,
    r.humor.media !== null ? `${emojiDoHumor(r.humor.media)} Humor médio ${r.humor.media.toFixed(1).replace(".", ",")}/5` : null,
    "vidatrack.online",
  ]
    .filter(Boolean)
    .join("\n");

  async function compartilhar() {
    setAviso(null);
    try {
      if (navigator.share) {
        await navigator.share({ text: textoCompartilhar });
        return;
      }
    } catch {
      return; // cancelou
    }
    try {
      await navigator.clipboard.writeText(textoCompartilhar);
      setAviso("Texto copiado! Cole no WhatsApp ou Instagram — ou tire um print desta tela.");
    } catch {
      setAviso("Tire um print desta tela pra compartilhar.");
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Estatísticas
      </Link>

      <div className="mt-4 mb-6 rounded-xl2 p-6 bg-gradient-to-br from-habito/25 via-nota/20 to-financa/25 border border-base-600 text-center">
        <p className="text-sm text-ink-400">Sua retrospectiva</p>
        <div className="flex items-center justify-center gap-4 mt-1">
          <Link href={`/retrospectiva?ano=${ano - 1}`} className="text-ink-400 hover:text-ink-100 px-2" aria-label="Ano anterior">‹</Link>
          <h1 className="text-4xl font-display font-bold">{ano}</h1>
          {ano < anoAtual ? (
            <Link href={`/retrospectiva?ano=${ano + 1}`} className="text-ink-400 hover:text-ink-100 px-2" aria-label="Próximo ano">›</Link>
          ) : (
            <span className="px-2 opacity-0">›</span>
          )}
        </div>
        {parcial && <p className="text-xs text-ink-400 mt-1">até {r.ateData.split("-").reverse().join("/")}</p>}
      </div>

      <h2 className="text-sm text-ink-400 mb-2">Hábitos e tarefas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Cartao cor="habito" emoji="✅" titulo="Dias com hábito feito" valor={String(r.habitos.diasComHabito)} detalhe={`${r.habitos.totalMarcacoes} marcações`} />
        <Cartao
          cor="habito"
          emoji="🔥"
          titulo="Maior sequência"
          valor={r.habitos.maiorSequencia ? `${r.habitos.maiorSequencia.dias} dias` : "—"}
          detalhe={r.habitos.maiorSequencia?.nome}
        />
        <Cartao cor="habito" emoji="⭐" titulo="Hábito mais feito" valor={r.habitos.maisFeito?.nome ?? "—"} detalhe={r.habitos.maisFeito ? `${r.habitos.maisFeito.dias} dias` : undefined} />
        <Cartao cor="nota" emoji="📝" titulo="Tarefas concluídas" valor={String(r.tarefasConcluidas)} />
      </div>

      <h2 className="text-sm text-ink-400 mb-2">Dinheiro</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Cartao emoji="💰" titulo={r.financas.economia >= 0 ? "Sobrou no ano" : "Faltou no ano"} valor={dinheiro(Math.abs(r.financas.economia))} detalhe={`${dinheiro(r.financas.receitas)} entraram · ${dinheiro(r.financas.despesas)} saíram`} />
        <Cartao emoji="🛒" titulo="Onde mais gastou" valor={r.financas.categoriaTop?.nome ?? "—"} detalhe={r.financas.categoriaTop ? dinheiro(r.financas.categoriaTop.valor) : undefined} />
        <Cartao emoji="🏆" titulo="Mês que mais sobrou" valor={r.financas.melhorMes?.mes ?? "—"} detalhe={r.financas.melhorMes ? dinheiro(r.financas.melhorMes.economia) : undefined} />
        <Cartao emoji="🎯" titulo="Metas alcançadas" valor={String(r.metasConcluidas)} detalhe={`${r.financas.lancamentos} lançamentos no ano`} />
      </div>

      {r.humor.diasRegistrados > 0 && (
        <>
          <h2 className="text-sm text-ink-400 mb-2">Humor</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Cartao cor="nota" emoji={emojiDoHumor(r.humor.media ?? 3)} titulo="Humor médio" valor={`${(r.humor.media ?? 0).toFixed(1).replace(".", ",")} / 5`} detalhe={`${r.humor.diasRegistrados} dias no diário`} />
            <Cartao cor="nota" emoji="😄" titulo="Dias ótimos" valor={String(r.humor.diasOtimos)} />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={compartilhar}
        className="w-full lg:w-auto lg:px-10 bg-ink-100 text-base-900 font-medium rounded-lg py-3 hover:opacity-90 transition"
      >
        Compartilhar
      </button>
      {aviso && <p className="text-sm text-habito mt-3">{aviso}</p>}
      <p className="text-xs text-ink-400 mt-3">Os valores em dinheiro não vão no texto compartilhado.</p>
    </main>
  );
}
