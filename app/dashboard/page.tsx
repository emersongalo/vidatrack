import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "../login/actions";
import { AlternadorTema } from "@/components/AlternadorTema";
import { resolverUrlFoto } from "@/lib/perfil/foto";
import { TrilhoMenu } from "@/components/TrilhoMenu";
import { ConfirmarSaidaApp } from "@/components/ConfirmarSaidaApp";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { Bell } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, foto_url, onboarding_concluido")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  // Manda pra tela de boas-vindas quem ainda não passou por ela —
  // pega todo mundo de uma vez só (login por e-mail, Google, ou
  // verificação de e-mail), já que todos caem aqui no final.
  if (perfil && !perfil.onboarding_concluido) {
    redirect("/bem-vindo");
  }

  const urlFoto = await resolverUrlFoto(perfil?.foto_url ?? null);

  // Prioriza o nome salvo em `perfis` (funciona tanto pra quem se
  // cadastrou por e-mail quanto por Google, desde a Etapa 31) — antes
  // isso só olhava um campo que o login com Google nunca preenchia.
  const nome = perfil?.nome || user?.email || "";

  // Resumo rápido, só pra quem tem tela larga (desktop) — no celular
  // continua igual, essa tela é de propósito só o trilho, sem rolar.
  const [{ data: contas }, { data: transacoesMes }] = await Promise.all([
    supabase.from("financa_contas").select("id, saldo_inicial, tipo").eq("arquivado", false),
    supabase
      .from("financa_transacoes")
      .select("conta_id, tipo, valor")
      .gte("data", new Date().toLocaleDateString("sv-SE").slice(0, 8) + "01"),
  ]);

  const contasComuns = (contas ?? []).filter((c) => c.tipo !== "investimento");
  const saldoAtual = contasComuns.reduce((total, conta) => {
    const doTransacoes = (transacoesMes ?? [])
      .filter((t) => t.conta_id === conta.id)
      .reduce((acc, t) => acc + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)), 0);
    return total + Number(conta.saldo_inicial) + doTransacoes;
  }, 0);

  return (
    <main className="h-screen h-[100dvh] overflow-hidden p-6 md:p-12 max-w-lg lg:max-w-3xl mx-auto flex flex-col">
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
            <Bell size={18} strokeWidth={2} />
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

      <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_240px] lg:gap-6">
      <TrilhoMenu />
      <ConfirmarSaidaApp />

      <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:pt-2">
        <Link
          href="/habitos/estatisticas"
          className="bg-base-800 border border-base-600 rounded-xl2 p-4 hover:border-habito transition"
        >
          <p className="text-xs text-ink-400 mb-1">Hábitos</p>
          <p className="text-sm">Ver estatísticas →</p>
        </Link>
        <Link
          href="/financas"
          className="bg-base-800 border border-base-600 rounded-xl2 p-4 hover:border-financa transition"
        >
          <p className="text-xs text-ink-400 mb-1">Saldo em contas</p>
          <p className={`text-xl font-mono font-semibold ${saldoAtual < 0 ? "text-red-400" : ""}`}>
            {formatarMoeda(saldoAtual)}
          </p>
        </Link>
      </div>
      </div>

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
