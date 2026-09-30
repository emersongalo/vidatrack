// Etapa 233 — lado do app: pede pro servidor avisar o parceiro.
// Nunca trava nada: se falhar (sem internet, etc.), só não avisa.
export async function avisarDupla(
  acao: "feito" | "cutucar" | "reacao",
  habitoId: string,
  extra: { data?: string; emoji?: string } = {}
): Promise<{ ok: boolean; tipo?: string; jaFeito?: boolean; avisados?: number } | null> {
  try {
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    const r = await fetch("/api/habitos/dupla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao, habitoId, ...extra }),
    });
    return await r.json();
  } catch {
    return null;
  }
}
