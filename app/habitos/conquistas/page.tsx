"use client";

import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { calcularMelhorStreak } from "@/lib/habitos/streak";

/**
 * Etapa 214 — Conquistas: selos calculados na hora a partir do que já
 * está salvo no aparelho (nada novo no banco). Os bloqueados aparecem
 * apagados com a barra de progresso, pra dar vontade de chegar lá.
 */
type Conquista = { id: string; emoji: string; titulo: string; texto: string; atual: number; alvo: number };

export default function ConquistasPage() {
  const { snapshot } = useSnapshotOffline();
  if (snapshot === undefined) return null;
  if (!snapshot) {
    return (
      <main className="pagina px-6 md:px-12 pt-6">
        <p className="text-ink-400 text-sm">Abra o app com internet uma vez pra carregar suas conquistas.</p>
      </main>
    );
  }

  const meuId = snapshot.perfil.id;
  const positivos = (snapshot.habitos as any[]).filter((h) => !h.eh_negativo);
  const idsPositivos = new Set(positivos.map((h) => h.id));
  const checkinsMeus = snapshot.habitoCheckins.filter((c: any) => idsPositivos.has(c.habito_id) && (!c.usuario_id || c.usuario_id === meuId));

  const porHabito = new Map<string, string[]>();
  for (const c of checkinsMeus) {
    const l = porHabito.get(c.habito_id) ?? [];
    l.push(c.data);
    porHabito.set(c.habito_id, l);
  }
  const melhorSequencia = Math.max(0, ...[...porHabito.values()].map((d) => calcularMelhorStreak(d)));

  const diasAtivos = new Set(checkinsMeus.map((c) => c.data)).size;
  const totalCheckins = checkinsMeus.length;
  const tarefasFeitas = snapshot.conclusoesTarefas.length + (snapshot.tarefas as any[]).filter((t) => t.concluida).length;

  // meses fechados com mais receita que despesa (sem transferências)
  const mesAtual = new Date().toLocaleDateString("sv-SE").slice(0, 7);
  const saldoPorMes = new Map<string, number>();
  for (const t of snapshot.financas.transacoes as any[]) {
    if (t.transferencia_grupo) continue;
    const mes = String(t.data).slice(0, 7);
    if (mes >= mesAtual) continue;
    saldoPorMes.set(mes, (saldoPorMes.get(mes) ?? 0) + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)));
  }
  const mesesNoAzul = [...saldoPorMes.values()].filter((v) => v > 0).length;
  const lancamentos = (snapshot.financas.transacoes as any[]).length;
  const metasConcluidas = (snapshot.financas.metas as any[]).filter((m) => m.concluida).length;

  const lista: Conquista[] = [
    { id: "primeiro-habito", emoji: "🌱", titulo: "Primeiro passo", texto: "Criou seu primeiro hábito", atual: positivos.length, alvo: 1 },
    { id: "seq7", emoji: "🔥", titulo: "Uma semana firme", texto: "7 dias seguidos num hábito", atual: melhorSequencia, alvo: 7 },
    { id: "seq30", emoji: "💪", titulo: "Um mês inteiro", texto: "30 dias seguidos num hábito", atual: melhorSequencia, alvo: 30 },
    { id: "seq100", emoji: "🏆", titulo: "Centenário", texto: "100 dias seguidos num hábito", atual: melhorSequencia, alvo: 100 },
    { id: "check50", emoji: "✅", titulo: "50 check-ins", texto: "Marcou hábitos 50 vezes", atual: totalCheckins, alvo: 50 },
    { id: "check500", emoji: "🌟", titulo: "500 check-ins", texto: "Marcou hábitos 500 vezes", atual: totalCheckins, alvo: 500 },
    { id: "dias30", emoji: "📅", titulo: "Presença", texto: "30 dias diferentes usando os hábitos", atual: diasAtivos, alvo: 30 },
    { id: "tarefas10", emoji: "📝", titulo: "Mão na massa", texto: "Concluiu 10 tarefas", atual: tarefasFeitas, alvo: 10 },
    { id: "tarefas100", emoji: "🚀", titulo: "Produtivo", texto: "Concluiu 100 tarefas", atual: tarefasFeitas, alvo: 100 },
    { id: "lanc1", emoji: "💰", titulo: "Controle começou", texto: "Fez o primeiro lançamento", atual: lancamentos, alvo: 1 },
    { id: "lanc100", emoji: "📊", titulo: "Organizado", texto: "100 lançamentos registrados", atual: lancamentos, alvo: 100 },
    { id: "azul1", emoji: "💙", titulo: "Mês no azul", texto: "Fechou um mês gastando menos do que entrou", atual: mesesNoAzul, alvo: 1 },
    { id: "azul3", emoji: "🏅", titulo: "Trimestre no azul", texto: "3 meses no azul", atual: mesesNoAzul, alvo: 3 },
    { id: "meta1", emoji: "🎯", titulo: "Meta batida", texto: "Concluiu uma meta de economia", atual: metasConcluidas, alvo: 1 },
  ];
  const ganhas = lista.filter((c) => c.atual >= c.alvo).length;

  return (
    <main className="pagina px-6 md:px-12 pt-2 pb-16">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Conquistas</h1>
      <p className="text-ink-400 text-sm mb-6">
        {ganhas} de {lista.length} desbloqueadas
      </p>

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {lista.map((c) => {
          const ganhou = c.atual >= c.alvo;
          const pct = Math.min(100, Math.round((c.atual / c.alvo) * 100));
          return (
            <li
              key={c.id}
              className={`rounded-xl2 border p-4 text-center ${
                ganhou ? "bg-habito/10 border-habito/40" : "bg-base-800 border-base-600"
              }`}
            >
              <p className={`text-4xl mb-2 ${ganhou ? "" : "grayscale opacity-40"}`}>{c.emoji}</p>
              <p className={`text-sm font-medium ${ganhou ? "" : "text-ink-400"}`}>{c.titulo}</p>
              <p className="text-[11px] text-ink-400 mt-0.5 leading-snug">{c.texto}</p>
              {!ganhou && (
                <div className="mt-3">
                  <div className="h-1 bg-base-600 rounded-full overflow-hidden">
                    <div className="h-full bg-habito rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-ink-400 mt-1 font-mono">
                    {Math.min(c.atual, c.alvo)}/{c.alvo}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
