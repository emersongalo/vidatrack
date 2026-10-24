import { lerFila, salvarFilaCompleta, type AcaoPendente } from "@/lib/offline/fila";
import { alternarCheckin, ajustarQuantidadeHabito, criarHabitoSilencioso } from "@/app/habitos/actions";
import { alternarConclusaoTarefa, criarTarefaSilenciosa } from "@/app/habitos/tarefas/actions";
import { criarEventoSilencioso, atualizarEventoSilencioso, apagarEventoSilencioso } from "@/lib/agenda/actions";
import { executarAcaoOffline } from "@/lib/offline/executarAcaoOffline";
import { criarTransacaoSilenciosa, atualizarTransacaoSilenciosa, removerTransacaoSilenciosa } from "@/app/financas/actions";

/** Etapa 344 — erro "definitivo" (ex.: conta só pra ver): não adianta tentar de novo */
class ErroSync extends Error {
  constructor(mensagem: string, public definitivo: boolean) {
    super(mensagem);
  }
}

export const EVENTO_SYNC_RECUSADO = "vt-sync-recusado";
let rodando: Promise<ResultadoSincronizacao> | null = null;

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
    case "criar_transacao": {
      // Etapa 344 — o id da ação é o id do lançamento (criado no aparelho)
      const resultado = await criarTransacaoSilenciosa({ ...acao.dados, id: acao.id });
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar lançamento", !!resultado.definitivo);
      return;
    }
    case "editar_transacao": {
      const resultado = await atualizarTransacaoSilenciosa(acao.transacaoId, acao.dados);
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar edição", !!resultado.definitivo);
      return;
    }
    case "apagar_transacao": {
      const resultado = await removerTransacaoSilenciosa(acao.transacaoId);
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar exclusão", !!resultado.definitivo);
      return;
    }
    case "criar_habito": {
      const resultado = await criarHabitoSilencioso(acao.dados);
      if (!resultado.sucesso) throw new Error(resultado.erro ?? "Falha ao sincronizar hábito");
      return;
    }
    // Etapa 343
    case "criar_tarefa": {
      const resultado = await criarTarefaSilenciosa(acao.entradas, /^[0-9a-f-]{36}$/i.test(acao.id) ? acao.id : undefined);
      if (!resultado.sucesso) throw new Error(resultado.erro ?? "Falha ao sincronizar tarefa");
      return;
    }
    case "criar_evento": {
      // Etapa 347 — o id da ação é o id do compromisso (criado no aparelho)
      const resultado = await criarEventoSilencioso(acao.dados, acao.convidados, /^[0-9a-f-]{36}$/i.test(acao.id) ? acao.id : undefined);
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar compromisso", !!resultado.definitivo);
      return;
    }
    // Etapa 350 — qualquer outra ação feita sem internet
    case "generica": {
      const resultado = await executarAcaoOffline(acao.acao, acao.args);
      if (!resultado.sucesso) {
        const nome = acao.rotulo ? `${acao.rotulo}: ` : "";
        throw new ErroSync(nome + (resultado.erro ?? "Falha ao sincronizar"), !!resultado.definitivo);
      }
      return;
    }
    case "editar_evento": {
      const resultado = await atualizarEventoSilencioso(acao.eventoId, acao.dados, acao.convidados);
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar compromisso", !!resultado.definitivo);
      return;
    }
    case "apagar_evento": {
      const resultado = await apagarEventoSilencioso(acao.eventoId, acao.soODia ?? null);
      if (!resultado.sucesso) throw new ErroSync(resultado.erro ?? "Falha ao sincronizar exclusão", !!resultado.definitivo);
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
  // Etapa 344 — uma sincronização por vez (lançar rápido várias vezes não
  // dispara envios em paralelo)
  if (rodando) return rodando;
  rodando = (async () => {
    const fila = lerFila();
    if (fila.length === 0) return { processados: 0, restantes: 0, comErro: false };

    const resolvidos = new Set<string>();
    let processados = 0;
    let comErro = false;

    for (const acao of fila) {
      // Etapa 343 — marcação num item que só existe no aparelho (criado
      // offline, id "offline-…") não tem como ir pro servidor: descarta.
      const idLocal = "tarefaId" in acao ? acao.tarefaId : "habitoId" in acao ? acao.habitoId : "";
      if (idLocal.startsWith("offline-")) {
        processados++;
        resolvidos.add(JSON.stringify(acao));
        continue;
      }
      try {
        await executarAcao(acao);
        processados++;
        resolvidos.add(JSON.stringify(acao));
      } catch (e) {
        if (e instanceof ErroSync && e.definitivo) {
          // recusado de vez: tira da fila e avisa (a tela volta ao que está no banco)
          resolvidos.add(JSON.stringify(acao));
          try {
            window.dispatchEvent(new CustomEvent(EVENTO_SYNC_RECUSADO, { detail: e.message }));
          } catch {}
        } else {
          comErro = true;
        }
      }
    }

    // Etapa 344 — guarda o que falhou + o que entrou na fila enquanto enviava
    const restantes = lerFila().filter((a) => !resolvidos.has(JSON.stringify(a)));
    salvarFilaCompleta(restantes);
    return { processados, restantes: restantes.length, comErro };
  })();
  try {
    return await rodando;
  } finally {
    rodando = null;
  }
}
