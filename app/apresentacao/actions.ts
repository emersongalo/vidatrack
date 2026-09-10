"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function entrarComoDemonstracao() {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: "demo@vidatrack.online",
    password: "VidaTrack2026",
  });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent("Não consegui entrar na demonstração agora, tenta de novo em instantes")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
