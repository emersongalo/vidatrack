"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function entrar(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email"));
  const senha = String(formData.get("senha"));

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function cadastrar(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email"));
  const senha = String(formData.get("senha"));
  const nome = String(formData.get("nome"));

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
    },
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(error.message)}`);
  }

  redirect("/verifique-email");
}

export async function entrarComGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?erro=${encodeURIComponent(error?.message ?? "Não foi possível entrar com Google")}`);
  }

  redirect(data.url);
}

export async function pedirRedefinicaoSenha(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email"));

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/redefinir-senha`,
  });

  if (error) {
    redirect(`/esqueci-senha?erro=${encodeURIComponent(error.message)}`);
  }

  redirect("/esqueci-senha?enviado=ok");
}

export async function sair() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
