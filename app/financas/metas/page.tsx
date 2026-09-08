import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { criarMeta, adicionarProgressoMeta, arquivarMeta, excluirMetaDefinitivamente } from "./actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { Trash2, Archive } from "lucide-react";

export default async function MetasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: metas } = await supabase
    .from("metas_financeiras")
    .select("id, nome, valor_alvo, valor_atual, data_alvo, concluida")
    .eq("arquivada", false)
    .order("criado_em", { ascending: false });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Metas de economia</h1>
      <p className="text-ink-400 text-sm mb-6">
        Separe um valor pra alcançar, tipo "Viagem" ou "Reserva de emergência", e vá guardando aos poucos.
      </p>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      {metas && metas.length > 0 && (
        <ul className="space-y-3 mb-8 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {metas.map((meta) => {
            const percentual = Math.min(100, Math.round((Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100));
            return (
              <li key={meta.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-medium">{meta.nome}</span>
                  {meta.concluida && <span className="text-xs text-habito font-medium">Concluída 🎉</span>}
                </div>
                <div className="h-2 bg-base-600 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full ${meta.concluida ? "bg-habito" : "bg-financa"}`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between text-sm mb-3">
                  <span className="font-mono">
                    {formatarMoeda(Number(meta.valor_atual))} / {formatarMoeda(Number(meta.valor_alvo))}
                  </span>
                  <span className="text-ink-400 text-xs">{percentual}%</span>
                </div>
                {meta.data_alvo && (
                  <p className="text-xs text-ink-400 mb-3">
                    Meta pra {new Date(meta.data_alvo + "T00:00:00").toLocaleDateString("pt-BR")}
                  </p>
                )}

                {!meta.concluida && (
                  <form action={adicionarProgressoMeta.bind(null, meta.id)} className="flex gap-2 mb-3">
                    <CampoValorMonetario
                      name="valorAdicionar"
                      placeholder="Guardar mais..."
                      className="flex-1 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 font-mono focus:border-ink-100 outline-none transition"
                    />
                    <button
                      type="submit"
                      className="bg-financa text-base-900 text-sm font-medium rounded-lg px-3 hover:opacity-90 transition"
                    >
                      +
                    </button>
                  </form>
                )}

                <div className="flex items-center gap-3">
                  <BotaoComConfirmacao
                    acao={arquivarMeta.bind(null, meta.id)}
                    textoBotao={<Archive size={14} strokeWidth={2} />}
                    textoConfirmacao={`Arquivar "${meta.nome}"?`}
                    classeBotao="text-ink-400 hover:text-ink-100 transition"
                  />
                  <BotaoComConfirmacao
                    acao={excluirMetaDefinitivamente.bind(null, meta.id)}
                    textoBotao={<Trash2 size={14} strokeWidth={2} />}
                    textoConfirmacao={`Excluir "${meta.nome}" de vez?`}
                    classeBotao="text-ink-400 hover:text-red-400 transition"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
        <p className="text-sm text-ink-400 mb-3">Nova meta</p>
        <form action={criarMeta} className="space-y-3">
          <input
            name="nome"
            type="text"
            placeholder="Nome (ex: Viagem, Reserva de emergência)"
            required
            className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
          <CampoValorMonetario
            name="valorAlvo"
            placeholder="Valor alvo (ex: 5.000,00)"
            required
            className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
          />
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Data alvo (opcional)</label>
            <input
              name="dataAlvo"
              type="date"
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
          <BotaoSalvarFormulario>Criar meta</BotaoSalvarFormulario>
        </form>
      </div>
    </main>
  );
}
