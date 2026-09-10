import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completarQuadrado, excluirDesafio } from "../actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DesafioDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: desafio } = await supabase
    .from("desafios_financeiros")
    .select("id, nome, valor_alvo, valor_guardado, concluido, financa_contas(nome)")
    .eq("id", params.id)
    .single();

  if (!desafio) notFound();

  const { data: quadrados } = await supabase
    .from("desafio_quadrados")
    .select("id, numero, valor, completado")
    .eq("desafio_id", params.id)
    .order("numero", { ascending: true });

  const percentual = Math.min(100, Math.round((Number(desafio.valor_guardado) / Number(desafio.valor_alvo)) * 100));
  const quantidadeFeitos = (quadrados ?? []).filter((q) => q.completado).length;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/financas/desafios" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Desafios
        </Link>
        <BotaoComConfirmacao
          acao={excluirDesafio.bind(null, desafio.id)}
          textoBotao={<Trash2 size={14} strokeWidth={2} />}
          textoConfirmacao={`Excluir "${desafio.nome}"? O dinheiro já guardado não volta pra conta sozinho.`}
          classeBotao="text-ink-400 hover:text-red-400 transition"
        />
      </div>

      <h1 className="text-2xl font-display font-semibold mb-1">{desafio.nome}</h1>
      <p className="text-ink-400 text-sm mb-6">
        Saindo de {(desafio as any).financa_contas?.nome ?? "conta removida"} · {quantidadeFeitos} de{" "}
        {quadrados?.length ?? 0} quadrados
      </p>

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-6">
        <p className="text-xs text-ink-400 mb-1">{desafio.concluido ? "Concluído! 🎉" : "Guardado até agora"}</p>
        <p className="text-3xl font-mono font-bold mb-2">{formatarMoeda(desafio.valor_guardado)}</p>
        <div className="h-2 bg-base-600 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${desafio.concluido ? "bg-habito" : "bg-financa"}`}
            style={{ width: `${percentual}%` }}
          />
        </div>
        <p className="text-xs text-ink-400">Meta: {formatarMoeda(desafio.valor_alvo)}</p>
      </div>

      <p className="text-sm text-ink-400 mb-3">Clica num quadrado pra marcar (isso já tira o valor da conta)</p>
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {(quadrados ?? []).map((q) => (
          <form key={q.id} action={completarQuadrado.bind(null, desafio.id, q.id)}>
            <button
              type="submit"
              disabled={q.completado}
              title={formatarMoeda(q.valor)}
              className={`w-full aspect-square rounded-lg text-xs font-mono flex flex-col items-center justify-center gap-0.5 border transition ${
                q.completado
                  ? "bg-habito text-base-900 border-habito"
                  : "border-base-600 text-ink-400 hover:border-financa hover:text-financa"
              }`}
            >
              <span className="font-semibold">{q.numero}</span>
              <span className="text-[9px]">{formatarMoeda(q.valor).replace("R$", "").trim()}</span>
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
