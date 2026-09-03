"use client";

import { useState, useTransition } from "react";
import { LinkVoltar } from "@/components/LinkVoltar";
import { excluirContaPermanentemente } from "./actions";

export default function ExcluirContaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const [confirmacao, setConfirmacao] = useState("");
  const [pendente, iniciarTransicao] = useTransition();
  const podeExcluir = confirmacao.trim().toUpperCase() === "EXCLUIR";

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-sm mx-auto">
      <LinkVoltar href="/perfil" texto="Perfil" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2 text-red-400">Excluir conta</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <div className="bg-red-400/10 border border-red-400/30 rounded-xl2 p-4 mb-5 space-y-2">
        <p className="text-sm text-ink-100 font-medium">Isso é permanente e não tem volta.</p>
        <p className="text-sm text-ink-400">Ao excluir sua conta, apagamos para sempre:</p>
        <ul className="text-sm text-ink-400 list-disc list-inside space-y-0.5">
          <li>Todos os seus hábitos, tarefas e o histórico de check-ins</li>
          <li>Todas as suas notas e anexos</li>
          <li>Todas as suas contas, categorias e lançamentos financeiros</li>
          <li>Compartilhamentos (seus e os que você aceitou de outras pessoas)</li>
          <li>Seu perfil, foto, e o vínculo com Telegram/notificações</li>
        </ul>
      </div>

      <label htmlFor="confirmacao" className="block text-sm text-ink-400 mb-1.5">
        Pra confirmar, digite <span className="font-mono text-ink-100">EXCLUIR</span> abaixo:
      </label>
      <input
        id="confirmacao"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        placeholder="EXCLUIR"
        className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-red-400 outline-none transition mb-5"
      />

      <button
        onClick={() => podeExcluir && iniciarTransicao(() => excluirContaPermanentemente())}
        disabled={!podeExcluir || pendente}
        className="w-full bg-red-400 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pendente ? "Excluindo..." : "Excluir minha conta permanentemente"}
      </button>
    </main>
  );
}
