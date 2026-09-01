"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function salvarInscricaoPush(inscricao: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("push_inscricoes").upsert(
    {
      usuario_id: user.id,
      endpoint: inscricao.endpoint,
      chaves: inscricao.keys,
    },
    { onConflict: "endpoint" }
  );

  revalidatePath("/notificacoes");
}

export async function removerInscricaoPush(endpoint: string) {
  const supabase = createClient();
  await supabase.from("push_inscricoes").delete().eq("endpoint", endpoint);
  revalidatePath("/notificacoes");
}
