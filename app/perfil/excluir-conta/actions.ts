"use server";

import { redirect } from "next/navigation";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { r2, BUCKET_ANEXOS } from "@/lib/r2/client";

/**
 * Exclui a conta da pessoa por completo — exigência do Google Play
 * pra qualquer app que permite criar conta (desde 2023). O banco já
 * tem "on delete cascade" em toda tabela ligada a auth.users, então
 * apagar o usuário no Auth já limpa hábitos, notas, finanças,
 * compartilhamentos, vínculo de notificações, tudo — automaticamente.
 *
 * O que o banco NÃO limpa sozinho é o que está guardado no
 * Cloudflare R2 (fotos de perfil, anexos de notas), por isso isso é
 * apagado manualmente primeiro, senão fica lixo órfão pra sempre.
 */
export async function excluirContaPermanentemente() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = criarClienteAdmin(
    "exclusao_de_conta",
    `Usuário ${user.id} pediu exclusão definitiva da própria conta`
  );

  // 1. Apaga a foto de perfil no R2, se for uma foto trocada manualmente
  // (chave do R2) e não uma URL do Google (que não é nossa pra apagar).
  const { data: perfil } = await admin.from("perfis").select("foto_url").eq("id", user.id).maybeSingle();
  if (perfil?.foto_url && !perfil.foto_url.startsWith("http")) {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET_ANEXOS, Key: perfil.foto_url })).catch(() => {});
  }

  // 2. Apaga todos os anexos de todas as notas da pessoa.
  const { data: notas } = await admin.from("notas").select("id").eq("dono_id", user.id);
  const idsNotas = (notas ?? []).map((n) => n.id);

  if (idsNotas.length > 0) {
    const { data: anexos } = await admin
      .from("nota_anexos")
      .select("caminho_storage")
      .in("nota_id", idsNotas);

    for (const anexo of anexos ?? []) {
      await r2
        .send(new DeleteObjectCommand({ Bucket: BUCKET_ANEXOS, Key: anexo.caminho_storage }))
        .catch(() => {});
    }
  }

  // 3. Apaga o usuário de verdade — isso dispara a cascata no banco
  // (todas as tabelas ligadas a auth.users somem automaticamente).
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect(`/perfil/excluir-conta?erro=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut().catch(() => {});
  redirect("/conta-excluida");
}
