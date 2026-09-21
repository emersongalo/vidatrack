import { registerPlugin } from "@capacitor/core";

type WidgetHojeAPI = {
  atualizar: (opcoes: { feitos: number; total: number }) => Promise<{ ok: boolean }>;
  atualizarSaldo: (opcoes: { saldoTexto: string }) => Promise<{ ok: boolean }>;
  atualizarContasAPagar: (opcoes: { linhas: string }) => Promise<{ ok: boolean }>;
  atualizarPendencias: (opcoes: { quantidade: number }) => Promise<{ ok: boolean }>;
};

// Etapa 155 — o plugin só é registrado na hora em que alguma das
// funções abaixo é REALMENTE chamada (e só depois de confirmar que
// está no app nativo), nunca no carregamento do módulo. Registrar
// (ou até importar de um jeito que toque em `window`) assim que o
// arquivo é importado quebra a renderização no SERVIDOR — lá não
// existe `window` nenhum, e o Next.js roda uma passada no servidor
// mesmo em telas marcadas "use client". Foi exatamente isso que
// derrubou a aba Finanças na Etapa 154.
let pluginCache: WidgetHojeAPI | null = null;
function obterPlugin(): WidgetHojeAPI | null {
  if (typeof window === "undefined") return null;
  if (!pluginCache) pluginCache = registerPlugin<WidgetHojeAPI>("WidgetHoje");
  return pluginCache;
}

function estaNoAppNativo() {
  return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Etapa 154/155 — mesmo plugin usado pelo widget "Hoje", agora com
 * mais 3 métodos. Cada função aqui já checa sozinha se está rodando
 * no app instalado — chamar isso rodando no navegador não faz nada
 * (sem erro, só não tem widget pra atualizar mesmo).
 */
export function atualizarWidgetSaldo(saldoTexto: string) {
  if (!estaNoAppNativo()) return;
  obterPlugin()
    ?.atualizarSaldo({ saldoTexto })
    .catch((erro) => console.error("[WidgetSaldo] falhou", erro));
}

export function atualizarWidgetContasAPagar(linhas: string[]) {
  if (!estaNoAppNativo()) return;
  obterPlugin()
    ?.atualizarContasAPagar({ linhas: linhas.slice(0, 3).join("\n") })
    .catch((erro) => console.error("[WidgetContas] falhou", erro));
}

export function atualizarWidgetPendencias(quantidade: number) {
  if (!estaNoAppNativo()) return;
  obterPlugin()
    ?.atualizarPendencias({ quantidade })
    .catch((erro) => console.error("[WidgetPendencias] falhou", erro));
}
