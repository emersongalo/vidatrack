"use client";

// Etapa 247 — lançamento em 2 toques: os gastos que você mais repete
// viram botões prontos (valor, categoria e conta já preenchidos).
// 1º toque escolhe, 2º toque lança. Dá pra ajustar o valor antes.
// Etapa 251 — o valor vem em branco: a pessoa digita quanto foi.
import { useMemo, useState } from "react";
import { Check, Zap, X } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { criarTransacaoSilenciosa } from "@/app/financas/actions";
import { adicionarNaFila } from "@/lib/offline/fila";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { gastosRapidos, valorParaFormulario } from "@/lib/financas/hoje";
import { vibrar } from "@/lib/app/vibrar";
import { hexDaCor } from "@/lib/agenda/estilo";

export function GastosRapidos({ snapshot, hojeISO, noInicio = false }: { snapshot: any; hojeISO: string; noInicio?: boolean }) {
  const contas = (snapshot?.financas?.contas ?? []) as any[];
  const transacoes = (snapshot?.financas?.transacoes ?? []) as any[];
  const categorias = (snapshot?.financas?.categorias ?? []) as any[];
  const lista = useMemo(() => gastosRapidos(contas, transacoes, hojeISO), [contas, transacoes, hojeISO]);
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feito, setFeito] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!lista.length) return null;

  const nomeConta = (id: string | null) => contas.find((c) => c.id === id)?.nome ?? "";
  const categoria = (id: string | null) => categorias.find((c) => c.id === id);
  const atual = escolhido !== null ? lista[escolhido] : null;

  function escolher(i: number) {
    vibrar(10);
    setErro(null);
    setFeito(null);
    if (escolhido === i) return setEscolhido(null);
    setEscolhido(i);
    setValor("");
  }

  async function lancar() {
    if (!atual || salvando) return;
    const n = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!(n > 0)) return setErro("Digite um valor");
    setSalvando(true);
    setErro(null);
    const dados = {
      tipo: "despesa" as const,
      valor: valorParaFormulario(n),
      contaId: atual.contaId!,
      categoriaId: atual.categoriaId ?? "",
      descricao: atual.descricao,
      data: hojeISO,
    };
    try {
      if (!navigator.onLine) {
        adicionarNaFila({ id: crypto.randomUUID(), tipo: "criar_transacao", dados });
      } else {
        const r = await criarTransacaoSilenciosa(dados);
        if (!r.sucesso) throw new Error(r.erro);
      }
      vibrar([15, 40, 25]);
      setFeito(`${atual.descricao} · ${formatarMoeda(n)} lançado${navigator.onLine ? "" : " (vai sincronizar)"}`);
      setEscolhido(null);
      atualizarSnapshotEmTodasAsTelas();
      setTimeout(() => setFeito(null), 3500);
    } catch {
      setErro("Não salvou — tente de novo");
    }
    setSalvando(false);
  }

  return (
    <section className={`bg-base-800 border border-base-600 rounded-3xl p-4 ${noInicio ? "" : "mb-6 lg:break-inside-avoid"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-financa" />
        <h2 className="text-base font-semibold">Lançar rápido</h2>
        <span className="text-xs text-ink-400 ml-auto">toque e digite o valor</span>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 snap-x">
        {lista.map((g, i) => {
          const cat = categoria(g.categoriaId);
          const ativo = escolhido === i;
          return (
            <button
              key={g.descricao}
              type="button"
              onClick={() => escolher(i)}
              className={`snap-start shrink-0 flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition active:scale-95 ${
                ativo ? "border-financa bg-financa/15" : "border-base-600 bg-base-900/60"
              }`}
            >
              <span className="w-8 h-8 rounded-xl bg-base-800 flex items-center justify-center shrink-0" style={{ color: hexDaCor(cat?.cor ?? "financa") }}>
                <IconeCategoria icone={cat?.icone} tamanho={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium max-w-[9rem] truncate">{g.descricao}</span>
              </span>
            </button>
          );
        })}
      </div>

      {atual && (
        <div className="animate-surgir mt-3 bg-base-900/60 border border-base-600 rounded-2xl p-3">
          <p className="text-sm">
            <span className="font-medium">{atual.descricao}</span>
            <span className="text-ink-400"> · hoje · {nomeConta(atual.contaId)}</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-ink-400 text-sm">R$</span>
            <input
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, ""))}
              placeholder="0,00"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && lancar()}
              className="flex-1 min-w-0 bg-base-800 border border-base-600 rounded-xl px-3 py-2.5 font-mono text-lg outline-none focus:border-financa"
              aria-label="Valor"
            />
            <button
              type="button"
              onClick={() => setEscolhido(null)}
              aria-label="Cancelar"
              className="w-11 h-11 rounded-xl border border-base-600 flex items-center justify-center text-ink-400"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={lancar}
              disabled={salvando}
              className="h-11 px-4 rounded-xl bg-financa text-base-900 font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={18} /> {salvando ? "..." : "Lançar"}
            </button>
          </div>
        </div>
      )}

      {feito && <p className="animate-surgir text-sm text-habito mt-3">✓ {feito}</p>}
      {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}
    </section>
  );
}
