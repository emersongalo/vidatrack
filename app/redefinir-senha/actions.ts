"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function definirNovaSenha(formData: FormData) {
  const supabase = createClient();
  const senha = String(formData.get("senha"));
  const confirmarSenha = String(formData.get("confirmarSenha"));

  if (senha !== confirmarSenha) {
    redirect(`/redefinir-senha?erro=${encodeURIComponent("As senhas não coincidem")}`);
  }

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    redirect(`/redefinir-senha?erro=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
