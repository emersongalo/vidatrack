"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X, ChevronLeft, ChevronRight, CalendarDays, ChevronDown, Search } from "lucide-react";
import { TrendingUp, TrendingDown, Scale, ArrowUp, ArrowDown, ArrowLeftRight } from "lucide-react";
import { ListaLancamentosPorDia } from "@/components/ListaLancamentosPorDia";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoPaguei } from "@/components/BotaoPaguei";
import { calcularPeriodo, formatarMoeda, primeiroDiaDoMes, ultimoDiaDoMes, type PresetPeriodo } from "@/lib/financas/formatacao";
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { LinhaComDeslizar } from "@/components/LinhaComDeslizar";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { removerTransacao } from "../actions";
import { Pencil, Trash2 } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Esqueleto } from "@/components/Esqueleto";

const PRESETS: { valor: PresetPeriodo; rotulo: string }[] = [
  { valor: "este_mes", rotulo: "Este mês" },
  { valor: "proximo_mes", rotulo: "Próximo mês" },
  { valor: "mes_passado", rotulo: "Mês passado" },
  { valor: "agendados", rotulo: "Agendados" },
  { valor: "ultimos_30", rotulo: "Últimos 30 dias" },
  { valor: "este_ano", rotulo: "Este ano" },
  { valor: "tudo", rotulo: "Tudo" },
];

// Etapa 127: filtros viram estado local (sem navegação de URL), dados
// vêm do retrato local — os avatares de "quem lançou" (multi-usuário)
// ficam de fora por enquanto (mesma razão das outras telas: depende
// de foto resolvida no servidor).
/**
 * Etapa 197 — o Extrato aceita filtros pela URL, pra que os gráficos
 * de Finanças levem direto pro que você tocou:
 *   ?categoria=<id> (ou "sem")  ?tipo=despesa|receita
 *   ?mes=AAAA-MM  ?dia=AAAA-MM-DD  ?conta=<id>
 * Ex: tocar em "Moradia" no gráfico → só as despesas de Moradia do mês.
 */
