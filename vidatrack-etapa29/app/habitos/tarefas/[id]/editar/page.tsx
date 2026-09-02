import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { atualizarTarefa } from "../../actions";
import { FormularioTarefa } from "@/components/FormularioTarefa";

export default async function EditarTarefaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const [{ data: tarefa }, { data: categorias }] = await Promise.all([
    supabase
      .from("tarefas")
      .select("id, titulo, icone, categoria_id, repetir, dias_semana, data, horario_lembrete")
      .eq("id", params.id)
      .single(),
    supabase.from("categorias_produtividade").select("id, nome").order("nome"),
  ]);

  if (!tarefa) notFound();

  return (
    <FormularioTarefa
      action={atualizarTarefa.bind(null, tarefa.id)}
      categorias={categorias ?? []}
      erro={searchParams.erro}
      hoje={hojeISO()}
      voltarHref={`/habitos/tarefas/${tarefa.id}`}
      titulo="Editar tarefa"
      textoBotao="Salvar alterações"
      mostrarChecklist={false}
      valoresIniciais={{
        titulo: tarefa.titulo,
        icone: tarefa.icone,
        categoriaId: tarefa.categoria_id,
        repetir: tarefa.repetir as "nenhuma" | "diaria" | "dias_semana",
        diasSemana: tarefa.dias_semana ?? [],
        data: tarefa.data,
        horarioLembrete: tarefa.horario_lembrete,
      }}
    />
  );
}
