"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function gerarCodigo(): string {
  // 6 caracteres, só números e letras maiúsculas fáceis de digitar
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0/I/1 pra evitar confusão
  let codigo = "";
  for (let i = 0; i < 6; i++) codigo += alfabeto[randomInt(alfabeto.length)];
  return codigo;
}

export async function gerarCodigoVinculoTelegram() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Remove códigos antigos desse usuário antes de gerar um novo
  await supabase.from("telegram_codigos_vinculo").delete().eq("usuario_id", user!.id);

  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabase.from("telegram_codigos_vinculo").insert({
    codigo,
    usuario_id: user!.id,
    expira_em: expiraEm,
  });

  revalidatePath("/notificacoes");
}

export async function atualizarHorarioResumo(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const horario = String(formData.get("horario") ?? "07:00");

  await supabase
    .from("telegram_vinculos")
    .update({ horario_resumo_diario: horario })
    .eq("usuario_id", user!.id);

  revalidatePath("/notificacoes");
}

export async function desvincularTelegram() {
  "use server";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("telegram_vinculos").delete().eq("usuario_id", user!.id);
  revalidatePath("/notificacoes");
}
