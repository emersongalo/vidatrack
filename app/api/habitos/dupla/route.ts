import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processarDupla, type AcaoDupla } from "@/lib/habitos/duplaServidor";

export const dynamic = "force-dynamic";

/**
 * Etapa 233 — hábitos em dupla. O app chama depois de marcar um hábito
 * compartilhado ("feito"), ao tocar em Cutucar ou ao reagir com um emoji.
 * Quem recebe ganha a notificação e, ao abrir o app, a animação.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  let corpo: { acao?: string; habitoId?: string; data?: string; emoji?: string } = {};
  try {
    corpo = await request.json();
  } catch {}
  const acao = (["feito", "cutucar", "reacao"] as const).find((a) => a === corpo.acao) as AcaoDupla | undefined;
  if (!acao || !corpo.habitoId) return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });

  try {
    const r = await processarDupla(supabase, user.id, { acao, habitoId: String(corpo.habitoId), data: corpo.data, emoji: corpo.emoji });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erro: e?.message ?? "Erro" }, { status: 500 });
  }
}
