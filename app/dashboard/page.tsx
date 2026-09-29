"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlternadorTema } from "@/components/AlternadorTema";
import { TrilhoMenu } from "@/components/TrilhoMenu";
import { ConfirmarSaidaApp } from "@/components/ConfirmarSaidaApp";
import { FotoPerfil } from "@/components/FotoPerfil";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { sair } from "../login/actions";
import { Bell, Search } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { calcularPendencias } from "@/lib/notificacoes/calculo";
import { useFotoPerfilCache } from "@/lib/perfil/useFotoCache";
import { NovidadesApp } from "@/components/NovidadesApp";
import { PainelCartoes } from "@/components/PainelCartoes";
import { AvisoConquista } from "@/components/AvisoConquista";

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
  const contasComuns = contas.filter((c: any) => c.tipo !== "investimento" && c.tipo !== "cartao");
  const saldoAtual = contasComuns.reduce((total: number, c: any) => total + Number(c.saldo), 0);

  return (
    <main className="min-h-screen min-h-[100dvh] p-6 md:p-12 max-w-lg lg:max-w-5xl mx-auto flex flex-col">
      <header className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/perfil" className="shrink-0">
            <FotoPerfil url={urlFoto} tamanho={36} className="rounded-lg w-9 h-9" />
          </Link>
          <div className="min-w-0">
            <p className="text-ink-400 text-xs">Olá,</p>
            <h1 className="text-lg font-display font-semibold truncate">{nome}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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

      {/* Etapa 220 — novidades da versão (só pra quem já usa) e resumos escolhidos pela pessoa */}
      <NovidadesApp jaUsa={(snapshot?.habitos?.length ?? 0) > 0 || contas.length > 0} />
      <PainelCartoes />
      {/* Etapa 221 — selo novo desbloqueado */}
      <AvisoConquista />

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

      <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
        <TrilhoMenu />
        <ConfirmarSaidaApp />

        <div className="hidden lg:flex lg:flex-col lg:gap-3 lg:pt-2">
          <Link
            href="/habitos/estatisticas"
            className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4 hover:border-habito transition"
          >
            <p className="text-xs text-ink-400 mb-1">Hábitos</p>
            <p className="text-sm">Ver estatísticas →</p>
          </Link>
          <Link
            href="/financas"
            className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4 hover:border-financa transition"
          >
            <p className="text-xs text-ink-400 mb-1">Saldo em contas</p>
            <p className={`text-xl font-mono font-semibold ${saldoAtual < 0 ? "text-red-400" : ""}`}>
              {formatarMoeda(saldoAtual)}
            </p>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
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
    </main>
  );
}
