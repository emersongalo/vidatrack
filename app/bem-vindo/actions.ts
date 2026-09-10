"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function concluirOnboarding() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("perfis").update({ onboarding_concluido: true }).eq("id", user.id);

  redirect("/dashboard");
}
