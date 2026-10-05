"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { atualizarTarefa } from "../../actions";
import { FormularioTarefa, type TipoRepeticao } from "@/components/FormularioTarefa";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { CarregandoTela } from "@/components/Esqueleto";

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

  if (snapshot === undefined) return <CarregandoTela comTopo={false} linhas={4} />;

  const tarefa = (snapshot?.tarefas ?? []).find((t: any) => t.id === params.id);
  const categorias = snapshot?.categoriasProdutividade ?? [];

  if (!tarefa) {
    return (
      <main className="pagina-form px-6 md:px-12 pt-6">
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
      contasFinancas={((snapshot?.financas.contas ?? []) as any[]).filter((c) => c.dono_id === undefined || c.dono_id === snapshot?.perfil.id)}
      categoriasFinancas={((snapshot?.financas.categorias ?? []) as any[]).filter((c) => c.dono_id === snapshot?.perfil.id)}
      erro={searchParams.get("erro") ?? undefined}
      hoje={hojeISO()}
      voltarHref={`/tarefas/${tarefa.id}`}
      titulo="Editar tarefa"
      textoBotao="Salvar alterações"
      mostrarChecklist={false}
      valoresIniciais={{
        titulo: tarefa.titulo,
        icone: tarefa.icone,
        categoriaId: tarefa.categoria_id,
        repetir: tarefa.repetir as TipoRepeticao,
        diasSemana: tarefa.dias_semana ?? [],
        data: tarefa.data,
        horarioLembrete: tarefa.horario_lembrete,
        observacoes: tarefa.observacoes,
        diaMes: tarefa.dia_mes,
        mes: tarefa.mes,
        intervaloDias: tarefa.intervalo_dias,
        prioridade: tarefa.prioridade,
        financaTipo: tarefa.financa_tipo,
        financaValor: tarefa.financa_valor != null ? Number(tarefa.financa_valor) : null,
        financaContaId: tarefa.financa_conta_id,
        financaCategoriaId: tarefa.financa_categoria_id,
      }}
    />
  );
}