function semAcento(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Etapa 208 — período único (mês navegável, atalho, intervalo livre ou um dia)
type Periodo =
  | { tipo: "mes"; mes: string }
  | { tipo: "preset"; preset: PresetPeriodo }
  | { tipo: "intervalo"; de: string; ate: string }
  | { tipo: "dia"; dia: string };

const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const mesDe = (iso: string) => iso.slice(0, 7);
function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
const dataCurta = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function presetParaPeriodo(preset: PresetPeriodo): Periodo {
  const mesAtual = mesDe(new Date().toLocaleDateString("sv-SE"));
  if (preset === "este_mes") return { tipo: "mes", mes: mesAtual };
  if (preset === "proximo_mes") return { tipo: "mes", mes: somarMeses(mesAtual, 1) };
  if (preset === "mes_passado") return { tipo: "mes", mes: somarMeses(mesAtual, -1) };
  return { tipo: "preset", preset };
}

function periodoDaUrl(p: URLSearchParams): Periodo {
  const dia = p.get("dia");
  const mes = p.get("mes");
  const de = p.get("de");
  const ate = p.get("ate");
  const periodo = p.get("periodo") as PresetPeriodo | null;
  if (dia && ISO_DIA.test(dia)) return { tipo: "dia", dia };
  if (de && ate && ISO_DIA.test(de) && ISO_DIA.test(ate)) return { tipo: "intervalo", de: de <= ate ? de : ate, ate: de <= ate ? ate : de };
  if (mes && /^\d{4}-\d{2}$/.test(mes)) return { tipo: "mes", mes };
  if (periodo && PRESETS.some((x) => x.valor === periodo)) return presetParaPeriodo(periodo);
  return { tipo: "mes", mes: mesDe(new Date().toLocaleDateString("sv-SE")) };
}

function limitesDoPeriodo(p: Periodo): { inicio: string; fim: string; rotulo: string } {
  switch (p.tipo) {
    case "mes": {
      const rotulo = new Date(p.mes + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      return { inicio: primeiroDiaDoMes(p.mes + "-01"), fim: ultimoDiaDoMes(p.mes + "-01"), rotulo };
    }
    case "dia":
      return {
        inicio: p.dia,
        fim: p.dia,
        rotulo: new Date(p.dia + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
      };
    case "intervalo":
      return { inicio: p.de, fim: p.ate, rotulo: `${dataCurta(p.de)} até ${dataCurta(p.ate)}` };
    case "preset": {
      const { inicio, fim } = calcularPeriodo(p.preset);
      return { inicio, fim, rotulo: PRESETS.find((x) => x.valor === p.preset)?.rotulo ?? "Período" };
    }
  }
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={null}>
      <ExtratoConteudo />
    </Suspense>
  );
}

function ExtratoConteudo() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const params = useSearchParams();
  const tipoUrl = params.get("tipo");
  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa">(
    tipoUrl === "receita" || tipoUrl === "despesa" ? tipoUrl : "todos"
  );
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDaUrl(new URLSearchParams(params.toString())));
  const [painelPeriodo, setPainelPeriodo] = useState(false);
  const hojeIso = new Date().toLocaleDateString("sv-SE");
  const [deRascunho, setDeRascunho] = useState(primeiroDiaDoMes(hojeIso));
  const [ateRascunho, setAteRascunho] = useState(hojeIso);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(params.get("categoria"));
  const [contaFiltro, setContaFiltro] = useState<string | null>(params.get("conta"));
  // Etapa 218 — filtro por etiqueta
  const [etiquetaFiltro, setEtiquetaFiltro] = useState<string | null>(params.get("etiqueta"));
  const [visualizacao, setVisualizacao] = useState<"transacoes" | "categorias">("transacoes");
  // Etapa 212 — busca por texto (descrição, categoria, conta ou valor)
  const [busca, setBusca] = useState(params.get("busca") ?? "");
  // Etapa 230 — busca fica escondida atrás da lupa
  const [buscaAberta, setBuscaAberta] = useState(!!params.get("busca"));

  // mantém a URL igual aos filtros (voltar/atualizar a página não perde o filtro)
  useEffect(() => {
    const q = new URLSearchParams();
    if (categoriaFiltro) q.set("categoria", categoriaFiltro);
    if (contaFiltro) q.set("conta", contaFiltro);
    if (etiquetaFiltro) q.set("etiqueta", etiquetaFiltro);
    if (tipo !== "todos") q.set("tipo", tipo);
    if (busca.trim()) q.set("busca", busca.trim());
    if (periodo.tipo === "mes") {
      if (periodo.mes !== mesDe(new Date().toLocaleDateString("sv-SE"))) q.set("mes", periodo.mes);
    } else if (periodo.tipo === "dia") q.set("dia", periodo.dia);
    else if (periodo.tipo === "intervalo") {
      q.set("de", periodo.de);
      q.set("ate", periodo.ate);
    } else q.set("periodo", periodo.preset);
    const url = "/financas/extrato" + (q.toString() ? "?" + q.toString() : "");
    if (url !== window.location.pathname + window.location.search) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [categoriaFiltro, contaFiltro, etiquetaFiltro, tipo, periodo, busca]);

  const contas = snapshot?.financas.contas ?? [];
  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c]));

  const { inicio, fim, rotulo: rotuloPeriodo } = limitesDoPeriodo(periodo);
  function escolherPeriodo(p: Periodo) {
    setPeriodo(p);
    setPainelPeriodo(false);
  }

  const termo = semAcento(busca.trim());
  const lista = useMemo(() => {
    const filtrada = (snapshot?.financas.transacoes ?? []).filter((t: any) => {
      if (t.data < inicio || t.data > fim) return false;
      if (tipo !== "todos" && t.tipo !== tipo) return false;
      if (categoriaFiltro === "sem" && t.categoria_id) return false;
      if (categoriaFiltro && categoriaFiltro !== "sem" && t.categoria_id !== categoriaFiltro) return false;
      if (contaFiltro && t.conta_id !== contaFiltro) return false;
      if (etiquetaFiltro && !(t.etiquetas ?? []).includes(etiquetaFiltro)) return false;
      if (termo) {
        const cat = t.categoria_id ? (mapaCategorias.get(t.categoria_id) as any)?.nome ?? "" : "";
        const alvo = semAcento(`${t.descricao ?? ""} ${cat} ${mapaContas.get(t.conta_id) ?? ""} ${(t.etiquetas ?? []).join(" ")} ${Number(t.valor).toFixed(2).replace(".", ",")}`);
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
    // Etapa 207 — agendados/futuros: o mais próximo primeiro
    const futuro = inicio > new Date().toLocaleDateString("sv-SE");
    return futuro ? [...filtrada].sort((a: any, b: any) => String(a.data).localeCompare(String(b.data))) : filtrada;
  }, [snapshot, inicio, fim, tipo, categoriaFiltro, contaFiltro, etiquetaFiltro, termo]);

  const categoriaInfo = categoriaFiltro && categoriaFiltro !== "sem" ? (mapaCategorias.get(categoriaFiltro) as any) : null;

  // Etapa 211 — transferências aparecem na lista, mas não somam como receita/despesa
  const totalReceitas = lista.filter((t: any) => t.tipo === "receita" && !t.transferencia_grupo).reduce((a: number, t: any) => a + Number(t.valor), 0);
  const totalDespesas = lista.filter((t: any) => t.tipo === "despesa" && !t.transferencia_grupo).reduce((a: number, t: any) => a + Number(t.valor), 0);
  const balanco = totalReceitas - totalDespesas;
  // Etapa 209 — quanto ainda falta pagar/receber no período (agendados não marcados)
  const hojeParaPendencia = new Date().toLocaleDateString("sv-SE");
  const pendentes = lista.filter((t: any) => t.data > hojeParaPendencia && !t.pago_em);
  const aPagar = pendentes.filter((t: any) => t.tipo === "despesa").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const aReceber = pendentes.filter((t: any) => t.tipo === "receita").reduce((a: number, t: any) => a + Number(t.valor), 0);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas" className="hidden lg:inline text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-5">
        <h1 className="text-3xl font-display font-bold">Extrato</h1>
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
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-habito/15 flex items-center justify-center text-habito mb-1.5">
            <TrendingUp size={14} strokeWidth={2.5} />
          </span>
          <p className="text-sm text-ink-400">Receitas</p>
          <p className="text-base font-mono font-semibold text-habito leading-tight break-words">
            <ValorMonetario valor={totalReceitas} />
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-red-400/15 flex items-center justify-center text-red-400 mb-1.5">
            <TrendingDown size={14} strokeWidth={2.5} />
          </span>
          <p className="text-sm text-ink-400">Despesas</p>
          <p className="text-base font-mono font-semibold text-red-400 leading-tight break-words">
            <ValorMonetario valor={totalDespesas} />
          </p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-2xl p-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-financa/15 flex items-center justify-center text-financa mb-1.5">
            <Scale size={14} strokeWidth={2.5} />
          </span>
          <p className="text-sm text-ink-400">Balanço</p>
          <p className={`text-base font-mono font-semibold leading-tight break-words ${balanco < 0 ? "text-red-400" : "text-financa"}`}>
            <ValorMonetario valor={balanco} />
          </p>
        </div>
      </div>

      {(aPagar > 0 || aReceber > 0) && (
        <div className="flex items-center justify-between gap-3 bg-financa/10 border border-financa/30 rounded-xl px-3 py-2.5 mb-3 text-sm">
          <span className="text-ink-400">Ainda não pago nesse período</span>
          <span className="font-mono text-right">
            {aPagar > 0 && (
              <span className="text-red-400">
                −<ValorMonetario valor={aPagar} />
              </span>
            )}
            {aPagar > 0 && aReceber > 0 && <span className="text-ink-400"> · </span>}
            {aReceber > 0 && (
              <span className="text-habito">
                +<ValorMonetario valor={aReceber} />
              </span>
            )}
          </span>
        </div>
      )}

      {/* Etapa 230 — período, busca e filtros ficam presos no topo ao rolar */}
      <div className="sticky top-0 z-20 -mx-6 px-6 md:-mx-12 md:px-12 pt-3 pb-1 mb-3 bg-base-900/95 backdrop-blur border-b border-base-600/60" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
      {/* Etapa 208 — período: setas navegam mês a mês; tocar no nome abre
         os atalhos e a escolha de datas. Tudo cabe na tela. */}
      <div className="flex items-stretch gap-2 mb-3">
        {periodo.tipo === "mes" && (
          <button
            type="button"
            onClick={() => setPeriodo({ tipo: "mes", mes: somarMeses(periodo.mes, -1) })}
            aria-label="Mês anterior"
            className="w-10 shrink-0 rounded-xl border border-base-600 bg-base-800 flex items-center justify-center text-ink-400 hover:text-ink-100 transition"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setPainelPeriodo((v) => !v)}
          className={`flex-1 min-w-0 rounded-xl border px-3 py-3 flex items-center justify-center gap-2 text-base transition ${
            painelPeriodo ? "border-financa bg-financa/10 text-financa" : "border-base-600 bg-base-800 text-ink-100"
          }`}
        >
          <CalendarDays size={16} className="shrink-0" />
          <span className="truncate capitalize font-medium">{rotuloPeriodo}</span>
          <ChevronDown size={15} className={`shrink-0 transition ${painelPeriodo ? "rotate-180" : ""}`} />
        </button>
        {periodo.tipo === "mes" && (
          <button
            type="button"
            onClick={() => setPeriodo({ tipo: "mes", mes: somarMeses(periodo.mes, 1) })}
            aria-label="Próximo mês"
            className="w-10 shrink-0 rounded-xl border border-base-600 bg-base-800 flex items-center justify-center text-ink-400 hover:text-ink-100 transition"
          >
            <ChevronRight size={18} />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (buscaAberta) setBusca("");
            setBuscaAberta((v) => !v);
          }}
          aria-label={buscaAberta ? "Fechar busca" : "Buscar"}
          className={`w-11 shrink-0 rounded-xl border flex items-center justify-center transition ${
            buscaAberta || busca ? "border-financa bg-financa/10 text-financa" : "border-base-600 bg-base-800 text-ink-400 hover:text-ink-100"
          }`}
        >
          {buscaAberta ? <X size={18} /> : <Search size={18} />}
        </button>
      </div>

      {painelPeriodo && (
        <div className="bg-base-800 border border-base-600 rounded-xl p-3 mb-3">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const alvo = presetParaPeriodo(p.valor);
              const ativo = JSON.stringify(alvo) === JSON.stringify(periodo);
              return (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => escolherPeriodo(alvo)}
                  className={`text-xs rounded-lg px-2 py-2 border transition ${
                    ativo ? "bg-financa/20 border-financa text-financa" : "border-base-600 text-ink-400 hover:text-ink-100"
                  }`}
                >
                  {p.rotulo}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-ink-400 mt-3 mb-1.5">Escolher datas</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-ink-400 min-w-0">
              De
              <input
                type="date"
                value={deRascunho}
                onChange={(e) => setDeRascunho(e.target.value)}
                className="mt-0.5 w-full min-w-0 bg-base-900 border border-base-600 rounded-lg px-2 py-2 text-sm text-ink-100 outline-none focus:border-ink-100"
              />
            </label>
            <label className="text-xs text-ink-400 min-w-0">
              Até
              <input
                type="date"
                value={ateRascunho}
                onChange={(e) => setAteRascunho(e.target.value)}
                className="mt-0.5 w-full min-w-0 bg-base-900 border border-base-600 rounded-lg px-2 py-2 text-sm text-ink-100 outline-none focus:border-ink-100"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!deRascunho || !ateRascunho}
            onClick={() =>
              escolherPeriodo({
                tipo: "intervalo",
                de: deRascunho <= ateRascunho ? deRascunho : ateRascunho,
                ate: deRascunho <= ateRascunho ? ateRascunho : deRascunho,
              })
            }
            className="mt-2 w-full bg-financa text-base-900 text-sm font-medium rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            Ver esse período
          </button>
        </div>
      )}

      {buscaAberta && (
      <div className="flex gap-2 mb-3 animate-surgir">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar (ex: mercado, luz, 150)"
            autoFocus
            className="w-full bg-base-800 border border-base-600 rounded-xl pl-9 pr-8 py-3 text-base text-ink-100 outline-none focus:border-ink-100"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-100 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      )}

      <div className="flex gap-2 mb-2">
        {(["todos", "receita", "despesa"] as const).map((opcao) => (
          <button
            key={opcao}
            onClick={() => setTipo(opcao)}
            className={`flex-1 min-w-0 text-base rounded-full px-2 py-2 border transition ${
              tipo === opcao ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {opcao === "todos" ? "Todos" : opcao === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
        {contas.length > 1 && (
          <select
            value={contaFiltro ?? ""}
            onChange={(e) => setContaFiltro(e.target.value || null)}
            aria-label="Filtrar por conta"
            className="w-28 shrink-0 bg-base-800 border border-base-600 rounded-full px-2 text-sm text-ink-100 outline-none"
          >
            <option value="">Todas as contas</option>
            {contas.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}
      </div>
      </div>

      {(categoriaFiltro || contaFiltro || etiquetaFiltro) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categoriaFiltro && (
            <ChipFiltro
              aoLimpar={() => setCategoriaFiltro(null)}
              icone={
                categoriaInfo ? (
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${classeFundoSuave(categoriaInfo.cor ?? "financa")}`}>
                    <IconeCategoria icone={categoriaInfo.icone} />
                  </span>
                ) : null
              }
            >
              {categoriaFiltro === "sem" ? "Sem categoria" : categoriaInfo?.nome ?? "Categoria"}
            </ChipFiltro>
          )}
          {contaFiltro && (
            <ChipFiltro aoLimpar={() => setContaFiltro(null)}>{String(mapaContas.get(contaFiltro) ?? "Conta")}</ChipFiltro>
          )}
          {etiquetaFiltro && <ChipFiltro aoLimpar={() => setEtiquetaFiltro(null)}>#{etiquetaFiltro}</ChipFiltro>}
        </div>
      )}

      {/* Etapa 174 — alternador Transações/Categorias, inspirado no
         Despezzas (que mostra os gastos agrupados por categoria, com
         barra pra quem tem limite, como uma visão alternativa à
         lista crua de lançamentos). */}
      <div className="inline-flex bg-base-800 border border-base-600 rounded-full p-1 mb-6">
        <button
          onClick={() => setVisualizacao("transacoes")}
          className={`px-5 py-2 rounded-full text-base transition ${
            visualizacao === "transacoes" ? "bg-financa text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          Transações
        </button>
        <button
          onClick={() => setVisualizacao("categorias")}
          className={`px-5 py-2 rounded-full text-base transition ${
            visualizacao === "categorias" ? "bg-financa text-base-900 font-medium" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          Categorias
        </button>
      </div>

      {visualizacao === "categorias" ? (
        <VisaoPorCategoria
          lista={lista}
          mapaCategorias={mapaCategorias}
          aoEscolher={(id) => {
            setCategoriaFiltro(id);
            setVisualizacao("transacoes");
          }}
        />
      ) : snapshot === undefined ? (
        <Esqueleto linhas={4} comTopo={false} />
      ) : lista.length === 0 ? (
        <EstadoVazio
          emoji="🧾"
          titulo={busca || categoriaFiltro || contaFiltro || etiquetaFiltro ? "Nada com esse filtro" : "Nenhum lançamento nesse período"}
          texto={busca || categoriaFiltro || contaFiltro || etiquetaFiltro ? "Tente limpar a busca ou os filtros." : "Use o + lá embaixo pra lançar um gasto ou receita."}
        />
      ) : (
        // Etapa 225 — agrupado por dia, linhas maiores e receita/despesa bem marcadas
        <ListaLancamentosPorDia
          lista={lista as any[]}
          mapaCategorias={mapaCategorias as Map<string, any>}
          mapaContas={mapaContas as Map<string, any>}
          recarregar={recarregar}
          aoEscolherEtiqueta={setEtiquetaFiltro}
        />
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
type ItemCategoria = { id: string; nome: string; icone: string | null; cor: string; valor: number; meta: number | null };

function VisaoPorCategoria({
  lista,
  mapaCategorias,
  aoEscolher,
}: {
  lista: any[];
  mapaCategorias: Map<string, any>;
  aoEscolher: (categoriaId: string) => void;
}) {
  const porCategoria = new Map<string, ItemCategoria>();
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
      id: t.categoria_id,
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

  function Linha({ item }: { item: ItemCategoria }) {
    const percentual = item.meta ? Math.min(100, Math.round((item.valor / item.meta) * 100)) : null;
    return (
      <button
        type="button"
        onClick={() => aoEscolher(item.id)}
        className="block w-full text-left py-3 border-b border-base-600 last:border-0 hover:opacity-80 transition"
      >
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
            <p className="text-xs text-ink-400 mt-1">de {formatarMoeda(item.meta!)}</p>
          </div>
        )}
      </button>
    );
  }

  return (
    <div>
      {despesasPorCategoria.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 px-4 mb-4">
          <p className="text-sm text-ink-400 pt-4 pb-1">Saídas por categoria</p>
          {despesasPorCategoria.map((item) => (
            <Linha key={item.id} item={item} />
          ))}
          {semCategoria.valor > 0 && (
            <button type="button" onClick={() => aoEscolher("sem")} className="block w-full text-left py-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-base-700 flex items-center justify-center text-sm shrink-0 text-ink-400">?</span>
                <p className="text-sm flex-1 text-ink-400">Sem categoria</p>
                <span className="font-mono text-sm text-ink-400">
                  <ValorMonetario valor={semCategoria.valor} />
                </span>
              </div>
            </button>
          )}
        </div>
      )}
      {receitasPorCategoria.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 px-4">
          <p className="text-sm text-ink-400 pt-4 pb-1">Entradas por categoria</p>
          {receitasPorCategoria.map((item) => (
            <Linha key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChipFiltro({ children, icone, aoLimpar }: { children: React.ReactNode; icone?: React.ReactNode; aoLimpar: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-financa/15 border border-financa/40 text-financa rounded-full pl-2 pr-1 py-1">
      {icone}
      <span className="text-ink-100">{children}</span>
      <button
        type="button"
        onClick={aoLimpar}
        aria-label="Tirar filtro"
        className="w-5 h-5 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}
