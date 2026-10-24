// Etapa 350 — ações do app que podem ser feitas sem internet: ficam na
// fila e são executadas no servidor quando a conexão volta (pelo
// executarAcaoOffline, que só aceita os nomes desta lista).
export const ACOES_OFFLINE = [
  // Etapa 353 — escrita simples numa tabela (lib/offline/escrita.ts)
  "gravarNoBanco",
  // Hábitos
  "criarHabito",
  "atualizarHabito",
  "arquivarHabito",
  "restaurarHabito",
  "excluirHabitoDefinitivamente",
  "salvarObservacaoCheckin",
  // Tarefas
  "atualizarTarefa",
  "arquivarTarefa",
  "restaurarTarefa",
  "excluirTarefaDefinitivamente",
  "alternarSubtarefa",
  "alternarConclusaoTarefaUnica",
  "reordenarHabitos",
  "reordenarTarefas",
  // Finanças (Etapas 351 e 352)
  "criarTransacao",
  "atualizarTransacao",
  "removerTransacao",
  "removerParcelasDaqui",
  "criarTransferencia",
  "criarDivisao",
  "transferirParaInvestimento",
  "criarConta",
  "atualizarConta",
  "arquivarConta",
  "restaurarConta",
  "excluirContaDefinitivamente",
  "criarCategoria",
  "criarCategoriaRapida",
  "atualizarCategoria",
  "removerCategoria",
  "ajustarEnvelope",
  "criarMeta",
  "adicionarProgressoMeta",
  "retirarDaMeta",
  "editarMeta",
  "arquivarMeta",
  "excluirMetaDefinitivamente",
  "criarDesafio",
  "completarQuadrado",
  "excluirDesafio",
  "criarRecorrencia",
  "alternarAtivaRecorrencia",
  "removerRecorrencia",
  "atualizarRecorrencia",
  "gerarLancamentoRecorrenteOffline",
] as const;

export type NomeAcaoOffline = (typeof ACOES_OFFLINE)[number];

/** argumento que vai pra fila (FormData vira lista de pares) */
export type ArgSerializado = string | number | boolean | null | { __fd: [string, string][] } | Record<string, unknown> | unknown[];

export function ehAcaoOffline(nome: string): nome is NomeAcaoOffline {
  return (ACOES_OFFLINE as readonly string[]).includes(nome);
}
