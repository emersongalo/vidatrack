import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { buscarItensDoDia } from "@/lib/agenda/consulta";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { SugestoesHabito } from "@/components/SugestoesHabito";
import { ListaHojeComOffline } from "@/components/ListaHojeComOffline";

export default async function HojePage({
  searchParams,
}: {
  searchParams: { data?: string; categoria?: string };
}) {
  const supabase = createClient();
  const hoje = hojeISO();
  const dataSelecionada = searchParams.data ?? hoje;
  const categoriaFiltro = searchParams.categoria ?? "";

  const { data: categorias } = await supabase
    .from("categorias_produtividade")
    .select("id, nome, cor")
    .order("nome");

  const { itens, temAlgumItemCadastrado } = await buscarItensDoDia(dataSelecionada, categoriaFiltro);

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-12 pt-2">
      <Link href="/dashboard" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Painel
      </Link>
      <div className="flex items-center justify-between mb-4 mt-2">
        <h1 className="text-2xl font-display font-semibold">Hoje</h1>
        <Link
          href={`/habitos/planejador?data=${dataSelecionada}`}
          className="text-sm text-ink-400 hover:text-ink-100 transition"
        >
          🕐 Blocos de tempo
        </Link>
      </div>

      <TiraDeDiasAgenda dataSelecionada={dataSelecionada} hojeISO={hoje} />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mt-4 mb-5 scrollbar-none">
        <Link
          href="/habitos"
          className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
            !categoriaFiltro
              ? "bg-ink-100 text-base-900 border-ink-100"
              : "border-base-600 text-ink-400 hover:text-ink-100"
          }`}
        >
          Tudo
        </Link>
        {(categorias ?? []).map((cat) => (
          <Link
            key={cat.id}
            href={`/habitos?data=${dataSelecionada}&categoria=${cat.id}`}
            className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
              categoriaFiltro === cat.id
                ? "bg-ink-100 text-base-900 border-ink-100"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {cat.nome}
          </Link>
        ))}
        <Link
          href="/habitos/categorias/nova"
          className="shrink-0 text-sm rounded-full px-3.5 py-1.5 border border-dashed border-base-600 text-ink-400 hover:text-ink-100 transition"
        >
          + Nova lista
        </Link>
      </div>

      {itens.length === 0 && !temAlgumItemCadastrado ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Vamos começar?</p>
          <p className="text-ink-400 text-sm">Toque em uma sugestão pra criar seu primeiro hábito:</p>
          <SugestoesHabito />
          <p className="text-ink-400 text-xs mt-5">ou</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link
              href="/habitos/novo"
              className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-3.5 py-2 hover:opacity-90 transition"
            >
              + Hábito
            </Link>
            <Link
              href="/habitos/tarefas/nova"
              className="text-sm border border-base-600 rounded-lg px-3.5 py-2 hover:bg-base-700 transition"
            >
              + Tarefa
            </Link>
          </div>
        </div>
      ) : itens.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
          <p className="font-display font-semibold mb-1">Nada por aqui</p>
          <p className="text-ink-400 text-sm">Nenhum hábito ou tarefa cai neste dia.</p>
        </div>
      ) : (
        <ListaHojeComOffline itensServidor={itens} dataISO={dataSelecionada} />
      )}
    </main>
  );
}
