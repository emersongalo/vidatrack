"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { calcularPeriodo, formatarMoeda, type PresetPeriodo } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { removerTransacao } from "../actions";
import { Pencil, Trash2 } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

const PRESETS: { valor: PresetPeriodo; rotulo: string }[] = [
  { valor: "este_mes", rotulo: "Este mês" },
  { valor: "mes_passado", rotulo: "Mês passado" },
  { valor: "ultimos_30", rotulo: "Últimos 30 dias" },
  { valor: "este_ano", rotulo: "Este ano" },
  { valor: "tudo", rotulo: "Tudo" },
];

// Etapa 127: filtros viram estado local (sem navegação de URL), dados
// vêm do retrato local — os avatares de "quem lançou" (multi-usuário)
// ficam de fora por enquanto (mesma razão das outras telas: depende
// de foto resolvida no servidor).
export default function ExtratoPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [preset, setPreset] = useState<PresetPeriodo>("este_mes");
  const [visualizacao, setVisualizacao] = useState<"transacoes" | "categorias">("transacoes");

  const contas = snapshot?.financas.contas ?? [];
  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c]));

  const { inicio, fim } = calcularPeriodo(preset);

  const lista = useMemo(() => {
    return (snapshot?.financas.transacoes ?? []).filter((t: any) => {
      if (t.data < inicio || t.data > fim) return false;
      if (tipo !== "todos" && t.tipo !== tipo) return false;
      return true;
    });
  }, [snapshot, inicio, fim, tipo]);

  const totalReceitas = lista.filter((t: any) => t.tipo === "receita").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const totalDespesas = lista.filter((t: any) => t.tipo === "despesa").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const balanco = totalReceitas - totalDespesas;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl lg:max-w-4xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-5">
        <h1 className="text-2xl font-display font-semibold">Extrato</h1>
        <BotaoOcultarValores />
      </div>

      {/* Etapa 169/178 — resumo com selos coloridos, inspirado no
         Despezzas (que mostra 5: Receitas/Recebido/Despesas/Pago/
         Balanço — o VidaTrack não distingue "pago" de "lançado",
         então fica só com os 3 que têm dado de verdade por trás).
         text-xs + break-words (sem truncate) — mesma correção que já
         tinha feito na Início, só que aqui na tela do Extrato eu
         tinha esquecido de aplicar também. */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-habito/15 flex items-center justify-center text-habito mb-1.5">
            <TrendingUp size={14} strokeWidth={2.5} />
          </span>
          <p className="text-[11px] text-ink-400">Receitas</p>
          <p className="text-xs font-mono font-medium text-habito leading-tight break-words">
            <ValorMonetario valor={totalReceitas} />
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-red-400/15 flex items-center justify-center text-red-400 mb-1.5">
            <TrendingDown size={14} strokeWidth={2.5} />
          </span>
          <p className="text-[11px] text-ink-400">Despesas</p>
          <p className="text-xs font-mono font-medium text-red-400 leading-tight break-words">
            <ValorMonetario valor={totalDespesas} />
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-financa/15 flex items-center justify-center text-financa mb-1.5">
            <Scale size={14} strokeWidth={2.5} />
          </span>
          <p className="text-[11px] text-ink-400">Balanço</p>
          <p className={`text-xs font-mono font-medium leading-tight break-words ${balanco < 0 ? "text-red-400" : "text-financa"}`}>
            <ValorMonetario valor={balanco} />
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(["todos", "receita", "despesa"] as const).map((opcao) => (
          <button
            key={opcao}
            onClick={() => setTipo(opcao)}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              tipo === opcao ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {opcao === "todos" ? "Todos" : opcao === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPreset(p.valor)}
            className={`shrink-0 text-xs rounded-full px-3 py-1.5 border transition ${
              preset === p.valor ? "bg-financa/20 border-financa text-financa" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {/* Etapa 174 — alternador Transações/Categorias, inspirado no
         Despezzas (que mostra os gastos agrupados por categoria, com
         barra pra quem tem limite, como uma visão alternativa à
         lista crua de lançamentos). */}
      <div className="inline-flex bg-base-800 border border-base-600 rounded-full p-1 mb-6">
        <button
          onClick={() => setVisualizacao("transacoes")}
          className={`px-4 py-1.5 rounded-full text-sm transition ${
            visualizacao === "transacoes" ? "bg-financa text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          Transações
        </button>
        <button
          onClick={() => setVisualizacao("categorias")}
          className={`px-4 py-1.5 rounded-full text-sm transition ${
            visualizacao === "categorias" ? "bg-financa text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          Categorias
        </button>
      </div>

      {visualizacao === "categorias" ? (
        <VisaoPorCategoria lista={lista} mapaCategorias={mapaCategorias} />
      ) : snapshot === undefined ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-base-800 border border-base-600 rounded-lg" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <p className="text-ink-400 text-sm">🧾 Nenhum lançamento nesse período.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((t: any) => {
            const catInfo = mapaCategorias.get(t.categoria_id) as any;
            return (
              <li key={t.id} className="bg-base-800 border border-base-600 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(
                      catInfo?.cor ?? "financa"
                    )}`}
                  >
                    {catInfo?.icone ? (
                      <IconeCategoria icone={catInfo.icone} />
                    ) : t.tipo === "receita" ? (
                      <TrendingUp size={16} strokeWidth={2} />
                    ) : (
                      <TrendingDown size={16} strokeWidth={2} />
                    )}
                  </span>
                  <p className="text-sm truncate flex-1 min-w-0">{t.descricao || mapaContas.get(t.conta_id)}</p>
                  <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                    {t.tipo === "receita" ? "+" : "-"}
                    <ValorMonetario valor={t.valor} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5 pl-12">
                  <p className="text-xs text-ink-400 truncate min-w-0">
                    {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} · {mapaContas.get(t.conta_id)}
                  </p>
                  <MenuAcoes>
                    {(fecharMenu) => (
                      <>
                        <ItemMenuAcoes href={`/financas/${t.id}/editar`}>
                          <Pencil size={15} strokeWidth={2} /> Editar
                        </ItemMenuAcoes>
                        <BotaoComConfirmacao
                          acao={removerTransacao.bind(null, t.id)}
                          textoBotao={
                            <span className="flex items-center gap-2.5">
                              <Trash2 size={15} strokeWidth={2} /> Excluir
                            </span>
                          }
                          textoConfirmacao="Excluir esse lançamento? Não tem volta."
                          classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                          aoConcluir={() => {
                            recarregar();
                            fecharMenu();
                          }}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {(snapshot?.financas.transacoes.length ?? 0) >= 3000 && (
        <p className="text-xs text-ink-400 mt-4">Mostrando as 3.000 transações mais recentes guardadas offline.</p>
      )}
    </main>
  );
}

/**
 * Etapa 174 — gastos/receitas agrupados por categoria, com barra de
 * progresso pra quem tem limite mensal definido (meta_mensal) —
 * inspirado na aba "Categorias" do Extrato do Despezzas.
 */
function VisaoPorCategoria({
  lista,
  mapaCategorias,
}: {
  lista: any[];
  mapaCategorias: Map<string, any>;
}) {
  const porCategoria = new Map<string, { nome: string; icone: string | null; cor: string; valor: number; meta: number | null }>();
  let semCategoria = { valor: 0, count: 0 };

  for (const t of lista) {
    if (!t.categoria_id) {
      semCategoria.valor += Number(t.valor);
      semCategoria.count++;
      continue;
    }
    const info = mapaCategorias.get(t.categoria_id);
    const chave = `${t.categoria_id}-${t.tipo}`;
    const atual = porCategoria.get(chave) ?? {
      nome: info?.nome ?? "Categoria",
      icone: info?.icone ?? null,
      cor: info?.cor ?? "financa",
      valor: 0,
      meta: info?.meta_mensal ? Number(info.meta_mensal) : null,
    };
    atual.valor += Number(t.valor);
    porCategoria.set(chave, atual);
  }

  const despesasPorCategoria = Array.from(porCategoria.entries())
    .filter(([chave]) => chave.endsWith("-despesa"))
    .map(([, v]) => v)
    .sort((a, b) => b.valor - a.valor);
  const receitasPorCategoria = Array.from(porCategoria.entries())
    .filter(([chave]) => chave.endsWith("-receita"))
    .map(([, v]) => v)
    .sort((a, b) => b.valor - a.valor);

  if (despesasPorCategoria.length === 0 && receitasPorCategoria.length === 0) {
    return <p className="text-ink-400 text-sm">🧾 Nenhum lançamento categorizado nesse período.</p>;
  }

  function Linha({ item }: { item: { nome: string; icone: string | null; cor: string; valor: number; meta: number | null } }) {
    const percentual = item.meta ? Math.min(100, Math.round((item.valor / item.meta) * 100)) : null;
    return (
      <div className="py-3 border-b border-base-600 last:border-0">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(item.cor)}`}>
            <IconeCategoria icone={item.icone} />
          </span>
          <p className="text-sm flex-1 min-w-0 truncate">{item.nome}</p>
          <span className="font-mono text-sm shrink-0">
            <ValorMonetario valor={item.valor} />
          </span>
        </div>
        {percentual !== null && (
          <div className="pl-11 mt-1.5">
            <div className="h-1.5 bg-base-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${percentual >= 100 ? "bg-red-400" : "bg-financa"}`}
                style={{ width: `${percentual}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-400 mt-1">de {formatarMoeda(item.meta!)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {despesasPorCategoria.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 px-4 mb-4">
          <p className="text-sm text-ink-400 pt-4 pb-1">Saídas por categoria</p>
          {despesasPorCategoria.map((item) => (
            <Linha key={item.nome} item={item} />
          ))}
          {semCategoria.valor > 0 && (
            <div className="py-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-base-700 flex items-center justify-center text-sm shrink-0 text-ink-400">?</span>
                <p className="text-sm flex-1 text-ink-400">Sem categoria</p>
                <span className="font-mono text-sm text-ink-400">
                  <ValorMonetario valor={semCategoria.valor} />
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {receitasPorCategoria.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 px-4">
          <p className="text-sm text-ink-400 pt-4 pb-1">Entradas por categoria</p>
          {receitasPorCategoria.map((item) => (
            <Linha key={item.nome} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
