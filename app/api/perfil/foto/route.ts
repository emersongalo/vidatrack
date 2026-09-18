import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { resolverUrlFoto } from "@/lib/perfil/foto";

// Etapa 133 — só existe pra isolar a resolução da foto de perfil
// (que precisa de uma chave que só pode ficar no servidor) do resto
// do Painel, que já lê tudo do retrato local. Chamado só quando há
// internet; offline, o Painel simplesmente não chama isso e mostra
// o ícone padrão no lugar.
export async function GET() {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfis")
    .select("foto_url, onboarding_concluido")
    .eq("id", user.id)
    .maybeSingle();

  const url = await resolverUrlFoto(perfil?.foto_url ?? null);
  return NextResponse.json({ url, onboardingConcluido: perfil?.onboarding_concluido ?? true });
}
