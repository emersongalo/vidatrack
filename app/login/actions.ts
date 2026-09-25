"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Etapa 186 — Supabase devolve as mensagens de erro em inglês; isso
// traduz as mais comuns pra um português que faz sentido pra quem tá
// usando o app. O resto (erros raros) passa direto, sem tradução.
function traduzirErroAuth(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("email not confirmed")) {
    return "Esse e-mail ainda não foi confirmado. Confira sua caixa de entrada (e o spam) pelo link que mandamos no cadastro.";
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha errados.";
  }
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "Já existe uma conta com esse e-mail. Tenta entrar em vez de criar uma nova.";
  }
  if (m.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (m.includes("unable to validate email address") || m.includes("invalid email")) {
    return "Esse e-mail não parece válido.";
  }
  return mensagem;
}

export async function entrar(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email"));
  const senha = String(formData.get("senha"));

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(traduzirErroAuth(error.message))}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function cadastrar(formData: FormData) {
  const supabase = createClient();

  const email = String(formData.get("email"));
  const senha = String(formData.get("senha"));
  const nome = String(formData.get("nome"));

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
    },
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(traduzirErroAuth(error.message))}`);
  }

  // Etapa 186 — quando o e-mail já existe mas ainda não foi
  // confirmado, o Supabase (de propósito, por segurança) NÃO avisa
  // que já existe — só devolve um "usuário" sem identities novas, pra
  // não deixar alguém descobrir e-mails cadastrados só tentando.
  // Aqui a gente aceita esse comportamento: a pessoa cai na mesma
  // tela de "confira seu e-mail" de qualquer jeito, e se já tinha
  // conta, o link reenviado serve igual pra confirmar.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    redirect(`/login?erro=${encodeURIComponent("Já existe uma conta com esse e-mail. Tenta entrar, ou usa \"Esqueci minha senha\" se não lembra.")}`);
  }

  redirect(`/verifique-email?email=${encodeURIComponent(email)}`);
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
    redirect(`/esqueci-senha?erro=${encodeURIComponent(traduzirErroAuth(error.message))}`);
  }

  redirect("/esqueci-senha?enviado=ok");
}

// Etapa 186 — reenviar o link de confirmação, pra quando alguém
// perdeu o primeiro e-mail (foi pro spam, demorou, etc). Usa a mesma
// action pra "signup" que o Supabase espera pra reenviar esse tipo
// de link especificamente (diferente do link de redefinir senha).
export async function reenviarConfirmacao(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  return { erro: error ? traduzirErroAuth(error.message) : null };
}

export async function sair() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
