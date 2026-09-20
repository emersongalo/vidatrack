"use client";

import Link from "next/link";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";

/**
 * Etapa 145 — essa tela ficou bem menor de propósito. Até a Etapa
 * 125, ela tinha sua própria versão paralela (e reduzida) de Hoje,
 * Hábitos, Finanças etc., porque as telas de verdade ainda
 * dependiam do servidor pra abrir. Desde as Etapas 126-134, as telas
 * REAIS (as mesmas de sempre — /habitos, /financas, etc.) já
 * funcionam sozinhas offline, lendo o mesmo retrato local que essa
 * página também usava. Manter as duas versões seria manter duas
 * fontes da verdade — daí a confusão de "por que as abas aqui são
 * menos que as de verdade".
 *
 * Essa tela agora só existe pro caso raríssimo de nem o app ter
 * conseguido guardar a tela de Hoje ainda (célula 1 de conexão que
 * caiu bem no meio da primeira abertura, por exemplo) — o Service
 * Worker (public/sw.js) tenta abrir a tela real de Hoje sozinho
 * antes de cair aqui.
 */
export default function OfflinePage() {
  const snapshot = lerSnapshotOffline();

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-3xl mb-3">📡</p>
        <h1 className="text-xl font-display font-semibold mb-2">Sem conexão</h1>
        <p className="text-ink-400 text-sm max-w-xs mx-auto mb-6">
          {snapshot
            ? "As telas do app já guardam seus dados e funcionam sozinhas offline — só essa tela específica não conseguiu abrir agora. Tenta de novo:"
            : "Ainda não deu tempo de guardar seus dados pra uso offline. Abra o app pelo menos uma vez com internet e espere alguns segundos — da próxima vez, funciona mesmo sem conexão."}
        </p>
        {snapshot && (
          <Link
            href="/habitos"
            className="inline-block bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2.5 hover:opacity-90 transition"
          >
            Ir pra Hoje
          </Link>
        )}
      </div>
    </main>
  );
}
