// Etapa 363 — pedir avaliação na Play Store na hora certa (janelinha
// oficial do Google, sem sair do app). Regras:
// - só no app Android;
// - depois de usar o app em pelo menos 5 dias diferentes (e 7 dias desde
//   o primeiro uso);
// - logo depois de um momento bom (comemoração: completou o dia, etc.);
// - no máximo a cada 120 dias, e no máximo 3 vezes.
// O Google ainda decide se mostra ou não (ele tem limite próprio).
export const CHAVE_AVALIACAO = "vidatrack-avaliacao";
export const EVENTO_MOMENTO_FELIZ = "vt-momento-feliz";

export type EstadoAvaliacao = { primeiroUso: number; dias: string[]; pedidoEm: number | null; vezes: number };

const DIA = 86400000;

export function estadoInicial(agora: number): EstadoAvaliacao {
  return { primeiroUso: agora, dias: [], pedidoEm: null, vezes: 0 };
}

export function registrarDia(e: EstadoAvaliacao, hoje: string): EstadoAvaliacao {
  if (e.dias.includes(hoje)) return e;
  return { ...e, dias: [...e.dias, hoje].slice(-30) };
}

export function podePedir(e: EstadoAvaliacao, agora: number): boolean {
  if (e.vezes >= 3) return false;
  if (e.dias.length < 5) return false;
  if (agora - e.primeiroUso < 7 * DIA) return false;
  if (e.pedidoEm && agora - e.pedidoEm < 120 * DIA) return false;
  return true;
}

export function marcarPedido(e: EstadoAvaliacao, agora: number): EstadoAvaliacao {
  return { ...e, pedidoEm: agora, vezes: e.vezes + 1 };
}

/** avisa que aconteceu algo bom (as comemorações chamam isso) */
export function momentoFeliz() {
  try {
    window.dispatchEvent(new Event(EVENTO_MOMENTO_FELIZ));
  } catch {}
}
