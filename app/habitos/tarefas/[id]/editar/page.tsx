"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { atualizarTarefa } from "../../actions";
import { FormularioTarefa } from "@/components/FormularioTarefa";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 134
export default function EditarTarefaPage() {
  return (
    <Suspense fallback={null}>
      <EditarTarefaConteudo />
    </Suspense>
  );
}

function EditarTarefaConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { snapshot } = useSnapshotOffline();

  if (snapshot === undefined) return null;

  const tarefa = (snapshot?.tarefas ?? []).find((t: any) => t.id === params.id);
  const categorias = snapshot?.categoriasProdutividade ?? [];

  if (!tarefa) {
    return (
      <main className="max-w-md mx-auto px-6 md:px-12 pt-6">
        <p className="text-ink-400 text-sm">
          Não encontrei essa tarefa no que está salvo no aparelho. Se ela foi criada há pouco tempo, conecte à
          internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  return (
    <FormularioTarefa
      action={atualizarTarefa.bind(null, tarefa.id)}
      categorias={categorias as any}
      erro={searchParams.get("erro") ?? undefined}
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
        observacoes: tarefa.observacoes,
      }}
    />
  );
}
