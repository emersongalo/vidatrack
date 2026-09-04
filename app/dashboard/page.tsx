import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { sair } from "../login/actions";
import { AlternadorTema } from "@/components/AlternadorTema";
import { resolverUrlFoto } from "@/lib/perfil/foto";
import { TrilhoMenu } from "@/components/TrilhoMenu";
import { ConfirmarSaidaApp } from "@/components/ConfirmarSaidaApp";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, foto_url")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const urlFoto = await resolverUrlFoto(perfil?.foto_url ?? null);

  // Prioriza o nome salvo em `perfis` (funciona tanto pra quem se
  // cadastrou por e-mail quanto por Google, desde a Etapa 31) — antes
  // isso só olhava um campo que o login com Google nunca preenchia.
  const nome = perfil?.nome || user?.email || "";

  return (
    <main className="h-screen h-[100dvh] overflow-hidden p-6 md:p-12 max-w-lg mx-auto flex flex-col">
      <header className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/perfil" className="shrink-0">
            {urlFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlFoto}
                alt=""
                width={36}
                height={36}
                className="rounded-lg w-9 h-9 object-cover"
              />
            ) : (
              <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-lg" />
            )}
          </Link>
          <div className="min-w-0">
            <p className="text-ink-400 text-xs">Olá,</p>
            <h1 className="text-lg font-display font-semibold truncate">{nome}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
          >
            🔔
          </Link>
          <AlternadorTema />
          <form action={sair}>
            <button
              aria-label="Sair"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <path
                  d="M10 17L15 12L10 7"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <TrilhoMenu />
      <ConfirmarSaidaApp />

      <div className="flex items-center justify-center gap-2 mt-2">
        <Link
          href="/doacao"
          className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1"
        >
          💛 Apoiar o projeto
        </Link>
        <Link
          href="/privacidade"
          className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1"
        >
          Privacidade
        </Link>
      </div>
    </main>
  );
}
