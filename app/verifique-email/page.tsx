"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { reenviarConfirmacao } from "@/app/login/actions";

export default function VerifiqueEmailPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function Conteudo() {
  const email = useSearchParams().get("email");
  const [status, setStatus] = useState<"parado" | "enviando" | "enviado" | { erro: string }>("parado");

  async function reenviar() {
    if (!email) return;
    setStatus("enviando");
    const resultado = await reenviarConfirmacao(email);
    setStatus(resultado.erro ? { erro: resultado.erro } : "enviado");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-habito-soft border border-habito/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-habito text-xl">✓</span>
        </div>
        <h1 className="text-xl font-display font-semibold mb-2">
          Confira seu e-mail
        </h1>
        <p className="text-ink-400 text-sm">
          Enviamos um link de confirmação{email && <> pra <span className="text-ink-100">{email}</span></>}.
          Abra sua caixa de entrada (e o spam) e clique no link para ativar sua conta.
        </p>

        {/* Etapa 186 — pra quem digitou o e-mail errado sem querer ou
           o link foi pro spam/demorou, reenviar de novo sem ter que
           preencher o cadastro inteiro de novo. */}
        {email && (
          <div className="mt-5">
            <button
              onClick={reenviar}
              disabled={status === "enviando" || status === "enviado"}
              className="text-sm border border-base-600 rounded-lg px-4 py-2 hover:border-ink-400 transition disabled:opacity-50"
            >
              {status === "enviando" ? "Enviando..." : status === "enviado" ? "Reenviado ✓" : "Não chegou? Reenviar"}
            </button>
            {typeof status === "object" && (
              <p className="mt-2 text-xs text-red-400">{status.erro}</p>
            )}
          </div>
        )}

        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-ink-400 hover:text-ink-100 transition"
        >
          ← Voltar para o login
        </Link>
      </div>
    </main>
  );
}
