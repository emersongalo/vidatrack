"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { habitoDevidoNoDia, emPausa, pausaAtualOuFutura } from "@/lib/habitos/pausa";
import Link from "next/link";
import { ContasDoDia } from "@/components/ContasDoDia";
import { DiarioDoDia } from "@/components/DiarioDoDia";
import { SugestoesLembrete } from "@/components/SugestoesLembrete";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { diaBateComFrequencia, feitosNaSemana } from "@/lib/agenda/dias";
import { tarefaApareceNoDia, tarefaAtrasada } from "@/lib/agenda/recorrencia";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { SugestoesHabito } from "@/components/SugestoesHabito";
import { ListaHojeComOffline } from "@/components/ListaHojeComOffline";
import { ordenarItensAgenda, type ItemAgenda } from "@/components/ItemLinhaAgenda";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { HeroHoje } from "@/components/HeroHoje";
import { ultimosDias } from "@/lib/habitos/detalhe";
import { calcularStreak } from "@/lib/habitos/streak";
import { pausasDe } from "@/lib/habitos/pausa";
import { resumoDaSemana } from "@/lib/geral/semana";
import { createClient } from "@/lib/supabase/client";
import { EstadoVazio } from "@/components/EstadoVazio";
import { infoDupla, type Parceiro } from "@/lib/habitos/dupla";
import { Esqueleto } from "@/components/Esqueleto";
import { Settings2, Check, Pin, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import {
  NOMES_BLOCOS_HOJE,
  alternarVisivel,
  fixarItemNoTopo,
  lerLayoutHoje,
  moverItem,
  salvarLayoutHoje,
  type BlocoHoje,
  type BlocoHojeId,
} from "@/lib/habitos/blocosHoje";

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
/**
 * Etapa 249 — encadear hábitos ("depois do café → ler"): o hábito que
 * vem depois aparece logo abaixo do primeiro e, quando o primeiro é
 * feito, sobe pro topo com o selo "Agora!".
 */
export function encadearHabitos(lista: ItemAgenda[], habitos: { id: string; depois_de?: string | null }[]) {
  const porId = new Map(lista.map((i) => [i.id, i]));
  const filhos: ItemAgenda[] = [];
  for (const h of habitos) {
    if (!h.depois_de) continue;
    const item = porId.get(h.id);
    const pai = porId.get(h.depois_de);
    if (!item || !pai || item.tipo !== "habito" || pai.tipo !== "habito") continue;
    item.encadeado = { depoisDe: pai.titulo, paiId: pai.id, liberado: pai.feito };
    if (!item.feito) filhos.push(item);
  }
  if (!filhos.length) return;
  // tira os filhos pendentes e recoloca no lugar certo
  const resto = lista.filter((i) => !filhos.includes(i));
  const liberados = filhos.filter((f) => f.encadeado!.liberado);
  const esperando = filhos.filter((f) => !f.encadeado!.liberado);
  const saida: ItemAgenda[] = [...liberados];
  for (const i of resto) {
    saida.push(i);
    for (const f of esperando) if (f.encadeado!.paiId === i.id) saida.push(f);
  }
  for (const f of esperando) if (!saida.includes(f)) saida.push(f);
  lista.splice(0, lista.length, ...saida);
}

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
  // Etapa 227 — personalizar a tela (ordem e blocos escondidos, por login)
  const [editandoLayout, setEditandoLayout] = useState(false);
  const [layoutEditado, setLayoutEditado] = useState<BlocoHoje[] | null>(null);
  const [salvandoLayout, setSalvandoLayout] = useState(false);
  const [erroLayout, setErroLayout] = useState<string | null>(null);

  const categorias = snapshot?.categoriasProdutividade ?? [];

  const { itens, temAlgumItemCadastrado, tarefasDoDia } = useMemo(() => {
    if (!snapshot) return { itens: null as ItemAgenda[] | null, temAlgumItemCadastrado: true, tarefasDoDia: { total: 0, feitas: 0 } };

    const checkinsPorHabito = new Map<string, number>();
    for (const c of snapshot.habitoCheckins) {
      if (c.data === dataSelecionada) checkinsPorHabito.set(c.habito_id, c.quantidade ?? 1);
    }
    const tarefasFeitasHoje = new Set(
      snapshot.conclusoesTarefas.filter((c) => c.data === dataSelecionada).map((c) => c.tarefa_id)
    );

    const lista: ItemAgenda[] = [];

    // Etapa 233 — hábitos em dupla
    const parceirosPorHabito = new Map<string, Parceiro[]>();
    for (const p of snapshot.parceiros ?? []) {
      const l = parceirosPorHabito.get(p.habito_id) ?? [];
      l.push({ id: p.usuario_id, nome: p.nome });
      parceirosPorHabito.set(p.habito_id, l);
    }
    const checkinsDeTodos = [...snapshot.habitoCheckins, ...(snapshot.checkinsCompartilhados ?? [])];
    const eu = snapshot.perfil.id;
    const horaDoDia = dataSelecionada === hoje ? new Date().getHours() : dataSelecionada < hoje ? 23 : 0;

    for (const h of snapshot.habitos as any[]) {
      if (!habitoDevidoNoDia(h, dataSelecionada)) continue;
      if (categoriaFiltro && h.categoria_id !== categoriaFiltro) continue;
      const quantidadeAtual = checkinsPorHabito.get(h.id) ?? 0;
      const meta = h.meta_diaria ?? 1;
      // Etapa 213 — "X por semana": conta os dias feitos na semana até o dia visto
      let semana: { feitos: number; meta: number } | null = null;
      if (h.frequencia === "semanal") {
        const diasFeitos = snapshot.habitoCheckins
          .filter((c) => c.habito_id === h.id && (c.quantidade ?? 1) >= meta)
          .map((c) => c.data);
        semana = { feitos: feitosNaSemana(diasFeitos, dataSelecionada), meta: h.vezes_semana ?? 3 };
      }
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
        semana,
        ordem: h.ordem ?? 0,
        // Etapa 230 — bolinhas dos últimos 7 dias
        ultimos7: h.eh_negativo ? null : ultimosDias(h, snapshot.habitoCheckins, dataSelecionada),
        dupla:
          !h.eh_negativo && parceirosPorHabito.has(h.id)
            ? infoDupla(h, checkinsDeTodos, eu, parceirosPorHabito.get(h.id)!, dataSelecionada, horaDoDia)
            : null,
        ehHoje: dataSelecionada === hoje,
      });
    }

    // Etapa 264 — tarefas agora têm área própria (/tarefas): aqui ficam só
    // os hábitos, e as tarefas do dia viram um atalho logo abaixo.
    const tarefasDoDia = { total: 0, feitas: 0 };
    for (const t of snapshot.tarefas as any[]) {
      // Etapa 193 — regra única de repetição (lib/agenda/recorrencia) +
      // tarefa única atrasada aparece no dia de HOJE até ser concluída.
      const atrasada = dataSelecionada === hoje && tarefaAtrasada(t, hoje);
      const apareceHoje = atrasada || tarefaApareceNoDia(t, dataSelecionada);
      if (!apareceHoje) continue;
      if (categoriaFiltro && t.categoria_id !== categoriaFiltro) continue;

      tarefasDoDia.total++;
      if (t.repetir === "nenhuma" ? t.concluida : tarefasFeitasHoje.has(t.id)) tarefasDoDia.feitas++;
    }

    lista.sort(ordenarItensAgenda);
    encadearHabitos(lista, snapshot.habitos as any[]);

    return {
      itens: lista,
      temAlgumItemCadastrado: snapshot.habitos.length > 0 || snapshot.tarefas.length > 0,
      tarefasDoDia,
    };
  }, [snapshot, dataSelecionada, categoriaFiltro]);

  const carregando = itens === null;
  const feitos = itens?.filter((i) => i.feito).length ?? 0;
  const total = itens?.length ?? 0;

  // Etapa 195 — o widget "Hoje" agora é alimentado pelo SincronizadorWidgets (layout).

  // Etapa 227 — números do topo (mesmo estilo do topo de Finanças)
  const numerosTopo = useMemo(() => {
    if (!snapshot) return { sequencia: 0, taxaSemana: null as number | null };
    let sequencia = 0;
    for (const h of snapshot.habitos as any[]) {
      if (h.eh_negativo) continue;
      const meta = Math.max(1, Number(h.meta_diaria) || 1);
      const datas = snapshot.habitoCheckins.filter((c) => c.habito_id === h.id && (c.quantidade ?? 1) >= meta).map((c) => c.data);
      sequencia = Math.max(sequencia, calcularStreak(datas, pausasDe(h), hoje));
    }
    const semana = resumoDaSemana(snapshot, hoje);
    return { sequencia, taxaSemana: semana.habitos.devidos > 0 ? semana.habitos.pct : null };
  }, [snapshot, hoje]);

  const layoutSalvo = lerLayoutHoje(snapshot?.perfil?.ordem_blocos_habitos);
  const layout = editandoLayout && layoutEditado ? layoutEditado : layoutSalvo;

  async function salvarLayout() {
    if (!layoutEditado || !snapshot) return setEditandoLayout(false);
    setSalvandoLayout(true);
    setErroLayout(null);
    const { error } = await createClient()
      .from("perfis")
      .update({ ordem_blocos_habitos: salvarLayoutHoje(layoutEditado) })
      .eq("id", snapshot.perfil.id);
    if (error) setErroLayout("Não consegui salvar. Verifique a internet.");
    else {
      await atualizarSnapshotEmTodasAsTelas();
      setEditandoLayout(false);
    }
    setSalvandoLayout(false);
  }

  const blocos: Record<BlocoHojeId, React.ReactNode> = {
    resumo: snapshot ? (
      <HeroHoje
        feitos={feitos}
        total={total}
        sequencia={numerosTopo.sequencia}
        taxaSemana={numerosTopo.taxaSemana}
        dataSelecionada={dataSelecionada}
        hoje={hoje}
        aoMudarData={setDataSelecionada}
      />
    ) : null,
    lista: (
      <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4 scrollbar-none">
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
            <Esqueleto linhas={4} comTopo={false} />
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
                  href="/tarefas/nova"
                  className="text-sm border border-base-600 rounded-lg px-3.5 py-2 hover:bg-base-700 transition"
                >
                  + Tarefa
                </Link>
              </div>
            </div>
          ) : itens!.length === 0 ? (
            <EstadoVazio tom="habito" emoji="🌤️" titulo="Dia livre" texto="Nenhum hábito cai neste dia." />
          ) : (
            <>
              <ListaHojeComOffline itensServidor={itens!} dataISO={dataSelecionada} aoConcluirMutacao={recarregar} />
              {/* Etapa 233 — atalho pro jardim quando tem hábito em dupla */}
              {itens!.some((i) => i.dupla) && (
                <Link
                  href="/habitos/juntos"
                  className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 border border-habito/30 bg-habito/10 hover:border-habito transition"
                >
                  <span className="text-2xl">🌱</span>
                  <span className="flex-1 text-base font-medium">Jardim da dupla</span>
                  <span className="text-ink-400">›</span>
                </Link>
              )}
            </>
          )}
          {tarefasDoDia.total > 0 && (
            <Link
              href="/tarefas"
              className="mt-3 flex items-center gap-3 rounded-2xl px-4 py-3 border border-nota/30 bg-nota/10 hover:border-nota transition"
            >
              <span className="text-2xl">📋</span>
              <span className="flex-1 min-w-0">
                <span className="block text-base font-medium">Tarefas de {dataSelecionada === hoje ? "hoje" : "nesse dia"}</span>
                <span className="block text-xs text-ink-400">
                  {tarefasDoDia.feitas === tarefasDoDia.total ? "Todas feitas ✓" : `${tarefasDoDia.feitas} de ${tarefasDoDia.total} feitas`}
                </span>
              </span>
              <span className="text-nota text-sm font-medium">Abrir ›</span>
            </Link>
          )}
      </div>
    ),
    pausados: !snapshot
      ? null
      : (() => {
              const pausados = (snapshot.habitos as any[]).filter((h) => emPausa(h, dataSelecionada));
              if (!pausados.length) return null;
              const fim = pausaAtualOuFutura(pausados[0], dataSelecionada)?.fim;
              return (
                <p className="mb-4 text-sm text-ink-400 bg-base-800 border border-base-600 rounded-2xl px-4 py-3">
                  ⏸ {pausados.length === 1 ? `"${pausados[0].nome}" está pausado` : `${pausados.length} hábitos pausados`}
                  {fim ? ` até ${fim.slice(8, 10)}/${fim.slice(5, 7)}` : ""} — a sequência fica guardada.
                </p>
              );
            })(),
    contas: snapshot ? <ContasDoDia snapshot={snapshot} dataISO={dataSelecionada} hojeISO={hoje} /> : null,
    diario: snapshot ? <DiarioDoDia snapshot={snapshot} dataISO={dataSelecionada} hojeISO={hoje} /> : null,
    sugestoes:
      snapshot && dataSelecionada === hoje ? (
        <div className="mt-6">
          <SugestoesLembrete snapshot={snapshot} hojeISO={hoje} />
        </div>
      ) : null,
  };

  const botaoLayout = "w-8 h-8 rounded-lg flex items-center justify-center bg-base-700 text-ink-100 disabled:opacity-30";

  return (
    <main className="max-w-2xl lg:max-w-3xl mx-auto px-6 md:px-12 pt-2 pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-3xl font-display font-bold">Hoje</h1>
        <div className="flex items-center gap-3 text-sm text-ink-400">
          {/* Etapa 221 — rotina da manhã / da noite */}
          <Link href="/habitos/rotina" className="hover:text-ink-100 transition">
            ☀️ Rotina
          </Link>
          <Link href={`/habitos/planejador?data=${dataSelecionada}`} className="hover:text-ink-100 transition">
            🕐 Blocos
          </Link>
          {editandoLayout ? (
            <button
              onClick={salvarLayout}
              disabled={salvandoLayout}
              className="flex items-center gap-1 bg-habito text-base-900 font-semibold rounded-full px-3 py-1.5 disabled:opacity-50"
            >
              <Check size={14} /> {salvandoLayout ? "..." : "Salvar"}
            </button>
          ) : (
            <button
              onClick={() => {
                setLayoutEditado(layoutSalvo);
                setErroLayout(null);
                setEditandoLayout(true);
              }}
              aria-label="Personalizar a tela"
              className="hover:text-ink-100 transition"
            >
              <Settings2 size={18} />
            </button>
          )}
        </div>
      </div>
      {editandoLayout && (
        <div className="flex items-center justify-between mb-3 text-sm">
          <p className="text-ink-400">Organize a tela: 📌 fixa no topo, ↑↓ muda a ordem, 👁 esconde.</p>
          <button onClick={() => setEditandoLayout(false)} className="text-ink-400 px-2">
            Cancelar
          </button>
        </div>
      )}
      {erroLayout && <p className="text-sm text-red-400 mb-3">{erroLayout}</p>}

      {layout.map((b, i) => {
        const conteudo = blocos[b.id];
        if (!editandoLayout) return b.visivel && conteudo ? <div key={b.id}>{conteudo}</div> : null;
        return (
          <div key={b.id} className={`mb-4 rounded-2xl border border-habito/40 p-2 ${b.visivel ? "" : "opacity-40"}`}>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-sm font-medium flex-1 min-w-0 truncate px-1">{NOMES_BLOCOS_HOJE[b.id]}</p>
              <button className={botaoLayout} aria-label="Fixar no topo" disabled={i === 0} onClick={() => setLayoutEditado(fixarItemNoTopo(layout, i))}>
                <Pin size={15} />
              </button>
              <button className={botaoLayout} aria-label="Subir" disabled={i === 0} onClick={() => setLayoutEditado(moverItem(layout, i, -1))}>
                <ChevronUp size={15} />
              </button>
              <button className={botaoLayout} aria-label="Descer" disabled={i === layout.length - 1} onClick={() => setLayoutEditado(moverItem(layout, i, 1))}>
                <ChevronDown size={15} />
              </button>
              <button className={botaoLayout} aria-label={b.visivel ? "Esconder" : "Mostrar"} onClick={() => setLayoutEditado(alternarVisivel(layout, i))}>
                {b.visivel ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {b.id !== "lista" && b.id !== "resumo" && !conteudo && <p className="text-xs text-ink-400 px-1">Nada pra mostrar agora</p>}
          </div>
        );
      })}
    </main>
  );
}
