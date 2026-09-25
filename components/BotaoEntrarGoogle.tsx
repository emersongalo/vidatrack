"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { entrarComGoogle } from "@/app/login/actions";

const ESQUEMA_RETORNO = "vidatrack://auth-callback";

function estaNoAppNativo() {
  // Mesmo truque usado no RegistradorPushNativo: no navegador comum
  // `Capacitor` nem existe no window, então isso vira `false` sozinho
  // e o app se comporta exatamente como antes pra quem usa pelo site.
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

/**
 * Por que isso existe (Etapa 121): dentro do app instalado (Capacitor),
 * a WebView não deixa a pessoa navegar pra domínios de fora (como
 * accounts.google.com) — ela "expulsa" essa navegação pro navegador
 * do celular. O login até funciona lá, mas fica preso no navegador,
 * sem devolver a sessão pro app.
 *
 * A correção: em vez de navegar pra fora, abrimos a tela do Google
 * numa aba dentro do próprio app (@capacitor/browser) e usamos um
 * link só nosso (vidatrack://auth-callback) como destino de volta —
 * o Android sabe que esse link é pra abrir o VidaTrack de novo (ver
 * AndroidManifest.xml), então a gente termina o login ali dentro,
 * sem nunca sair do app de verdade.
 *
 * No navegador/PWA isso não muda nada — continua exatamente como
 * antes, chamando a Server Action normal.
 */
export function BotaoEntrarGoogle() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Etapa 155 — guarda SÍNCRONA (não é estado do React, que só
  // atualiza no próximo render) contra clique duplo/rápido demais no
  // botão, que estava abrindo mais de uma aba do Google ao mesmo
  // tempo e confundindo o retorno do login.
  const jaClicouRef = useRef(false);

  useEffect(() => {
    if (!estaNoAppNativo()) return;

    let handle: { remove: () => void } | undefined;

    (async () => {
      const { App } = await import("@capacitor/app");

      handle = (
        await App.addListener("appUrlOpen", async (evento: { url: string }) => {
          if (!evento.url.startsWith(ESQUEMA_RETORNO)) return;

          const { Browser } = await import("@capacitor/browser");
          Browser.close().catch(() => {});

          const url = new URL(evento.url);
          const codigo = url.searchParams.get("code");
          if (!codigo) {
            setErro("Não foi possível concluir o login com Google.");
            setCarregando(false);
            jaClicouRef.current = false;
            return;
          }

          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(codigo);
          if (error) {
            setErro(error.message);
            setCarregando(false);
            jaClicouRef.current = false;
            return;
          }
          // Etapa 158 — troquei de router.replace (navegação "leve" do
          // Next, sem recarregar a página) por isso: dentro da WebView
          // do Android, a sessão que acabou de ser gravada em cookie
          // pelo passo acima às vezes não ia junto a tempo na navegação
          // leve, e o middleware (que decide se deixa entrar no Painel)
          // via como se ninguém tivesse logado — voltava pro login sem
          // erro nenhum. Um recarregamento de verdade sempre manda os
          // cookies mais atuais que o navegador tem guardados.
          window.location.href = "/dashboard";
        })
      ) as unknown as { remove: () => void };
    })();

    return () => handle?.remove();
  }, []);

  async function aoClicar() {
    if (jaClicouRef.current) return;
    jaClicouRef.current = true;
    setErro(null);

    if (!estaNoAppNativo()) {
      // Site/PWA: nada muda, é a mesma Server Action de sempre.
      await entrarComGoogle();
      return;
    }

    setCarregando(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: ESQUEMA_RETORNO,
          skipBrowserRedirect: true, // a gente mesmo abre a URL abaixo, via Browser.open
        },
      });

      if (error || !data?.url) {
        setErro(error?.message ?? "Não foi possível iniciar o login com Google.");
        setCarregando(false);
        jaClicouRef.current = false;
        return;
      }

      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
      // Continua "carregando" até o appUrlOpen acima disparar — a
      // pessoa está com a aba do Google aberta por cima do app.
    } catch {
      setErro("Não foi possível iniciar o login com Google.");
      setCarregando(false);
      jaClicouRef.current = false;
    }
  }

  return (
    <div>
      {carregando && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-base-900">
          <div className="w-10 h-10 border-2 border-base-600 border-t-financa rounded-full animate-spin" />
          <p className="text-ink-400 text-sm">Entrando...</p>
        </div>
      )}
      <button
        type="button"
        onClick={aoClicar}
        disabled={carregando}
        className="w-full flex items-center justify-center gap-2 border border-base-600 rounded-lg py-2.5 hover:bg-base-800 transition text-sm disabled:opacity-60"
      >
        <GoogleIcon />
        {carregando ? "Abrindo..." : "Continuar com Google"}
      </button>
      {erro && (
        <p className="mt-2 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {erro}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.5 29.3 3.5 24 3.5c-7.6 0-14.2 4.3-17.6 10.6z" />
      <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-1.8 13.5-4.8l-6.2-5.3c-2 1.4-4.6 2.3-7.3 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.7 40 16.3 44.5 24 44.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.3C40.5 36.4 44.5 30.7 44.5 24c0-1.2-.1-2.3-.3-3.5z" />
    </svg>
  );
}
