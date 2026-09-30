// Etapa 233 — manda um aviso (título + texto) pra uma pessoa: no app
// Android (FCM) se ela tiver; senão, no navegador (Web Push). Mesma
// regra dos lembretes: não manda nos dois pro mesmo aparelho.
import { enviarNotificacaoFCM } from "@/lib/fcm/servidor";
import { enviarPush } from "@/lib/push/servidor";
import type { criarClienteAdmin } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof criarClienteAdmin>;

export async function avisarUsuario(admin: Admin, usuarioId: string, titulo: string, corpo: string, url = "/habitos"): Promise<number> {
  let enviados = 0;
  const { data: tokens } = await admin.from("fcm_tokens").select("id, token").eq("usuario_id", usuarioId);

  if (!(tokens ?? []).length) {
    const { data: inscricoes } = await admin.from("push_inscricoes").select("id, endpoint, chaves").eq("usuario_id", usuarioId);
    for (const i of inscricoes ?? []) {
      try {
        await enviarPush({ endpoint: i.endpoint, chaves: i.chaves as any }, { titulo, corpo, url });
        enviados++;
      } catch (erro: any) {
        if (erro?.statusCode === 404 || erro?.statusCode === 410) await admin.from("push_inscricoes").delete().eq("id", i.id);
      }
    }
  }

  for (const t of tokens ?? []) {
    const r = await enviarNotificacaoFCM(t.token, titulo, corpo, url);
    if (r.sucesso) enviados++;
    else if (r.tokenInvalido) await admin.from("fcm_tokens").delete().eq("id", t.id);
  }

  try {
    await admin.from("log_notificacoes").insert({ usuario_id: usuarioId, canal: "dupla", sucesso: enviados > 0, erro: enviados ? null : "sem aparelho" });
  } catch {
    /* log é opcional */
  }
  return enviados;
}
