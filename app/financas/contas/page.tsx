import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarConta, arquivarConta } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { SeloBanco } from "@/components/SeloBanco";
import { BANCOS } from "@/lib/financas/bancos";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
};

export default async function ContasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome, tipo, banco, saldo_inicial")
    .eq("arquivado", false)
    .order("criado_em", { ascending: true });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Contas</h1>
        <Link href="/financas/contas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
          Lixeira
        </Link>
      </div>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {contas && contas.length > 0 && (
        <ul className="space-y-2 mb-8">
          {contas.map((conta) => (
            <li
              key={conta.id}
              className="flex items-center justify-between bg-base-800 border border-base-600 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <SeloBanco bancoId={conta.banco} />
                <div>
                  <p className="text-sm font-medium">{conta.nome}</p>
                  <p className="text-xs text-ink-400">
                    {RÓTULOS_TIPO[conta.tipo]} · saldo inicial {formatarMoeda(Number(conta.saldo_inicial))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/financas/contas/${conta.id}/compartilhar`}
                  className="text-ink-400 hover:text-ink-100 transition text-xs"
                >
                  Compartilhar
                </Link>
                <BotaoComConfirmacao acao={arquivarConta.bind(null, conta.id)} textoBotao="Arquivar" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-400 mb-3">Nova conta</p>
      <form action={criarConta} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Ex: Carteira, Nubank, Cartão Inter"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <select
          name="tipo"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        >
          <option value="banco">Banco</option>
          <option value="carteira">Carteira</option>
          <option value="cartao">Cartão</option>
        </select>
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Banco (pra mostrar o selo certo)</label>
          <select
            name="banco"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {BANCOS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <input
          name="saldoInicial"
          type="text"
          inputMode="decimal"
          placeholder="Saldo inicial (opcional, ex: 150,00)"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
        />
        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Criar conta
        </button>
      </form>
    </main>
  );
}
