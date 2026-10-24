// Etapa 348 — "abrir e ver tudo sem internet".
// As telas do app leem os dados do retrato guardado no aparelho; o que
// falta pra abrir sem internet é só a "casca" (HTML + JS) de cada tela.
// Esta lista diz quais cascas ficam guardadas.
//
// Telas com id no endereço (/habitos/<id>, /financas/<id>/editar...) são
// guardadas UMA vez como "modelo", com um id de mentira; sem internet o
// Service Worker troca o id de mentira pelo id de verdade.

/** id de mentira usado nos modelos (tem que ser igual ao do sw.js e do offline-app.html) */
export const ID_MODELO = "00000000-0000-4000-8000-000000000000";

/** abrem toda hora: ficam sempre frescas (a cada 1 h com internet) */
export const TELAS_PRINCIPAIS = ["/dashboard", "/habitos", "/tarefas", "/tarefas/agenda", "/financas", "/financas/extrato"];

/** todas as outras telas que dá pra ver sem internet (a cada 12 h) */
export const TELAS_SECUNDARIAS = [
  // Início / geral
  "/buscar",
  "/calendario",
  "/notificacoes",
  "/novidades",
  "/perfil",
  "/rapido",
  "/resumo-dia",
  "/retrospectiva",
  "/retrospectiva/mes",
  "/ajuda",
  "/convites",
  // Hábitos
  "/habitos/lista",
  "/habitos/novo",
  "/habitos/categorias",
  "/habitos/categorias/nova",
  "/habitos/conquistas",
  "/habitos/desafios",
  "/habitos/diario",
  "/habitos/estatisticas",
  "/habitos/jardim",
  "/habitos/juntos",
  "/habitos/lixeira",
  "/habitos/mascote",
  "/habitos/mascote/casa",
  "/habitos/mascote/conquistas",
  "/habitos/metas",
  "/habitos/mundo",
  "/habitos/planejador",
  "/habitos/relatorio",
  "/habitos/rotina",
  "/habitos/semana",
  "/habitos/tela",
  "/habitos/timer",
  "/habitos/trilhas",
  // Tarefas
  "/tarefas/nova",
  "/tarefas/lixeira",
  "/tarefas/revisao",
  // Finanças
  "/financas/nova",
  "/financas/transferir",
  "/financas/analise",
  "/financas/assinaturas",
  "/financas/calendario",
  "/financas/cartoes",
  "/financas/categorias",
  "/financas/categorias/nova",
  "/financas/contas",
  "/financas/contas/lixeira",
  "/financas/desafios",
  "/financas/dividir",
  "/financas/divisoes",
  "/financas/envelopes",
  "/financas/etiquetas",
  "/financas/investir",
  "/financas/mais",
  "/financas/metas",
  "/financas/patrimonio",
  "/financas/personalizar",
  "/financas/recorrentes",
  "/financas/relatorio",
  "/financas/simulador",
];

/** telas com id no endereço (ID_MODELO no lugar do id) */
export const TELAS_MODELO = [
  `/habitos/${ID_MODELO}`,
  `/habitos/${ID_MODELO}/editar`,
  `/habitos/${ID_MODELO}/compartilhar`,
  `/tarefas/${ID_MODELO}`,
  `/tarefas/${ID_MODELO}/editar`,
  `/habitos/tarefas/${ID_MODELO}`,
  `/habitos/tarefas/${ID_MODELO}/editar`,
  `/financas/${ID_MODELO}/editar`,
  `/financas/contas/${ID_MODELO}/editar`,
  `/financas/contas/${ID_MODELO}/fatura`,
  `/financas/contas/${ID_MODELO}/compartilhar`,
  `/financas/categorias/${ID_MODELO}/editar`,
  `/financas/recorrentes/${ID_MODELO}`,
  `/financas/desafios/${ID_MODELO}`,
];

export const TODAS_AS_TELAS = [...TELAS_PRINCIPAIS, ...TELAS_SECUNDARIAS, ...TELAS_MODELO];

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "/habitos/<id-de-verdade>/editar" → { modelo: "/habitos/<ID_MODELO>/editar", id }.
 * null se o endereço não tem id (ou já é o modelo).
 * (a mesma regra está escrita no sw.js e no offline-app.html)
 */
export function caminhoModelo(caminho: string): { modelo: string; id: string } | null {
  const partes = caminho.split("/");
  const i = partes.findIndex((p) => RE_UUID.test(p));
  if (i < 0 || partes[i].toLowerCase() === ID_MODELO) return null;
  const id = partes[i];
  partes[i] = ID_MODELO;
  return { modelo: partes.join("/"), id };
}

/** troca o id dentro do HTML guardado (os dois têm o mesmo tamanho, então nada desalinha) */
export function trocarId(html: string, de: string, para: string) {
  return html.split(de).join(para);
}
