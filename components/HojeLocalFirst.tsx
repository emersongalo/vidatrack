"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { registerPlugin } from "@capacitor/core";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { SugestoesHabito } from "@/components/SugestoesHabito";
import { ListaHojeComOffline } from "@/components/ListaHojeComOffline";
import type { ItemAgenda } from "@/components/ItemLinhaAgenda";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

/**
 * Etapa 132 — antes essa tela guardava um cache separado "por dia
 * exato" (hoje:2026-09-17:tudo, hoje:2026-09-18:tudo...). Isso só
 * ajudava se você tivesse aberto o app com internet NAQUELE dia
 * específico — abrir offline num dia novo, sem ter aberto com
 * internet ainda hoje, mostrava "Vamos começar?" como se não
 * tivesse nenhum hábito, mesmo com tudo salvo no aparelho.
 *
 * Agora usa o mesmo retrato completo (useSnapshotOffline) que todas
 * as outras telas já usam — hábitos e tarefas não mudam de um dia
 * pro outro, só o que já foi marcado é que muda, então dá pra
 * calcular "o que aparece hoje" na hora, pra qualquer dia, sem
 * precisar ter visitado esse dia exato antes.
 */
export function HojeLocalFirst() {
  return (
    <Suspense fallback={null}>
      <HojeConteudo />
    </Suspense>
  );
}

