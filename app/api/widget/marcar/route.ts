import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";

export const dynamic = "force-dynamic";

/**
 * Etapa 195 — marca um hábito SEM abrir o app: usado pelo botão do
 * widget "Hábitos de hoje" e pelo botão "✓ Feito" da notificação.
 * Autentica pela sessão (cookies da WebView que o Android repassa).
 *
 * acao "alternar" (widget): marca se não estava, desmarca se estava.
 * acao "marcar" (notificação): só marca — tocar duas vezes no mesmo
 * lembrete nunca desfaz sem querer.
 * Hábito com meta numérica (ex: 8 copos): marcar = completar a meta.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  let corpo: { habitoId?: string; data?: string; acao?: string } = {};
  try {
    corpo = await request.json();
  } catch {}

  const habitoId = String(corpo.habitoId ?? "");
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(corpo.data ?? "")) ? String(corpo.data) : dataAtualNoFuso();
  const acao = corpo.acao === "marcar" ? "marcar" : "alternar";
  if (!habitoId) return NextResponse.json({ erro: "habitoId obrigatório" }, { status: 400 });

  // RLS garante que a pessoa só enxerga hábito dela (ou compartilhado com ela)
  const { data: habito } = await supabase.from("habitos").select("id, meta_diaria").eq("id", habitoId).maybeSingle();
  if (!habito) return NextResponse.json({ erro: "Hábito não encontrado" }, { status: 404 });
  const meta = habito.meta_diaria ?? 1;

  const { data: existente } = await supabase
    .from("habito_checkins")
    .select("id, quantidade")
    .eq("habito_id", habitoId)
    .eq("usuario_id", user.id)
    .eq("data", data)
    .maybeSingle();

  let feito: boolean;
  if (existente && (existente.quantidade ?? 1) >= meta) {
    if (acao === "alternar") {
      await supabase.from("habito_checkins").delete().eq("id", existente.id);
      feito = false;
    } else {
      feito = true; // já estava feito
    }
  } else if (existente) {
    await supabase.from("habito_checkins").update({ quantidade: meta }).eq("id", existente.id);
    feito = true;
  } else {
    const { error } = await supabase
      .from("habito_checkins")
      .insert({ habito_id: habitoId, usuario_id: user.id, data, quantidade: meta });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    feito = true;
  }

  revalidatePath("/habitos");
  return NextResponse.json({ ok: true, feito });
}
