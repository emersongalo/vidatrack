"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlternadorTema } from "@/components/AlternadorTema";
import { FotoPerfil } from "@/components/FotoPerfil";
import { sair } from "../login/actions";
import { Bell, Search } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { calcularPendencias } from "@/lib/notificacoes/calculo";
import { useFotoPerfilCache } from "@/lib/perfil/useFotoCache";
import { BlocosInicio } from "@/components/inicio/BlocosInicio";
import { NovidadesApp } from "@/components/NovidadesApp";
import { AvisoConquista } from "@/components/AvisoConquista";
import { ConvitesPendentes } from "@/components/ConvitesPendentes";
import { TourInicial } from "@/components/TourInicial";
import { BarraInferiorApp } from "@/components/BarraInferiorApp";
import { MenuLateralDesktop } from "@/components/MenuLateralDesktop";
import { TopoInicio } from "@/components/inicio/TopoInicio";
import { hojeISO } from "@/lib/habitos/streak";

// Etapa 133 — o Painel é pra onde todo botão "← Painel" do app aponta,
// então precisa abrir sem internet igual ao resto. A foto de perfil
// customizada e a checagem de "primeira vez" continuam vindo só
// quando há conexão (a foto usa uma chave que só pode ficar no
// servidor) — offline, mostra o ícone padrão e pula essa checagem,
// já que quem está usando offline já passou pela recepção antes.
export default function DashboardPage() {
  const router = useRouter();
  const { snapshot } = useSnapshotOffline();
  const urlFoto = useFotoPerfilCache();

  useEffect(() => {
    if (!navigator.onLine) return;
    fetch("/api/perfil/foto")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.onboardingConcluido === false) router.replace("/bem-vindo");
      })
      .catch(() => {});
  }, [router]);

  const nome = snapshot?.perfil.nome || snapshot?.perfil.email || "";
  const { tarefasVencidas, lembretesPassados, alertasCategoria } = calcularPendencias(snapshot);
  const temPendencia = tarefasVencidas.length > 0 || lembretesPassados.length > 0 || alertasCategoria.length > 0;

  // Etapa 195 — o widget "Pendências" agora é alimentado pelo SincronizadorWidgets (layout).

  const contas = snapshot?.financas.contas ?? [];
  // Etapa 224 — "Seu dia" (hábitos e tarefas de hoje)

  return (
    // Etapa 256 — no computador, menu lateral com Início · Hábitos · Finanças
    <div className="lg:pl-64">
      <MenuLateralDesktop
        corAtiva="inicio"
        submenu={
          <div className="space-y-1">
            <p className="px-3 pt-1 pb-1 text-xs uppercase tracking-wide text-ink-400">Atalhos</p>
            {[
              { href: "/financas/nova", rotulo: "➖ Novo gasto" },
              { href: "/financas/nova?tipo=receita", rotulo: "➕ Nova receita" },
              { href: "/habitos/novo", rotulo: "✅ Novo hábito" },
              { href: "/habitos/juntos", rotulo: "🌱 Juntos" },
              { href: "/notificacoes", rotulo: "🔔 Notificações" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="block rounded-xl px-3 py-2 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition">
                {a.rotulo}
              </Link>
            ))}
          </div>
        }
      />
    <main className="min-h-screen min-h-[100dvh] p-6 pb-28 md:p-12 md:pb-28 lg:pb-12 max-w-lg lg:max-w-5xl mx-auto flex flex-col">
      <header className="flex items-center justify-between mb-3 gap-3">
        {/* Etapa 287 — a saudação foi pro cartão do topo; aqui fica a foto e os atalhos */}
        <Link href="/perfil" className="flex items-center gap-2.5 min-w-0 rounded-full pr-3 hover:bg-base-800 transition">
          <span className="relative shrink-0">
            <FotoPerfil url={urlFoto} tamanho={40} className="rounded-full w-10 h-10 object-cover ring-2 ring-base-600" />
          </span>
          <span className="text-sm font-display font-semibold tracking-tight text-ink-400">VidaTrack</span>
        </Link>
        <div className="flex items-center gap-0.5 shrink-0 -mr-2">
          {/* Etapa 215 — busca geral */}
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
          >
            <Search size={18} strokeWidth={2} />
          </Link>
          <Link
            href="/notificacoes"
            aria-label="Notificações"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-base-800 transition"
          >
            <Bell size={18} strokeWidth={2} />
            {temPendencia && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400" />
            )}
          </Link>
          {/* Etapa 284 — no celular o tema fica em Perfil → Aparência (sobra espaço pro nome) */}
          <span className="hidden sm:contents">
            <AlternadorTema />
          </span>
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

      {/* Etapa 287 — topo novo: saudação com o céu da hora + hábitos, tarefas e gasto de hoje */}
      {snapshot && <TopoInicio snapshot={snapshot} hoje={hojeISO()} nome={nome} />}

      {/* Etapa 220 — novidades da versão (só pra quem já usa) e resumos escolhidos pela pessoa */}
      <NovidadesApp jaUsa={(snapshot?.habitos?.length ?? 0) > 0 || contas.length > 0} />
      {/* Etapa 221 — selo novo desbloqueado */}
      <AvisoConquista />
      {/* Etapa 279 — tour de boas-vindas pra conta nova */}
      <TourInicial
        contaVazia={
          !!snapshot && (snapshot.habitos?.length ?? 0) === 0 && contas.length === 0 && (snapshot.tarefas?.length ?? 0) === 0
        }
      />
      {/* Etapa 273 — convites de compartilhamento pra aceitar ou recusar */}
      <div className="mt-3 empty:hidden">
        <ConvitesPendentes />
      </div>

      {/* Etapa 287 — destaques (primeiro uso, mês em números, resumo do dia,
         retrospectiva) num carrossel de deslizar, em vez de empilhados */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-1 mt-1 scrollbar-none empty:hidden [&>*]:snap-start [&>*]:shrink-0 [&>*]:w-[84%] [&>*:only-child]:w-full [&>*]:!m-0 lista-entrar">
      {/* Etapa 201 — quem ainda não tem hábito ou conta ganha um atalho
         pro primeiro uso guiado (metade dos cadastros parou aqui). */}
      {snapshot && ((snapshot.habitos?.length ?? 0) === 0 || contas.length === 0) && (
        <Link
          href="/bem-vindo"
          className="flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-habito/40 bg-gradient-to-r from-habito/15 to-financa/10 hover:border-habito transition"
        >
          <span className="text-2xl">✨</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium">Deixe seu app pronto em 1 minuto</span>
            <span className="block text-xs text-ink-400">
              {(snapshot.habitos?.length ?? 0) === 0 ? "Escolha seus hábitos" : "Adicione seus bancos"}
              {(snapshot.habitos?.length ?? 0) === 0 && contas.length === 0 ? ", seus bancos" : ""} e um horário de lembrete
            </span>
          </span>
          <span className="text-ink-400">→</span>
        </Link>
      )}

      {/* Etapa 276 — primeiros 7 dias do mês: o mês que passou em números */}
      {snapshot && Number(hojeISO().slice(8, 10)) <= 7 && (
        <Link
          href="/retrospectiva/mes"
          className="flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-nota/40 bg-gradient-to-r from-nota/20 to-financa/10 hover:border-nota transition animate-surgir"
        >
          <span className="text-2xl animate-boiar">✨</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium">
              Seu mês de{" "}
              {new Date(Date.UTC(Number(hojeISO().slice(0, 4)), Number(hojeISO().slice(5, 7)) - 2, 15)).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" })} em números
            </span>
            <span className="block text-xs text-ink-400">Hábitos, tarefas e dinheiro — e como foi vs o mês anterior</span>
          </span>
          <span className="text-ink-400">→</span>
        </Link>
      )}
      {/* Etapa 276 — de noite, atalho pro resumo do dia */}
      {snapshot && new Date().getHours() >= 18 && (
        <Link
          href="/resumo-dia"
          className="flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-habito/30 bg-habito/10 hover:border-habito transition"
        >
          <span className="text-2xl">🌙</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium">Como foi seu dia</span>
            <span className="block text-xs text-ink-400">Hábitos, tarefas e gastos de hoje num lugar só</span>
          </span>
          <span className="text-ink-400">→</span>
        </Link>
      )}

      {/* Etapa 215 — retrospectiva em dezembro (do ano) e janeiro (do ano que passou) */}
      {(() => {
        const agora = new Date();
        const mes = agora.getMonth() + 1;
        if (mes !== 12 && mes !== 1) return null;
        const ano = mes === 12 ? agora.getFullYear() : agora.getFullYear() - 1;
        return (
          <Link
            href={`/retrospectiva?ano=${ano}`}
            className="flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-financa/40 bg-gradient-to-r from-nota/15 to-financa/15 hover:border-financa transition"
          >
            <span className="text-2xl">🎉</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium">Sua retrospectiva {ano}</span>
              <span className="block text-xs text-ink-400">Hábitos, dinheiro e humor do ano num lugar só</span>
            </span>
            <span className="text-ink-400">→</span>
          </Link>
        );
      })()}

      </div>

      {/* Etapa 224 — Painel novo: seu dia, atalhos, resumo e as áreas do app
         (o "trilho" vertical deixava metade da tela vazia no celular) */}
      {/* Etapa 235 — Início personalizável: hábitos, finanças ou os dois */}
      <div className="flex-1 mt-4">
        <BlocosInicio snapshot={snapshot} hoje={hojeISO()} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-2 mt-8">
        <Link href="/doacao" className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1">
          💛 Apoiar o projeto
        </Link>
        <Link href="/ajuda" className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1">
          Ajuda
        </Link>
        <Link href="/convidar" className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1">
          🎁 Convidar
        </Link>
        <Link href="/privacidade" className="text-xs text-ink-400 hover:text-ink-100 transition px-3 py-2.5 -m-1">
          Privacidade
        </Link>
      </div>
      {/* Etapa 230 — barra de baixo única */}
      <BarraInferiorApp />
    </main>
    </div>
  );
}
