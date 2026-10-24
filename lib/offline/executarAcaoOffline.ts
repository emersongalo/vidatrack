"use server";

// Etapa 350 — executa no servidor uma ação que foi feita sem internet.
// Chama a MESMA ação que o app chamaria online (mesmas regras e
// permissões). Redirecionamento "pra tela de sucesso" = deu certo;
// redirecionamento com ?erro=... = recusado de vez (não adianta repetir).
import { isRedirectError, getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isNotFoundError } from "next/dist/client/components/not-found";
import { ehAcaoOffline, type ArgSerializado } from "@/lib/offline/acoesOffline";
type Resultado = { sucesso: boolean; erro?: string; definitivo?: boolean };

// Etapa 352 — os módulos das ações só são carregados quando a fila
// precisa deles (e nunca no carregamento do app ou dos testes).
const MODULOS = {
  habitos: () => import("@/app/habitos/actions"),
  tarefas: () => import("@/app/habitos/tarefas/actions"),
  financas: () => import("@/app/financas/actions"),
  metas: () => import("@/app/financas/metas/actions"),
  desafios: () => import("@/app/financas/desafios/actions"),
  recorrentes: () => import("@/app/financas/recorrentes/actions"),
  gravar: () => import("@/lib/offline/gravarNoBanco"),
  divisoes: () => import("@/app/financas/divisoes/actions"),
} as const;

const MAPA: Record<string, [keyof typeof MODULOS, string]> = {
  gravarNoBanco: ["gravar", "gravarNoBanco"],
  criarHabito: ["habitos", "criarHabito"],
  atualizarHabito: ["habitos", "atualizarHabito"],
  arquivarHabito: ["habitos", "arquivarHabito"],
  restaurarHabito: ["habitos", "restaurarHabito"],
  excluirHabitoDefinitivamente: ["habitos", "excluirHabitoDefinitivamente"],
  salvarObservacaoCheckin: ["habitos", "salvarObservacaoCheckin"],
  atualizarTarefa: ["tarefas", "atualizarTarefa"],
  arquivarTarefa: ["tarefas", "arquivarTarefa"],
  restaurarTarefa: ["tarefas", "restaurarTarefa"],
  excluirTarefaDefinitivamente: ["tarefas", "excluirTarefaDefinitivamente"],
  alternarSubtarefa: ["tarefas", "alternarSubtarefa"],
  alternarConclusaoTarefaUnica: ["tarefas", "alternarConclusaoTarefaUnica"],
  reordenarHabitos: ["habitos", "reordenarHabitos"],
  reordenarTarefas: ["tarefas", "reordenarTarefas"],
  criarTransacao: ["financas", "criarTransacao"],
  atualizarTransacao: ["financas", "atualizarTransacao"],
  removerTransacao: ["financas", "removerTransacao"],
  removerParcelasDaqui: ["financas", "removerParcelasDaqui"],
  criarTransferencia: ["financas", "criarTransferencia"],
  criarDivisao: ["divisoes", "criarDivisao"],
  transferirParaInvestimento: ["financas", "transferirParaInvestimento"],
  criarConta: ["financas", "criarConta"],
  atualizarConta: ["financas", "atualizarConta"],
  arquivarConta: ["financas", "arquivarConta"],
  restaurarConta: ["financas", "restaurarConta"],
  excluirContaDefinitivamente: ["financas", "excluirContaDefinitivamente"],
  criarCategoria: ["financas", "criarCategoria"],
  criarCategoriaRapida: ["financas", "criarCategoriaRapida"],
  atualizarCategoria: ["financas", "atualizarCategoria"],
  removerCategoria: ["financas", "removerCategoria"],
  ajustarEnvelope: ["financas", "ajustarEnvelope"],
  criarMeta: ["metas", "criarMeta"],
  adicionarProgressoMeta: ["metas", "adicionarProgressoMeta"],
  retirarDaMeta: ["metas", "retirarDaMeta"],
  editarMeta: ["metas", "editarMeta"],
  arquivarMeta: ["metas", "arquivarMeta"],
  excluirMetaDefinitivamente: ["metas", "excluirMetaDefinitivamente"],
  criarDesafio: ["desafios", "criarDesafio"],
  completarQuadrado: ["desafios", "completarQuadrado"],
  excluirDesafio: ["desafios", "excluirDesafio"],
  criarRecorrencia: ["recorrentes", "criarRecorrencia"],
  alternarAtivaRecorrencia: ["recorrentes", "alternarAtivaRecorrencia"],
  removerRecorrencia: ["recorrentes", "removerRecorrencia"],
  atualizarRecorrencia: ["recorrentes", "atualizarRecorrencia"],
  gerarLancamentoRecorrenteOffline: ["recorrentes", "gerarLancamentoRecorrenteOffline"],
};

function desserializar(arg: ArgSerializado): unknown {
  if (arg && typeof arg === "object" && !Array.isArray(arg) && Array.isArray((arg as any).__fd)) {
    const fd = new FormData();
    for (const par of (arg as any).__fd as unknown[]) {
      if (Array.isArray(par) && typeof par[0] === "string" && typeof par[1] === "string") fd.append(par[0], par[1]);
    }
    return fd;
  }
  return arg;
}

/** "?erro=Saldo%20insuficiente" → "Saldo insuficiente" */
export async function erroDoEndereco(url: string): Promise<string | null> {
  const m = url.match(/[?&]erro=([^&#]*)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return m[1];
  }
}

export async function executarAcaoOffline(acao: string, args: ArgSerializado[]): Promise<Resultado> {
  if (!ehAcaoOffline(acao) || !MAPA[acao]) return { sucesso: false, erro: "Ação desconhecida", definitivo: true };
  const lista = (Array.isArray(args) ? args : []).map(desserializar);
  try {
    const [modulo, nome] = MAPA[acao];
    const fn = ((await MODULOS[modulo]()) as Record<string, unknown>)[nome] as (...a: unknown[]) => Promise<unknown>;
    if (typeof fn !== "function") return { sucesso: false, erro: "Ação desconhecida", definitivo: true };
    const r: any = await fn(...lista);
    // ações que devolvem { erro } / { sucesso: false } em vez de redirecionar
    if (r && typeof r === "object") {
      const erro = typeof r.erro === "string" && r.erro ? r.erro : r.sucesso === false ? "Não deu certo" : null;
      if (erro) return { sucesso: false, erro, definitivo: true };
    }
    return { sucesso: true };
  } catch (e) {
    if (isRedirectError(e)) {
      const url = getURLFromRedirectError(e) ?? "";
      if (url.startsWith("/login")) return { sucesso: false, erro: "Sessão expirada — entre de novo no app." };
      const erro = await erroDoEndereco(url);
      return erro ? { sucesso: false, erro, definitivo: true } : { sucesso: true };
    }
    if (isNotFoundError(e)) return { sucesso: false, erro: "Item não encontrado", definitivo: true };
    return { sucesso: false, erro: String((e as any)?.message ?? e) };
  }
}
