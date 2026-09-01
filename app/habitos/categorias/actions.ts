"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function criarCategoriaProdutividade(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "habito");

  if (!nome) {
    redirect(`/habitos/categorias/nova?erro=${encodeURIComponent("Dê um nome para a categoria")}`);
  }

  const { error } = await supabase.from("categorias_produtividade").insert({
    dono_id: user!.id,
    nome,
    cor,
  });

  if (error) {
    redirect(`/habitos/categorias/nova?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/habitos");
  revalidatePath("/habitos/categorias");
  redirect("/habitos/categorias");
}

export async function removerCategoriaProdutividade(categoriaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("categorias_produtividade").delete().eq("id", categoriaId);
  revalidatePath("/habitos");
  revalidatePath("/habitos/categorias");
}
