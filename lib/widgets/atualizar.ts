import { registerPlugin } from "@capacitor/core";

type WidgetHojeAPI = {
  atualizar: (opcoes: { feitos: number; total: number }) => Promise<{ ok: boolean }>;
  atualizarSaldo: (opcoes: { saldoTexto: string }) => Promise<{ ok: boolean }>;
  atualizarContasAPagar: (opcoes: { linhas: string }) => Promise<{ ok: boolean }>;
  atualizarPendencias: (opcoes: { quantidade: number }) => Promise<{ ok: boolean }>;
};

const WidgetHoje = registerPlugin<WidgetHojeAPI>("WidgetHoje");

function estaNoAppNativo() {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Etapa 154 — mesmo plugin usado pelo widget "Hoje" (Etapa 152),
 * agora com mais 3 métodos. Cada função aqui já checa sozinha se
 * está rodando no app instalado — chamar isso rodando no navegador
 * não faz nada (sem erro, só não tem widget pra atualizar mesmo).
 */
export function atualizarWidgetSaldo(saldoTexto: string) {
  if (!estaNoAppNativo()) return;
  WidgetHoje.atualizarSaldo({ saldoTexto }).catch((erro) => console.error("[WidgetSaldo] falhou", erro));
}

export function atualizarWidgetContasAPagar(linhas: string[]) {
  if (!estaNoAppNativo()) return;
  WidgetHoje.atualizarContasAPagar({ linhas: linhas.slice(0, 3).join("\n") }).catch((erro) =>
    console.error("[WidgetContas] falhou", erro)
  );
}

export function atualizarWidgetPendencias(quantidade: number) {
  if (!estaNoAppNativo()) return;
  WidgetHoje.atualizarPendencias({ quantidade }).catch((erro) => console.error("[WidgetPendencias] falhou", erro));
}
