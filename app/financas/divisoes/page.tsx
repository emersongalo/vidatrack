import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { marcarDivisaoComoPaga, excluirDivisao } from "./actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { Check, Trash2, Plus } from "lucide-react";

export default async function DivisoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: devemPraMim }, { data: euDevo }] = await Promise.all([
    supabase
      .from("divisoes_despesa")
      .select("id, participante_email, valor, pago, financa_transacoes(descricao, data)")
      .eq("dono_id", user!.id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("divisoes_despesa")
      .select("id, valor, pago, dono_id, financa_transacoes(descricao, data)")
      .eq("participante_id", user!.id)
      .order("criado_em", { ascending: false }),
  ]);

  const totalDevemPraMim = (devemPraMim ?? []).filter((d) => !d.pago).reduce((s, d) => s + Number(d.valor), 0);
  const totalEuDevo = (euDevo ?? []).filter((d) => !d.pago).reduce((s, d) => s + Number(d.valor), 0);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Divisões</h1>
        <Link
          href="/financas/dividir"
          className="flex items-center gap-1.5 bg-financa text-base-900 text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition"
        >
          <Plus size={16} strokeWidth={2.5} /> Dividir
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-xs text-ink-400 mb-1">Devem pra você</p>
          <p className="text-xl font-mono font-semibold text-habito">{formatarMoeda(totalDevemPraMim)}</p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-xs text-ink-400 mb-1">Você deve</p>
          <p className="text-xl font-mono font-semibold text-red-400">{formatarMoeda(totalEuDevo)}</p>
        </div>
      </div>

      <p className="text-sm text-ink-400 mb-3">Devem pra você</p>
      <ul className="space-y-2 mb-8">
        {(devemPraMim ?? []).map((d) => (
          <li
            key={d.id}
            className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3 ${d.pago ? "opacity-50" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{d.participante_email}</p>
              <p className="text-xs text-ink-400 truncate">
                {(d as any).financa_transacoes?.descricao || "Despesa"} ·{" "}
                {(d as any).financa_transacoes?.data
                  ? new Date((d as any).financa_transacoes.data + "T00:00:00").toLocaleDateString("pt-BR")
                  : ""}
              </p>
            </div>
            <span className="font-mono text-sm shrink-0">{formatarMoeda(d.valor)}</span>
            {!d.pago && (
              <form action={marcarDivisaoComoPaga.bind(null, d.id)}>
                <button type="submit" aria-label="Marcar como pago" className="text-ink-400 hover:text-habito transition">
                  <Check size={16} strokeWidth={2.5} />
                </button>
              </form>
            )}
            <BotaoComConfirmacao
              acao={excluirDivisao.bind(null, d.id)}
              textoBotao={<Trash2 size={14} strokeWidth={2} />}
              textoConfirmacao="Excluir essa divisão?"
              classeBotao="text-ink-400 hover:text-red-400 transition"
            />
          </li>
        ))}
        {(!devemPraMim || devemPraMim.length === 0) && (
          <p className="text-sm text-ink-400">Ninguém te deve nada por enquanto.</p>
        )}
      </ul>

      <p className="text-sm text-ink-400 mb-3">Você deve</p>
      <ul className="space-y-2">
        {(euDevo ?? []).map((d) => (
          <li
            key={d.id}
            className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3 ${d.pago ? "opacity-50" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {(d as any).financa_transacoes?.descricao || "Despesa"} ·{" "}
                {(d as any).financa_transacoes?.data
                  ? new Date((d as any).financa_transacoes.data + "T00:00:00").toLocaleDateString("pt-BR")
                  : ""}
              </p>
              <p className="text-xs text-ink-400">{d.pago ? "Já pago" : "Pendente"}</p>
            </div>
            <span className="font-mono text-sm shrink-0">{formatarMoeda(d.valor)}</span>
          </li>
        ))}
        {(!euDevo || euDevo.length === 0) && <p className="text-sm text-ink-400">Você não deve nada por enquanto.</p>}
      </ul>
    </main>
  );
}
