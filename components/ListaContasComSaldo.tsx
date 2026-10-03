import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { ValorMonetario } from "@/components/ValorMonetario";
import { SeloBanco } from "@/components/SeloBanco";
import { bancoPorId, siglaDoSelo } from "@/lib/financas/bancos";
import { usoDoLimite } from "@/lib/financas/limite";
import { resumoCartao, textoVencimento } from "@/lib/financas/cartaoResumo";
import type { ContaComSaldo } from "@/lib/financas/consulta";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
  investimento: "Investimento",
};

export function ListaContasComSaldo({ contas, transacoes = [] }: { contas: ContaComSaldo[]; transacoes?: any[] }) {
  const hoje = new Date().toLocaleDateString("sv-SE");
  if (contas.length === 0) return null;

  // Etapa 211 — cartões ficam num bloco próprio (não somam no saldo)
  const contasNormais = contas.filter((c) => c.tipo !== "investimento" && c.tipo !== "cartao");
  const cartoes = contas.filter((c) => c.tipo === "cartao");
  const contasInvestimento = contas.filter((c) => c.tipo === "investimento");
  const totalInvestido = contasInvestimento.reduce((soma, c) => soma + c.saldo, 0);

  return (
    <>
      {/* Etapa 223 — cartão único com linhas maiores, no estilo dos apps de banco */}
      {contasNormais.length > 0 && (
        <div className="mb-6 bg-base-800 border border-base-600 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Contas</h2>
            <Link href="/financas/contas" className="text-base text-ink-400 hover:text-ink-100 transition">
              Ver mais ›
            </Link>
          </div>
          <ul className="divide-y divide-base-600">
            {contasNormais.map((conta) => (
              <li key={conta.id}>
                <Link href="/financas/contas" className="flex items-center gap-4 py-3.5">
                  <SeloBanco bancoId={conta.banco} nome={conta.nome} tipo={conta.tipo} tamanho={48} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium truncate">{conta.nome}</p>
                    <p className="text-sm text-ink-400">{RÓTULOS_TIPO[conta.tipo] ?? conta.tipo}</p>
                  </div>
                  <span className={`font-mono text-lg font-semibold shrink-0 ${conta.saldo < 0 ? "text-red-400" : "text-ink-100"}`}>
                    <ValorMonetario valor={conta.saldo} />
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/financas/contas" className="flex items-center gap-4 pt-3.5 text-base text-ink-100">
                <span className="w-12 h-12 rounded-xl bg-base-700 flex items-center justify-center text-2xl text-ink-400">+</span>
                Adicionar nova conta
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Etapa 230 — cartão de crédito com cara de cartão: cor do banco, fatura e limite */}
      {cartoes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Cartões</h2>
            <Link href="/financas/contas" className="text-base text-ink-400 hover:text-ink-100 transition">
              Ver mais ›
            </Link>
          </div>
          <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-1">
            {cartoes.map((cartao) => {
              const devendo = Math.max(0, -cartao.saldo);
              const banco = bancoPorId(cartao.banco);
              const limite = usoDoLimite(devendo, Number((cartao as any).limite) || null);
              const vence = (cartao as any).dia_vencimento as number | null | undefined;
              // Etapa 237 — valor e vencimento da PRÓXIMA fatura (não o saldo do cartão)
              const r = resumoCartao(cartao as any, transacoes, hoje);
              const aPagar = r.proxima?.valor ?? devendo;
              return (
                <li key={cartao.id} className={`snap-start shrink-0 ${cartoes.length > 1 ? "w-[85%] sm:w-80" : "w-full"}`}>
                  <Link
                    href={`/financas/contas/${cartao.id}/fatura`}
                    className="block rounded-3xl p-5 shadow-lg active:scale-[0.99] transition"
                    style={{
                      background: `linear-gradient(135deg, ${banco.cor} 0%, ${banco.cor}CC 55%, #16161c 140%)`,
                      color: banco.texto,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold truncate">{cartao.nome}</p>
                        <p className="text-sm opacity-80">
                          {r.proxima?.vencimento ? textoVencimento(r.proxima.vencimento, hoje).replace(/^./, (c) => c.toUpperCase()) : vence ? `Vence dia ${vence}` : "Cartão de crédito"}
                        </p>
                      </div>
                      <span className="text-sm font-bold tracking-wider px-2 py-1 rounded-lg bg-black/20">
                        {siglaDoSelo(cartao.banco, cartao.nome, cartao.tipo) || "💳"}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-5">{r.proxima?.fechada ? "Fatura fechada a pagar" : "Fatura atual"}</p>
                    <p className="font-mono text-3xl font-bold">
                      <ValorMonetario valor={aPagar} />
                    </p>
                    {r.configurado && r.devendo > aPagar + 0.01 && (
                      <p className="text-xs opacity-80">Total no cartão: <ValorMonetario valor={r.devendo} /></p>
                    )}
                    {limite ? (
                      <div className="mt-4">
                        <div className="h-2 rounded-full bg-black/25 overflow-hidden">
                          <div className="h-full rounded-full bg-white/90" style={{ width: `${limite.pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mt-1.5 opacity-90">
                          <span>{limite.pct}% do limite</span>
                          <span>
                            Disponível <ValorMonetario valor={limite.disponivel} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs opacity-75 mt-4">Ver fatura ›</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {contasInvestimento.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xl font-semibold flex items-center gap-2">
              <PiggyBank size={20} strokeWidth={2} /> Investido
            </p>
            <Link href="/financas/contas" className="text-xs text-ink-400 hover:text-ink-100 transition">
              Gerenciar →
            </Link>
          </div>
          {/* Fica visualmente separado do resto de propósito — é
              dinheiro que já foi guardado, não conta como "disponível". */}
          <div className="bg-base-800 border border-financa/30 rounded-xl2 p-4 mb-2">
            <p className="text-xs text-ink-400 mb-1">Total guardado</p>
            <p className="text-xl font-mono font-semibold text-financa">
              <ValorMonetario valor={totalInvestido} />
            </p>
          </div>
          <ul className="space-y-2">
            {contasInvestimento.map((conta) => (
              <li key={conta.id}>
                <Link
                  href="/financas/contas"
                  className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4 hover:border-financa transition"
                >
                  <SeloBanco bancoId={conta.banco} nome={conta.nome} tipo={conta.tipo} tamanho={44} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate">{conta.nome}</p>
                    <p className="text-sm text-ink-400">Investimento</p>
                  </div>
                  <span className="font-mono text-sm shrink-0 text-ink-100">
                    <ValorMonetario valor={conta.saldo} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

