"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function salvarInscricaoPush(inscricao: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Etapa 192 — mesmo motivo do salvarTokenFCM abaixo: action chamada
  // em segundo plano não pode redirecionar.
  if (!user) return;

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
export async function salvarTokenFCM(token: string, suportaAcoes = false) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Etapa 192 — NUNCA redirecionar aqui. Essa action é chamada
  // sozinha, em segundo plano, toda vez que o app nativo abre uma
  // página (inclusive /apresentacao e /login, sem ninguém logado).
  // O redirect("/login") que existia fazia a página recarregar,
  // o que registrava o push de novo, que chamava isso de novo... —
  // um loop de ~5 recargas por segundo que deixava a tela piscando
  // e impedia o login com Google de terminar. Sem usuário: só ignora
  // (o token é salvo na próxima abertura, já logado).
  if (!user) return;

  await supabase.from("fcm_tokens").upsert(
    // Etapa 195 — suporta_acoes: app 1.0.5+ (notificação com botões)
    { usuario_id: user.id, token, suporta_acoes: suportaAcoes },
    { onConflict: "token" }
  );
}
