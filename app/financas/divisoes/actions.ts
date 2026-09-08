"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarDivisao(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const transacaoId = String(formData.get("transacaoId") ?? "");
  const participanteEmail = String(formData.get("participanteEmail") ?? "").trim().toLowerCase();
  const valor = Number(String(formData.get("valor") ?? "").replace(/\./g, "").replace(",", "."));

  if (!transacaoId || !participanteEmail || !valor || valor <= 0) {
    redirect(`/financas/dividir?erro=${encodeURIComponent("Escolha a despesa, o e-mail da pessoa e um valor válido")}`);
  }

  // Se essa pessoa já é um usuário cadastrado, vincula o id dela —
  // assim ela consegue ver e marcar como paga do lado dela também.
  // Se não for, guarda só o e-mail mesmo (fica visível só pra quem
  // criou, mas continua registrado). Acha o id pelo mesmo jeito que
  // já usamos hoje pra achar usuário por e-mail: compartilhamentos
  // anteriores que essa pessoa já aceitou.
  const { data: compartilhamentoExistente } = await supabase
    .from("compartilhamentos")
    .select("usuario_convidado_id")
    .eq("email_convidado", participanteEmail)
    .not("usuario_convidado_id", "is", null)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("divisoes_despesa").insert({
    transacao_id: transacaoId,
    dono_id: user.id,
    participante_id: compartilhamentoExistente?.usuario_convidado_id ?? null,
    participante_email: participanteEmail,
    valor,
  });

  if (error) {
    redirect(`/financas/dividir?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financas/divisoes");
  redirect("/financas/divisoes");
}

export async function marcarDivisaoComoPaga(divisaoId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("divisoes_despesa").update({ pago: true }).eq("id", divisaoId);
  revalidatePath("/financas/divisoes");
}

export async function excluirDivisao(divisaoId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("divisoes_despesa").delete().eq("id", divisaoId);
  revalidatePath("/financas/divisoes");
}
