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

/**
 * Salva o token do FCM que o app nativo (instalado via Play Store, ou
 * o .apk) gera pra esse aparelho. Diferente do Web Push, isso só
 * funciona quando o VidaTrack está rodando dentro do Capacitor, nunca
 * num navegador comum — o componente que chama isso já checa isso
 * antes de tentar.
 */
export async function salvarTokenFCM(token: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("fcm_tokens").upsert(
    { usuario_id: user.id, token },
    { onConflict: "token" }
  );
}
