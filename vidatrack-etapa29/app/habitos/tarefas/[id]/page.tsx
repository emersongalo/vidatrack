import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { arquivarTarefa, alternarConclusaoTarefaUnica } from "../actions";
import { CheckboxSubtarefa } from "@/components/CheckboxSubtarefa";
import { PainelCompartilhamento } from "@/components/PainelCompartilhamento";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";

export default async function DetalheTarefaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("id, titulo, icone, repetir, data, concluida, subtarefas")
    .eq("id", params.id)
    .single();

  if (!tarefa) notFound();

  const subtarefas = (tarefa.subtarefas as { id: string; texto: string; feita: boolean }[]) ?? [];

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-6">
        <Link href="/habitos/tarefas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Tarefas
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/habitos/tarefas/${tarefa.id}/editar`} className="text-ink-400 text-sm hover:text-ink-100 transition">
            Editar
          </Link>
          <BotaoComConfirmacao
            acao={arquivarTarefa.bind(null, tarefa.id)}
            textoBotao="Arquivar"
            classeBotao="text-ink-400 text-sm hover:text-red-400 transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-nota/15 flex items-center justify-center text-2xl shrink-0">
          {tarefa.icone}
        </div>
        <div>
          <h1 className={`text-xl font-display font-semibold ${tarefa.concluida ? "line-through text-ink-400" : ""}`}>
            {tarefa.titulo}
          </h1>
          <p className="text-xs text-ink-400">
            {tarefa.repetir === "nenhuma"
              ? tarefa.data && new Date(tarefa.data + "T00:00:00").toLocaleDateString("pt-BR")
              : "Repete"}
          </p>
        </div>
      </div>

      {tarefa.repetir === "nenhuma" && (
        <form action={alternarConclusaoTarefaUnica.bind(null, tarefa.id)} className="mb-6">
          <button
            type="submit"
            className={`w-full rounded-lg py-2.5 text-sm font-medium border transition ${
              tarefa.concluida
                ? "border-nota text-nota bg-nota-soft"
                : "bg-ink-100 text-base-900 border-ink-100"
            }`}
          >
            {tarefa.concluida ? "Marcada como concluída ✓" : "Marcar como concluída"}
          </button>
        </form>
      )}

      {subtarefas.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-ink-400 mb-3">
            Checklist · {subtarefas.filter((s) => s.feita).length}/{subtarefas.length}
          </p>
          <div className="space-y-2">
            {subtarefas.map((s) => (
              <CheckboxSubtarefa
                key={s.id}
                tarefaId={tarefa.id}
                subtarefaId={s.id}
                texto={s.texto}
                feita={s.feita}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-base-600">
        <p className="text-sm text-ink-400 mb-3">Compartilhar</p>
        <PainelCompartilhamento
          tipoItem="tarefa"
          itemId={tarefa.id}
          caminhoRetorno={`/habitos/tarefas/${tarefa.id}`}
          erro={searchParams.erro}
        />
      </div>
    </main>
  );
}
