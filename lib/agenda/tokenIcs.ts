// Etapa 359 — o link da agenda pra assinar no Google Agenda não tem login
// (o Google busca sozinho). Ele leva um "token" = id da pessoa + assinatura
// secreta: só o servidor sabe gerar, e não dá pra adivinhar o de outra pessoa.
// Só roda no servidor.
import { createHmac, timingSafeEqual } from "crypto";

function segredo() {
  const s = process.env.AGENDA_ICS_SEGREDO || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("sem segredo pro link da agenda");
  return s;
}

function assinatura(usuarioId: string) {
  return createHmac("sha256", segredo()).update(`agenda-ics:${usuarioId}`).digest("base64url").slice(0, 32);
}

export function gerarTokenIcs(usuarioId: string) {
  return `${usuarioId}.${assinatura(usuarioId)}`;
}

/** devolve o id da pessoa se o token for válido */
export function lerTokenIcs(token: string): string | null {
  const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/i.exec(token.replace(/\.ics$/i, ""));
  if (!m) return null;
  const esperado = Buffer.from(assinatura(m[1]));
  const recebido = Buffer.from(m[2]);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido) ? m[1] : null;
}
