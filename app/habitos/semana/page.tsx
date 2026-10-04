"use client";

// Etapa 221 — relatório da semana.
// Etapa 260 — sem "compartilhar como imagem" (no app não dava pra baixar);
// fica só o resumo da semana.
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { resumoDaSemana, type ResumoSemana } from "@/lib/geral/semana";
import { emojiDoHumor } from "@/lib/habitos/diario";

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function linhasDoResumo(r: ResumoSemana, mostrarGastos: boolean): [string, string, string][] {
  const linhas: [string, string, string][] = [];
  if (r.habitos.devidos > 0) {
    linhas.push(["✅", `${r.habitos.pct}%`, `dos hábitos feitos (${r.habitos.feitos} de ${r.habitos.devidos})`]);
    if (r.habitos.diasPerfeitos > 0)
      linhas.push(["⭐", String(r.habitos.diasPerfeitos), r.habitos.diasPerfeitos === 1 ? "dia perfeito" : "dias perfeitos"]);
    if (r.habitos.melhor) linhas.push(["🏆", r.habitos.melhor.nome, `${r.habitos.melhor.feitos} de ${r.habitos.melhor.devidos} dias`]);
  }
  if (r.tarefas > 0) linhas.push(["📋", String(r.tarefas), r.tarefas === 1 ? "tarefa concluída" : "tarefas concluídas"]);
  if (r.humor) linhas.push([emojiDoHumor(r.humor.media), String(r.humor.media).replace(".", ","), `humor médio (${r.humor.dias} dias)`]);
  if (mostrarGastos && r.gastos.total > 0) {
    const varia =
      r.gastos.variacaoPct === null ? "" : r.gastos.variacaoPct <= 0 ? ` · ${-r.gastos.variacaoPct}% a menos` : ` · ${r.gastos.variacaoPct}% a mais`;
    linhas.push(["💸", formatarMoeda(r.gastos.total), `em gastos${varia}`]);
  }
  return linhas;
}

export default function SemanaPage() {
  const { snapshot } = useSnapshotOffline();

  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;
  const r = resumoDaSemana(snapshot, hojeISO());
  const linhas = linhasDoResumo(r, true);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-2">Sua semana</h1>
      <p className="text-sm text-ink-400 mb-5">
        {ddmm(r.inicio)} a {ddmm(r.fim)}
      </p>

      {linhas.length === 0 ? (
        <p className="text-sm text-ink-400 bg-base-800 border border-base-600 rounded-xl2 p-5">Nada registrado nos últimos 7 dias ainda.</p>
      ) : (
        <ul className="space-y-2">
          {linhas.map(([emoji, valor, texto]) => (
            <li key={texto} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-xl2 p-4">
              <span className="text-2xl">{emoji}</span>
              <span className="min-w-0">
                <span className="block font-semibold font-mono truncate">{valor}</span>
                <span className="block text-xs text-ink-400">{texto}</span>
              </span>
            </li>
          ))}
          {r.gastos.maiorCategoria && (
            <li className="text-xs text-ink-400 px-1">
              Onde mais gastou: {r.gastos.maiorCategoria.nome} ({formatarMoeda(r.gastos.maiorCategoria.valor)})
            </li>
          )}
        </ul>
      )}

      <Link
        href="/habitos/estatisticas"
        className="mt-6 block text-center text-sm text-ink-400 border border-base-600 rounded-2xl py-3 hover:text-ink-100 transition"
      >
        Ver estatísticas completas
      </Link>
    </main>
  );
}
