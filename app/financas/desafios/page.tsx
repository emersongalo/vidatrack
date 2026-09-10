import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarDesafio } from "./actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { formatarMoeda } from "@/lib/financas/formatacao";

export default async function DesafiosPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const [{ data: desafios }, { data: contas }] = await Promise.all([
    supabase
      .from("desafios_financeiros")
      .select("id, nome, quantidade_quadrados, valor_alvo, valor_guardado, concluido")
      .eq("arquivado", false)
      .order("criado_em", { ascending: false }),
    supabase.from("financa_contas").select("id, nome").eq("arquivado", false).neq("tipo", "investimento"),
  ]);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas/mais" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Desafios financeiros</h1>
      <p className="text-ink-400 text-sm mb-6">
        Tipo aquele desafio de guardar valores crescentes — só que aqui o app monta os quadradinhos e já
        tira o dinheiro certinho do seu saldo quando você marca.
      </p>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {desafios && desafios.length > 0 && (
        <ul className="space-y-2 mb-8 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {desafios.map((d) => {
            const percentual = Math.min(100, Math.round((Number(d.valor_guardado) / Number(d.valor_alvo)) * 100));
            return (
              <li key={d.id}>
                <Link
                  href={`/financas/desafios/${d.id}`}
                  className="block bg-base-800 border border-base-600 rounded-xl2 p-4 hover:border-financa transition"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-medium">{d.nome}</span>
                    {d.concluido && <span className="text-xs text-habito font-medium">Concluído 🎉</span>}
                  </div>
                  <div className="h-2 bg-base-600 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${d.concluido ? "bg-habito" : "bg-financa"}`}
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-ink-400">
                    {formatarMoeda(d.valor_guardado)} / {formatarMoeda(d.valor_alvo)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!contas || contas.length === 0 ? (
        <p className="text-sm text-ink-400">Crie uma conta (não-investimento) antes de montar um desafio.</p>
      ) : (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-sm text-ink-400 mb-3">Novo desafio</p>
          <form action={criarDesafio} className="space-y-3">
            <input
              name="nome"
              type="text"
              placeholder="Nome (ex: Desafio 52 semanas)"
              required
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-400 mb-1.5">Quantos quadrados</label>
                <input
                  name="quantidadeQuadrados"
                  type="number"
                  min={2}
                  max={365}
                  defaultValue={52}
                  required
                  className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-400 mb-1.5">Tipo</label>
                <select
                  name="tipoProgressao"
                  className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
                >
                  <option value="crescente">Crescente (1º R$X, 2º R$2X...)</option>
                  <option value="fixo">Fixo (mesmo valor sempre)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1.5">
                Valor base (o valor do 1º quadrado, ou de todos se for fixo)
              </label>
              <CampoValorMonetario
                name="valorBase"
                placeholder="0,00"
                required
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1.5">De qual conta sai o dinheiro</label>
              <select
                name="contaOrigemId"
                required
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <BotaoSalvarFormulario>Criar desafio</BotaoSalvarFormulario>
          </form>
        </div>
      )}
    </main>
  );
}
