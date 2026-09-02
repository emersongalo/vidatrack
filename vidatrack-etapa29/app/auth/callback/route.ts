import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const codigo = searchParams.get("code");
  const proximo = searchParams.get("next") ?? "/dashboard";

  if (codigo) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      return NextResponse.redirect(`${origin}${proximo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent("Não foi possível concluir o login com Google")}`
  );
}
