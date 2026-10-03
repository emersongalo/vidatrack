"use client";

// Etapa 242 — "Pagar fatura" sem confusão de De/Para: a pessoa só escolhe
// DE QUAL CONTA sai o dinheiro. Por baixo é uma transferência da conta pro
// cartão (sai do saldo do banco e zera a fatura).
import { useState } from "react";
import { criarTransferencia } from "@/app/financas/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { SeloBanco } from "@/components/SeloBanco";
import { ValorMonetario } from "@/components/ValorMonetario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { formatarMoeda } from "@/lib/financas/formatacao";

export function PagarFatura({
  cartao,
  contas,
  aPagar,
  vencimento,
}: {
  cartao: { id: string; nome: string };
  contas: any[];
  aPagar: number;
  vencimento: string | null;
}) {
  const hoje = new Date().toLocaleDateString("sv-SE");
  const opcoes = contas.filter((c) => c.tipo !== "cartao" && c.tipo !== "investimento");
  const [aberto, setAberto] = useState(false);
  const [contaId, setContaId] = useState<string>(opcoes[0]?.id ?? "");
  const [valor, setValor] = useState(aPagar.toFixed(2).replace(".", ","));
  const [data, setData] = useState(hoje);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState(false);

  const antecipado = !!vencimento && data < vencimento;

  async function pagar() {
    setErro(null);
    if (!contaId) return setErro("Escolha de qual conta sai o dinheiro");
    setSalvando(true);
    const f = new FormData();
    f.set("contaOrigemId", contaId);
    f.set("contaDestinoId", cartao.id);
    f.set("valor", valor);
    f.set("data", data);
    f.set("descricao", `Pagamento fatura ${cartao.nome}`);
    const r = await criarTransferencia(f);
    setSalvando(false);
    if (r?.erro) return setErro(r.erro);
    setFeito(true);
    await atualizarSnapshotEmTodasAsTelas();
    setTimeout(() => setAberto(false), 1200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeito(false);
          setValor(aPagar.toFixed(2).replace(".", ","));
          setAberto(true);
        }}
        className="mt-4 block w-full text-center bg-financa text-base-900 font-semibold rounded-2xl py-3.5 hover:opacity-90 transition"
      >
        {aPagar > 0 ? <>Pagar <ValorMonetario valor={aPagar} /></> : "Pagar / adiantar fatura"}
      </button>

      {aberto && (
        <div className="animate-fundo fixed inset-0 z-[65] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => !salvando && setAberto(false)}>
          <div
            className="animate-folha w-full max-w-md max-h-[90dvh] overflow-y-auto bg-base-800 border border-base-600 rounded-t-3xl sm:rounded-3xl p-5"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {feito ? (
              <div className="text-center py-8">
                <p className="text-5xl mb-2 animate-pop">✅</p>
                <p className="text-xl font-semibold">Fatura paga!</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-display font-bold">Pagar fatura</h2>
                <p className="text-base text-ink-400 mb-4">{cartao.nome}</p>

                <label className="block text-sm text-ink-400 mb-1">Valor</label>
                <div onInput={(e) => setValor((e.target as HTMLInputElement).value)}>
                  <CampoValorMonetario
                    name="valorPagamento"
                    valorInicial={aPagar.toFixed(2)}
                    className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3.5 text-2xl font-mono text-ink-100 outline-none focus:border-ink-100"
                  />
                </div>

                <p className="text-sm text-ink-400 mt-4 mb-2">Sai de qual conta?</p>
                {opcoes.length === 0 ? (
                  <p className="text-sm text-red-400">Cadastre uma conta de banco ou carteira primeiro.</p>
                ) : (
                  <div className="space-y-2">
                    {opcoes.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setContaId(c.id)}
                        className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                          contaId === c.id ? "border-financa bg-financa/10" : "border-base-600"
                        }`}
                      >
                        <SeloBanco bancoId={c.banco} nome={c.nome} tipo={c.tipo} tamanho={36} />
                        <span className="flex-1 min-w-0 text-base font-medium truncate">{c.nome}</span>
                        <span className="font-mono text-sm text-ink-400">
                          <ValorMonetario valor={Number(c.saldo ?? 0)} />
                        </span>
                        <span className={`w-5 h-5 rounded-full border-2 ${contaId === c.id ? "border-financa bg-financa" : "border-base-600"}`} />
                      </button>
                    ))}
                  </div>
                )}

                <label className="block text-sm text-ink-400 mt-4 mb-1">Quando</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3 text-ink-100 outline-none focus:border-ink-100"
                />
                {antecipado && <p className="text-sm text-habito mt-2">💡 Pagamento adiantado — abate da fatura na hora.</p>}

                <p className="text-sm text-ink-400 mt-4 bg-base-900/60 rounded-2xl px-3 py-2.5">
                  O valor sai do saldo da conta escolhida e a fatura do cartão diminui. Não conta como despesa de novo — as
                  compras já foram contadas quando você lançou no cartão.
                </p>

                {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setAberto(false)} className="flex-1 rounded-2xl border border-base-600 py-3.5 text-base">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={pagar}
                    disabled={salvando || !opcoes.length}
                    className="flex-[2] rounded-2xl bg-financa text-base-900 py-3.5 text-base font-semibold disabled:opacity-50"
                  >
                    {salvando ? "Pagando..." : `Pagar ${formatarMoeda(Number(valor.replace(/\./g, "").replace(",", ".")) || 0)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
