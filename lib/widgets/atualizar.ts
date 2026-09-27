import { registerPlugin } from "@capacitor/core";
import type { DadosWidgets } from "@/lib/widgets/dados";

type WidgetHojeAPI = {
  // Etapa 195 — um pacote só com os dados de TODOS os widgets
  salvarDados: (opcoes: { json: string }) => Promise<{ ok: boolean }>;
  // Etapa 195 — só existe no app 1.0.5+; serve pra saber se o aparelho
  // tem os widgets novos e a notificação com botões.
  versaoNativa: () => Promise<{ versao: number }>;
};

// Etapa 155 — o plugin só é registrado na hora em que alguma das
// funções abaixo é REALMENTE chamada (e só depois de confirmar que
// está no app nativo), nunca no carregamento do módulo. Registrar
// assim que o arquivo é importado quebra a renderização no SERVIDOR.
let pluginCache: WidgetHojeAPI | null = null;
function obterPlugin(): WidgetHojeAPI | null {
  if (typeof window === "undefined") return null;
  if (!pluginCache) pluginCache = registerPlugin<WidgetHojeAPI>("WidgetHoje");
  return pluginCache;
}

export function estaNoAppNativo() {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

/** Versão da parte nativa (0 = app antigo, sem widgets novos). */
export async function versaoNativa(): Promise<number> {
  if (!estaNoAppNativo()) return 0;
  try {
    const r = await obterPlugin()!.versaoNativa();
    return r?.versao ?? 0;
  } catch {
    return 0;
  }
}

export function salvarDadosWidgets(dados: DadosWidgets) {
  if (!estaNoAppNativo()) return;
  obterPlugin()
    ?.salvarDados({ json: JSON.stringify(dados) })
    .catch((erro) => console.error("[Widgets] falhou", erro));
}

// Etapa 195 — as funções antigas (um widget por vez) viraram "não faz
// nada": quem manda os dados agora é o SincronizadorWidgets, tudo de uma
// vez. Ficam aqui só pra nenhum import antigo quebrar o build.
/** @deprecated use SincronizadorWidgets */
export function atualizarWidgetSaldo(_saldoTexto: string) {}
/** @deprecated use SincronizadorWidgets */
export function atualizarWidgetContasAPagar(_linhas: string[]) {}
/** @deprecated use SincronizadorWidgets */
export function atualizarWidgetPendencias(_quantidade: number) {}
