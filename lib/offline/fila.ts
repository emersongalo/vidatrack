export type AcaoPendente =
  | { tipo: "checkin_habito"; habitoId: string; data: string }
  | { tipo: "ajuste_habito"; habitoId: string; data: string; delta: number }
  | { tipo: "conclusao_tarefa"; tarefaId: string; data: string };

const CHAVE_FILA = "vidatrack-fila-offline";
const CHAVE_CACHE_HOJE = "vidatrack-cache-hoje";

export function lerFila(): AcaoPendente[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FILA) ?? "[]");
  } catch {
    return [];
  }
}

export function adicionarNaFila(acao: AcaoPendente) {
  const fila = lerFila();
  fila.push(acao);
  localStorage.setItem(CHAVE_FILA, JSON.stringify(fila));
}

export function limparFila() {
  localStorage.setItem(CHAVE_FILA, "[]");
}

export function salvarCacheHoje(chave: string, itens: unknown) {
  if (typeof window === "undefined") return;
  try {
    const tudo = JSON.parse(localStorage.getItem(CHAVE_CACHE_HOJE) ?? "{}");
    tudo[chave] = itens;
    localStorage.setItem(CHAVE_CACHE_HOJE, JSON.stringify(tudo));
  } catch {
    // Se o localStorage estiver cheio ou indisponível, ignora — o app
    // volta a funcionar normalmente assim que a conexão retornar.
  }
}

export function lerCacheHoje(chave: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const tudo = JSON.parse(localStorage.getItem(CHAVE_CACHE_HOJE) ?? "{}");
    return tudo[chave] ?? null;
  } catch {
    return null;
  }
}
