"use client";

// Etapa 317 — "Entradas e saídas" no Início: o que vai entrar e sair de
// dinheiro (vencido sem confirmar, agendado, conta fixa e fatura), quanto
// fica de saldo se tudo acontecer, e "Paguei"/"Recebi" com um toque.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { avisarConfirmacaoMovimentacao } from "@/app/financas/avisos";
import { ateDoPeriodo, fluxoFinanceiro, somarDias, type ItemFluxo, type PeriodoFluxo } from "@/lib/painel/fluxo";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { comDesfazer } from "@/lib/app/desfazer";
import { vibrar } from "@/lib/app/vibrar";
import { gravar } from "@/lib/local/gravar"; // Etapa 353 — sem internet: guarda e sobe depois

const CHAVE_PERIODO = "vt-fluxo-periodo";
const PERIODOS: { id: PeriodoFluxo; nome: string }[] = [
  { id: "7d", nome: "7 dias" },
  { id: "mes", nome: "Este mês" },
  { id: "30d", nome: "30 dias" },
];
const ROTULO_ORIGEM: Record<ItemFluxo["origem"], string> = { pendente: "", agendado: "agendado", fixa: "conta fixa", fatura: "fatura" };
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function rotuloDia(d: string, hoje: string) {
  if (d < hoje) return "Venceu";
  if (d === hoje) return "Hoje";
  if (d === somarDias(hoje, 1)) return "Amanhã";
  const w = new Date(d + "T12:00:00Z").getUTCDay();
  return `${SEMANA[w]}, ${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

/** carimbo "✓ PAGO" (mesmo do Finanças) */
function carimbar(el: HTMLElement | null, texto: string) {
  if (!el || typeof document === "undefined") return;
  const r = el.getBoundingClientRect();
  const c = document.createElement("div");
  c.className = "carimbo";
  c.textContent = texto;
  c.style.left = `${Math.min(window.innerWidth - 70, Math.max(70, r.left + r.width / 2))}px`;
  c.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 1400);
}

export function FluxoFinanceiro({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const ocultos = useValoresOcultos();
  const [periodo, setPeriodo] = useState<PeriodoFluxo>("mes");
  const [filtro, setFiltro] = useState<"tudo" | "receita" | "despesa">("tudo");
  const [todos, setTodos] = useState(false);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(CHAVE_PERIODO) as PeriodoFluxo | null;
      if (p && PERIODOS.some((x) => x.id === p)) setPeriodo(p);
    } catch {}
  }, []);
  function mudarPeriodo(p: PeriodoFluxo) {
    setPeriodo(p);
    setTodos(false);
    try {
      localStorage.setItem(CHAVE_PERIODO, p);
    } catch {}
  }

  const fluxo = useMemo(() => (snapshot ? fluxoFinanceiro(snapshot, hoje, ateDoPeriodo(periodo, hoje)) : null), [snapshot, hoje, periodo]);
  if (!snapshot || !fluxo) return null;
  if (!((snapshot.financas?.contas ?? []) as any[]).length) return null;

  const dinheiro = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));
  const visiveis = fluxo.itens.filter((i) => !feitos.has(i.chave));
  // o que já confirmei agora sai da conta do "a entrar/a sair"
  const somar = (t: "receita" | "despesa") => visiveis.filter((i) => i.tipo === t).reduce((s, i) => s + i.valor, 0);
  const aEntrar = somar("receita");
  const aSair = somar("despesa");
  const depois = fluxo.saldoHoje + aEntrar - aSair;
  const total = aEntrar + aSair || 1;
  const lista = visiveis.filter((i) => filtro === "tudo" || i.tipo === filtro);
  const mostrados = todos ? lista : lista.slice(0, 6);
  const atrasados = visiveis.filter((i) => i.atrasado).length;

  async function confirmar(item: ItemFluxo, el: HTMLElement | null) {
    if (!item.transacaoId) return;
    setErro(null);
    // Etapa 353 — sem internet também: fica no aparelho e sobe depois
    const receita = item.tipo === "receita";
    carimbar(el, receita ? "✓ RECEBIDO" : "✓ PAGO");
    vibrar([15, 40, 25]);
    setFeitos((s) => new Set(s).add(item.chave));
    const id = item.transacaoId;
    const { error } = await gravar({ tabela: "financa_transacoes", op: "update", id: id, valores: { pago_em: hoje } });
    if (error) {
      setFeitos((s) => {
        const n = new Set(s);
        n.delete(item.chave);
        return n;
      });
      setErro("Não deu pra salvar agora.");
      return;
    }
    void avisarConfirmacaoMovimentacao(id).catch(() => {});
    comDesfazer({
      texto: `${item.descricao}: ${receita ? "recebido" : "pago"} ✓`,
      desfazer: async () => {
        await gravar({ tabela: "financa_transacoes", op: "update", id: id, valores: { pago_em: null } });
        setFeitos((s) => {
          const n = new Set(s);
          n.delete(item.chave);
          return n;
        });
      },
      aoTerminar: () => void atualizarSnapshotEmTodasAsTelas(),
    });
  }

  // agrupa por dia (os vencidos todos juntos no topo)
  const grupos: { rotulo: string; itens: ItemFluxo[] }[] = [];
  for (const i of mostrados) {
    const r = rotuloDia(i.data, hoje);
    const g = grupos[grupos.length - 1];
    if (g && g.rotulo === r) g.itens.push(i);
    else grupos.push({ rotulo: r, itens: [i] });
  }

  return (
    <section className="rounded-3xl border border-base-600 overflow-hidden bg-base-800">
      {/* topo */}
      <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(160deg, rgb(var(--c-financa) / .16), transparent 70%)" }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-xl font-semibold">💸 Entradas e saídas</h2>
          <Link href="/financas/calendario" className="text-sm text-ink-400 hover:text-ink-100 flex items-center shrink-0">
            Calendário <ChevronRight size={15} />
          </Link>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-base-900/60 mb-4">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => mudarPeriodo(p.id)}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${periodo === p.id ? "bg-ink-100 text-base-900" : "text-ink-400"}`}
            >
              {p.nome}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFiltro(filtro === "receita" ? "tudo" : "receita")}
            className={`text-left rounded-2xl border px-3 py-3 transition ${filtro === "receita" ? "border-habito bg-habito/15" : "border-habito/25 bg-habito/5"}`}
          >
            <span className="flex items-center gap-1 text-xs text-habito font-semibold">
              <ArrowUpRight size={14} strokeWidth={2.6} /> A entrar
            </span>
            <span className="block font-mono text-lg font-bold mt-1 text-habito">{dinheiro(aEntrar)}</span>
            <span className="block text-[11px] text-ink-400">{visiveis.filter((i) => i.tipo === "receita").length} lançamentos</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltro(filtro === "despesa" ? "tudo" : "despesa")}
            className={`text-left rounded-2xl border px-3 py-3 transition ${filtro === "despesa" ? "border-red-400 bg-red-400/15" : "border-red-400/25 bg-red-400/5"}`}
          >
            <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
              <ArrowDownRight size={14} strokeWidth={2.6} /> A sair
            </span>
            <span className="block font-mono text-lg font-bold mt-1 text-red-400">{dinheiro(aSair)}</span>
            <span className="block text-[11px] text-ink-400">
              {visiveis.filter((i) => i.tipo === "despesa").length} lançamentos{atrasados ? ` · ${atrasados} vencido${atrasados > 1 ? "s" : ""}` : ""}
            </span>
          </button>
        </div>

        {/* barra entra x sai */}
        <div className="flex h-2 rounded-full overflow-hidden bg-base-700 mt-3">
          <div className="bg-habito transition-all duration-700" style={{ width: `${(aEntrar / total) * 100}%` }} />
          <div className="bg-red-400 transition-all duration-700" style={{ width: `${(aSair / total) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm mt-3">
          <span className="text-ink-400">
            Saldo hoje <span className="font-mono text-ink-100">{dinheiro(fluxo.saldoHoje)}</span>
          </span>
          <span className="text-ink-400">
            depois{" "}
            <span className={`font-mono font-bold ${depois < 0 ? "text-red-400" : "text-habito"}`}>{dinheiro(depois)}</span>
          </span>
        </div>
      </div>

      {/* lista */}
      <div className="px-3 pb-3">
        {erro && <p className="text-sm text-red-400 px-2 pt-2">{erro}</p>}
        {lista.length === 0 ? (
          <p className="text-base text-ink-400 px-2 py-5 text-center">
            {filtro === "tudo" ? "Nada pra entrar ou sair nesse período 🌿" : filtro === "receita" ? "Nada pra entrar nesse período" : "Nada pra pagar nesse período 🎉"}
          </p>
        ) : (
          grupos.map((g) => (
            <div key={g.rotulo} className="mt-2">
              <p className={`text-[11px] uppercase tracking-wide px-2 mb-1 ${g.rotulo === "Venceu" ? "text-red-400 font-semibold" : "text-ink-400"}`}>{g.rotulo}</p>
              <ul className="space-y-1.5">
                {g.itens.map((i) => (
                  <LinhaFluxo key={i.chave} item={i} dinheiro={dinheiro} hoje={hoje} aoConfirmar={confirmar} />
                ))}
              </ul>
            </div>
          ))
        )}
        {lista.length > 6 && (
          <button type="button" onClick={() => setTodos(!todos)} className="w-full text-center text-sm text-ink-400 hover:text-ink-100 mt-3 py-1">
            {todos ? "Mostrar menos" : `Ver todos (${lista.length})`}
          </button>
        )}
      </div>
    </section>
  );
}

function LinhaFluxo({
  item,
  dinheiro,
  hoje,
  aoConfirmar,
}: {
  item: ItemFluxo;
  dinheiro: (v: number) => string;
  hoje: string;
  aoConfirmar: (i: ItemFluxo, el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const receita = item.tipo === "receita";
  const origem = ROTULO_ORIGEM[item.origem];
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 ${item.atrasado ? "bg-red-400/10" : "bg-base-900/40"}`}>
      <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${receita ? "bg-habito/15 text-habito" : "bg-red-400/15 text-red-400"}`}>
          {receita ? <ArrowUpRight size={18} strokeWidth={2.4} /> : <ArrowDownRight size={18} strokeWidth={2.4} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">{item.descricao}</span>
          <span className="block text-[11px] text-ink-400 truncate">
            {item.data < hoje ? `venceu ${item.data.slice(8, 10)}/${item.data.slice(5, 7)}` : item.data === hoje ? "hoje" : ""}
            {item.conta ? `${item.data <= hoje ? " · " : ""}${item.conta}` : ""}
            {origem ? `${item.conta || item.data <= hoje ? " · " : ""}${origem}` : ""}
          </span>
        </span>
        <span className={`font-mono text-sm font-semibold shrink-0 ${receita ? "text-habito" : "text-red-400"}`}>
          {receita ? "+" : "−"}
          {dinheiro(item.valor)}
        </span>
      </Link>
      {item.transacaoId ? (
        <button
          ref={ref}
          type="button"
          onClick={() => aoConfirmar(item, ref.current)}
          className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
            receita ? "bg-habito text-base-900" : "bg-red-400 text-base-900"
          }`}
        >
          <Check size={13} strokeWidth={3} /> {receita ? "Recebi" : "Paguei"}
        </button>
      ) : (
        <Link href={item.href} className="shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-base-600 text-ink-300">
          {item.origem === "fatura" ? "Pagar" : "Ver"}
        </Link>
      )}
    </li>
  );
}
