"use client";

import { Suspense, useState, useTransition } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconeHabito } from "@/components/IconeHabito";
import { arquivarTarefa, alternarConclusaoTarefaUnica } from "../actions";
import { CheckboxSubtarefa } from "@/components/CheckboxSubtarefa";
import { PainelCompartilhamentoCliente } from "@/components/PainelCompartilhamentoCliente";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

// Etapa 134
export default function DetalheTarefaPage() {
  return (
    <Suspense fallback={null}>
      <DetalheTarefaConteudo />
    </Suspense>
  );
}

function DetalheTarefaConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { snapshot, recarregar } = useSnapshotOffline();
  const [, iniciarTransicao] = useTransition();
  // Precisa vir antes de qualquer "return" condicional (regra dos hooks
  // do React) — por isso o valor de partida é um objeto vazio, não os
  // dados da tarefa (que a essa altura ainda não sabemos se existe).
  const [subtarefasSobrepostas, setSubtarefasSobrepostas] = useState<Record<string, boolean>>({});

  if (snapshot === undefined) return null;

  const tarefa = (snapshot?.tarefas ?? []).find((t: any) => t.id === params.id);

  if (!tarefa) {
    return (
      <main className="max-w-md mx-auto px-6 md:px-12 pt-6">
        <Link href="/habitos/tarefas" className="text-ink-400 text-sm hover:text-ink-100 transition">
          ← Tarefas
        </Link>
        <p className="text-ink-400 text-sm mt-6">
          Não encontrei essa tarefa no que está salvo no aparelho. Se ela foi criada há pouco tempo, conecte à
          internet uma vez pra atualizar.
        </p>
      </main>
    );
  }

  const subtarefas = ((tarefa.subtarefas as { id: string; texto: string; feita: boolean }[]) ?? []).map((s) =>
    s.id in subtarefasSobrepostas ? { ...s, feita: subtarefasSobrepostas[s.id] } : s
  );

  function alternarSubtarefaLocal(id: string, feitaAtual: boolean) {
    setSubtarefasSobrepostas((atual) => ({ ...atual, [id]: !feitaAtual }));
  }

  function alternarConcluida() {
    iniciarTransicao(async () => {
      await alternarConclusaoTarefaUnica(tarefa.id);
      recarregar();
    });
  }

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
          <IconeHabito icone={tarefa.icone} tamanho={22} />
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
        <button
          onClick={alternarConcluida}
          className={`w-full rounded-lg py-2.5 text-sm font-medium border transition mb-6 ${
            tarefa.concluida ? "border-nota text-nota bg-nota-soft" : "bg-ink-100 text-base-900 border-ink-100"
          }`}
        >
          {tarefa.concluida ? "Marcada como concluída ✓" : "Marcar como concluída"}
        </button>
      )}

      {tarefa.observacoes && (
        <div className="mb-6">
          <p className="text-sm text-ink-400 mb-2">Observações</p>
          <p className="bg-base-800 border border-base-600 rounded-xl2 p-4 text-sm whitespace-pre-wrap">
            {tarefa.observacoes}
          </p>
        </div>
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
                aoAlternarLocal={() => alternarSubtarefaLocal(s.id, s.feita)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-base-600">
        <p className="text-sm text-ink-400 mb-3">Compartilhar</p>
        <PainelCompartilhamentoCliente
          tipoItem="tarefa"
          itemId={tarefa.id}
          caminhoRetorno={`/habitos/tarefas/${tarefa.id}`}
          erroInicial={searchParams.get("erro")}
        />
      </div>
    </main>
  );
}
