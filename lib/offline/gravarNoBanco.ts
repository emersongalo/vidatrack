"use server";

// Etapa 353 — executa no servidor uma "escrita simples" que foi feita sem
// internet (as mesmas que a tela faria direto pelo Supabase do aparelho;
// as regras do banco — RLS — valem do mesmo jeito, com a sessão da pessoa).
import { createClient } from "@/lib/supabase/server";
import { escritaValida, type Escrita } from "@/lib/offline/escrita";

export async function gravarNoBanco(e: Escrita): Promise<{ erro?: string; sucesso?: boolean }> {
  const invalida = escritaValida(e);
  if (invalida) return { erro: invalida };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada — entre de novo no app.");

  const tabela = supabase.from(e.tabela);
  // perfil: só o da própria pessoa
  const id = e.tabela === "perfis" ? user.id : e.id;

  if (e.op === "update") {
    const { data, error } = await tabela.update(e.valores!).eq("id", id!).select("id");
    if (error) return { erro: error.message };
    if (!data?.length) return { erro: "Não deu pra salvar (item apagado ou só pra ver)." };
    return { sucesso: true };
  }
  if (e.op === "insert") {
    const { error } = await tabela.insert(e.valores!);
    if (error && error.code !== "23505") return { erro: error.message }; // 23505 = já tinha chegado
    return { sucesso: true };
  }
  if (e.op === "upsert") {
    const { error } = await tabela.upsert(e.valores!, e.onConflict ? { onConflict: e.onConflict } : undefined);
    if (error) return { erro: error.message };
    return { sucesso: true };
  }
  const { error } = await tabela.delete().eq("id", id!);
  if (error) return { erro: error.message };
  return { sucesso: true };
}
