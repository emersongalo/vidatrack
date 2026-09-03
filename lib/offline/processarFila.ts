import { lerFila, salvarFilaCompleta, type AcaoPendente } from "@/lib/offline/fila";
import { alternarCheckin, ajustarQuantidadeHabito, criarHabitoSilencioso } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { criarNotaSilenciosa, atualizarNotaSilenciosa } from "@/app/notas/actions";
import { criarTransacaoSilenciosa } from "@/app/financas/actions";

async function executarAcao(acao: AcaoPendente): Promise<void> {
  switch (acao.tipo) {
    case "checkin_habito":
      await alternarCheckin(acao.habitoId, acao.data);
      return;
    case "ajuste_habito":
      await ajustarQuantidadeHabito(acao.habitoId, acao.data, acao.delta);
      return;
    case "conclusao_tarefa":
      await alternarConclusaoTarefa(acao.tarefaId, acao.data);
      return;
    case "criar_nota": {
      const resultado = await criarNotaSilenciosa(acao.titulo, acao.conteudo);
      if ("erro" in resultado) throw new Error(resultado.erro);
      return;
    }
    case "editar_nota": {
      const resultado = await atualizarNotaSilenciosa(acao.notaId, acao.titulo, acao.conteudo);
      if (!resultado.sucesso) throw new Error("Falha ao sincronizar edição de nota");
      return;
    }
    case "excluir_nota":
      // Exclusão de verdade continua exigindo confirmação explícita
      // (Etapa 15) — no offline, só marcamos a intenção; a pessoa
      // confirma a exclusão quando a conexão voltar. Por segurança,
      // isso não é auto-executado aqui de propósito.
      return;
    case "criar_transacao": {
      const resultado = await criarTransacaoSilenciosa(acao.dados);
      if (!resultado.sucesso) throw new Error(resultado.erro ?? "Falha ao sincronizar lançamento");
      return;
    }
    case "criar_habito": {
      const resultado = await criarHabitoSilencioso(acao.dados);
      if (!resultado.sucesso) throw new Error(resultado.erro ?? "Falha ao sincronizar hábito");
      return;
    }
  }
}

export type ResultadoSincronizacao = { processados: number; restantes: number; comErro: boolean };

/**
 * Processa a fila de ações feitas offline, uma de cada vez. Se uma
 * ação falhar de verdade (não por falta de conexão — estamos rodando
 * isso justamente porque a conexão voltou), ela fica guardada pra
 * tentar de novo na próxima vez, mas não trava as ações seguintes.
 */
export async function processarFilaSincronizacao(): Promise<ResultadoSincronizacao> {
  const fila = lerFila();
  if (fila.length === 0) return { processados: 0, restantes: 0, comErro: false };

  const restantes: AcaoPendente[] = [];
  let processados = 0;
  let comErro = false;

  for (const acao of fila) {
    try {
      await executarAcao(acao);
      processados++;
    } catch {
      restantes.push(acao);
      comErro = true;
    }
  }

  salvarFilaCompleta(restantes);
  return { processados, restantes: restantes.length, comErro };
}
