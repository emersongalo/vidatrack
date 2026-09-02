import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { atualizarConta } from "@/app/financas/actions";
import { BANCOS } from "@/lib/financas/bancos";

export default async function EditarContaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: conta } = await supabase
    .from("financa_contas")
    .select("id, nome, tipo, banco, saldo_inicial")
    .eq("id", params.id)
    .single();

  if (!conta) notFound();

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/financas/contas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Contas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Editar conta</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <form action={atualizarConta.bind(null, conta.id)} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          defaultValue={conta.nome}
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <select
          name="tipo"
          defaultValue={conta.tipo}
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
            defaultValue={conta.banco ?? "outro"}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {BANCOS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Saldo inicial</label>
          <input
            name="saldoInicial"
            type="text"
            inputMode="decimal"
            defaultValue={String(conta.saldo_inicial).replace(".", ",")}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Salvar alterações
        </button>
      </form>
    </main>
  );
}
