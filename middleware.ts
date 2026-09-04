import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas que qualquer pessoa pode ver, logada ou não (não exige sessão).
const ROTAS_PUBLICAS = [
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/verifique-email",
  "/auth/callback",
  "/privacidade",
  "/conta-excluida",
];

// Dessas rotas públicas, só ESSAS não fazem sentido pra quem já está
// logado (voltam pro painel sozinhas) — login, cadastro, etc.
// "/privacidade" e "/conta-excluida" ficam de fora de propósito: uma
// pessoa logada pode querer ler a política de privacidade, e a
// segunda é a última tela mostrada depois de excluir a própria conta
// (nesse momento específico ela ainda pode ter uma sessão residual no
// navegador por alguns instantes, e não pode ser jogada de volta pro
// painel de uma conta que acabou de deixar de existir).
const ROTAS_SO_PARA_DESLOGADO = ["/login", "/cadastro", "/esqueci-senha", "/verifique-email"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas de API nunca devem ser redirecionadas pra uma página HTML de
  // login — isso não faz sentido pra quem está chamando programaticamente
  // (o agendador externo dos lembretes, por exemplo, nem tem sessão
  // nenhuma, e usa seu próprio segredo — sendo redirecionado aqui, a
  // chamada dele nunca chegava a rodar de verdade). Cada rota de API já
  // cuida da própria autorização e devolve o erro certo em JSON.
  //
  // Ainda deixamos a chamada `getUser()` acima rodar mesmo pra essas
  // rotas — é o que mantém a sessão renovada nos cookies — só não
  // aplicamos o redirecionamento de página em cima do resultado.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return response;
  }

  const rotaPublica = ROTAS_PUBLICAS.some((rota) =>
    request.nextUrl.pathname.startsWith(rota)
  );

  if (!user && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const rotaSoParaDeslogado = ROTAS_SO_PARA_DESLOGADO.some((rota) =>
    request.nextUrl.pathname.startsWith(rota)
  );

  if (user && rotaSoParaDeslogado) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
