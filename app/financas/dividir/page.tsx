import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarDivisao } from "../divisoes/actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { formatarMoeda } from "@/lib/financas/formatacao";

export default async function DividirDespesaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: transacoes } = await supabase
    .from("financa_transacoes")
    .select("id, descricao, valor, data, financa_contas(nome)")
    .eq("tipo", "despesa")
    .order("data", { ascending: false })
    .limit(30);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-xl mx-auto">
      <Link href="/financas/divisoes" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Divisões
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Dividir despesa</h1>
      <p className="text-ink-400 text-sm mb-6">
        Escolhe um lançamento já existente e quanto a outra pessoa deve te pagar dessa despesa.
      </p>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {!transacoes || transacoes.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhuma despesa lançada ainda pra dividir.</p>
      ) : (
        <form action={criarDivisao} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Qual despesa</label>
            <select
              name="transacaoId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {transacoes.map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                  {t.descricao || (t as any).financa_contas?.nome || "Sem descrição"} · {formatarMoeda(t.valor)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">E-mail de quem participa</label>
            <input
              name="participanteEmail"
              type="email"
              required
              placeholder="pessoa@exemplo.com"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Quanto essa pessoa deve pagar</label>
            <CampoValorMonetario
              name="valor"
              required
              placeholder="0,00"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
            />
          </div>

          <BotaoSalvarFormulario>Registrar divisão</BotaoSalvarFormulario>
        </form>
      )}
    </main>
  );
}