function HojeConteudo() {
  const hoje = hojeISO();
  const searchParams = useSearchParams();
  const [dataSelecionada, setDataSelecionada] = useState(searchParams.get("data") || hoje);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const { snapshot, recarregar } = useSnapshotOffline();

  const categorias = snapshot?.categoriasProdutividade ?? [];

  const { itens, temAlgumItemCadastrado } = useMemo(() => {
    if (!snapshot) return { itens: null as ItemAgenda[] | null, temAlgumItemCadastrado: true };

    const checkinsPorHabito = new Map<string, number>();
    for (const c of snapshot.habitoCheckins) {
      if (c.data === dataSelecionada) checkinsPorHabito.set(c.habito_id, c.quantidade ?? 1);
    }
    const tarefasFeitasHoje = new Set(
      snapshot.conclusoesTarefas.filter((c) => c.data === dataSelecionada).map((c) => c.tarefa_id)
    );

    const lista: ItemAgenda[] = [];

    for (const h of snapshot.habitos as any[]) {
      if (!diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dataSelecionada)) continue;
      if (categoriaFiltro && h.categoria_id !== categoriaFiltro) continue;
      const quantidadeAtual = checkinsPorHabito.get(h.id) ?? 0;
      const meta = h.meta_diaria ?? 1;
      lista.push({
        id: h.id,
        tipo: "habito",
        titulo: h.nome,
        icone: h.icone,
        cor: h.cor,
        feito: quantidadeAtual >= meta,
        repete: true,
        horarioLembrete: h.horario_lembrete,
        meta: meta > 1 ? { atual: quantidadeAtual, alvo: meta, unidade: h.unidade } : null,
        ordem: h.ordem ?? 0,
      });
    }

    for (const t of snapshot.tarefas as any[]) {
      const apareceHoje =
        t.repetir === "nenhuma"
          ? t.data === dataSelecionada
          : diaBateComFrequencia(t.repetir, t.dias_semana ?? [], dataSelecionada);
      if (!apareceHoje) continue;
      if (categoriaFiltro && t.categoria_id !== categoriaFiltro) continue;

      const subtarefas = (t.subtarefas as { feita: boolean }[]) ?? [];
      lista.push({
        id: t.id,
        tipo: "tarefa",
        titulo: t.titulo,
        icone: t.icone,
        cor: "nota",
        feito: t.repetir === "nenhuma" ? t.concluida : tarefasFeitasHoje.has(t.id),
        repete: t.repetir !== "nenhuma",
        horarioLembrete: t.horario_lembrete,
        progressoSubtarefas:
          subtarefas.length > 0
            ? { feitas: subtarefas.filter((s) => s.feita).length, total: subtarefas.length }
            : null,
        ordem: t.ordem ?? 0,
      });
    }

    lista.sort((a, b) => (a.feito !== b.feito ? (a.feito ? 1 : -1) : a.ordem - b.ordem));

    return {
      itens: lista,
      temAlgumItemCadastrado: snapshot.habitos.length > 0 || snapshot.tarefas.length > 0,
    };
  }, [snapshot, dataSelecionada, categoriaFiltro]);

  const carregando = itens === null;
  const feitos = itens?.filter((i) => i.feito).length ?? 0;
  const total = itens?.length ?? 0;

  // Etapa 152 — avisa o widget de tela inicial (só existe no app
  // instalado) toda vez que a contagem de hoje muda. Só olha o dia
  // de HOJE de verdade (não outro dia que a pessoa esteja navegando),
  // senão o widget mostraria a contagem de um dia errado.
  useEffect(() => {
    if (dataSelecionada !== hoje) return;
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;
    const WidgetHoje = registerPlugin<{ atualizar: (opcoes: { feitos: number; total: number }) => Promise<{ ok: boolean }> }>(
      "WidgetHoje"
    );
    // Etapa 153 — deixado visível de propósito (não é erro silencioso
    // mais): se algo falhar aqui, dá pra ver exatamente o quê
    // conectando o celular no computador e abrindo
    // chrome://inspect#devices no Chrome do PC.
    console.log("[WidgetHoje] chamando atualizar", { feitos, total });
    WidgetHoje.atualizar({ feitos, total })
      .then((r) => console.log("[WidgetHoje] respondeu", r))
      .catch((erro) => console.error("[WidgetHoje] falhou", erro));
  }, [feitos, total, dataSelecionada, hoje]);

  return (
    <main className="max-w-2xl lg:max-w-5xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-end mb-1">
        <Link
          href={`/habitos/planejador?data=${dataSelecionada}`}
          className="text-sm text-ink-400 hover:text-ink-100 transition"
        >
          🕐 Blocos de tempo
        </Link>
      </div>
      <h1 className="text-2xl font-display font-semibold mb-4">Hoje</h1>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-6 lg:items-start">
        <div>
          <TiraDeDiasAgenda dataSelecionada={dataSelecionada} hojeISO={hoje} aoSelecionarData={setDataSelecionada} />

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mt-4 mb-5 scrollbar-none">
            <button
              onClick={() => setCategoriaFiltro("")}
              className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
                !categoriaFiltro
                  ? "bg-ink-100 text-base-900 border-ink-100"
                  : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              Tudo
            </button>
            {categorias.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
                  categoriaFiltro === cat.id
                    ? "bg-ink-100 text-base-900 border-ink-100"
                    : "border-base-600 text-ink-400 hover:text-ink-100"
                }`}
              >
                {cat.nome}
              </button>
            ))}
            <Link
              href="/habitos/categorias/nova"
              className="shrink-0 text-sm rounded-full px-3.5 py-1.5 border border-dashed border-base-600 text-ink-400 hover:text-ink-100 transition"
            >
              + Nova lista
            </Link>
          </div>

          {carregando ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-base-800 border border-base-600 rounded-xl2" />
              ))}
            </div>
          ) : itens!.length === 0 && !temAlgumItemCadastrado ? (
            <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-8 text-center">
              <p className="font-display font-semibold mb-1">Vamos começar?</p>
              <p className="text-ink-400 text-sm">Toque em uma sugestão pra criar seu primeiro hábito:</p>
              <SugestoesHabito aoCriar={recarregar} />
              <p className="text-ink-400 text-xs mt-5">ou</p>
              <div className="flex gap-2 justify-center mt-4">
                <Link
                  href="/habitos/novo"
                  className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-3.5 py-2 hover:opacity-90 transition"
                >
                  + Hábito
                </Link>
                <Link
                  href="/habitos/tarefas/nova"
                  className="text-sm border border-base-600 rounded-lg px-3.5 py-2 hover:bg-base-700 transition"
                >
                  + Tarefa
                </Link>
              </div>
            </div>
          ) : itens!.length === 0 ? (
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
              <p className="font-display font-semibold mb-1">Nada por aqui</p>
              <p className="text-ink-400 text-sm">✅ Nenhum hábito ou tarefa cai neste dia.</p>
            </div>
          ) : (
            <ListaHojeComOffline itensServidor={itens!} dataISO={dataSelecionada} aoConcluirMutacao={recarregar} />
          )}
        </div>

        {total > 0 && (
          <div className="hidden lg:block bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4 sticky top-6">
            <p className="text-xs text-ink-400 mb-1">Hoje</p>
            <p className="text-3xl font-display font-bold mb-1">
              {feitos}
              <span className="text-ink-400 text-xl">/{total}</span>
            </p>
            <div className="h-1.5 bg-base-600 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-habito rounded-full"
                style={{ width: `${total > 0 ? Math.round((feitos / total) * 100) : 0}%` }}
              />
            </div>
            <Link href="/habitos/estatisticas" className="text-xs text-ink-400 hover:text-ink-100 transition">
              Ver estatísticas →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
