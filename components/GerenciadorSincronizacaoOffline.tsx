"use client";

import { useEffect, useState } from "react";
import { processarFilaSincronizacao, EVENTO_SYNC_RECUSADO } from "@/lib/offline/processarFila";
import { EVENTO_SINCRONIZAR_AGORA } from "@/lib/local/financas";
import { lerFila, EVENTO_FILA_MUDOU } from "@/lib/offline/fila";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import Link from "next/link";

export const EVENTO_SINCRONIZACAO_CONCLUIDA = "vidatrack:sincronizacao-concluida";

export function GerenciadorSincronizacaoOffline() {
  const [status, setStatus] = useState<"idle" | "sincronizando" | "concluido" | "erro">("idle");
  const [quantidadePendente, setQuantidadePendente] = useState(0);
  const [recusado, setRecusado] = useState<string | null>(null);
  const [semRede, setSemRede] = useState(false);

  useEffect(() => {
    setQuantidadePendente(lerFila().length);

    async function sincronizar(silencioso = false) {
      if (lerFila().length === 0) return;
      if (!silencioso) setStatus("sincronizando");
      const resultado = await processarFilaSincronizacao();
      setQuantidadePendente(resultado.restantes);
      // Etapa 344 — envio "de fundo" (lançou com internet) não mostra aviso nenhum
      if (!silencioso || resultado.comErro) setStatus(resultado.comErro ? "erro" : "concluido");

      if (resultado.processados > 0) {
        window.dispatchEvent(new CustomEvent(EVENTO_SINCRONIZACAO_CONCLUIDA, { detail: resultado }));
        // Etapa 343 — traz o retrato novo (com o que foi criado offline já com o id de verdade)
        void atualizarSnapshotEmTodasAsTelas();
      }

      setTimeout(() => setStatus("idle"), 3000);
    }

    function aoFicarOnline() {
      sincronizar();
    }

    // Etapa 276 — contagem ao vivo (antes só era lida ao abrir o app)
    const aoMudarFila = (e: Event) => setQuantidadePendente(Number((e as CustomEvent<number>).detail) || 0);
    window.addEventListener(EVENTO_FILA_MUDOU, aoMudarFila);
    // Etapa 344 — salvou algo no aparelho com internet: sobe logo (sem alarde)
    let espera: ReturnType<typeof setTimeout> | null = null;
    const aoPedirAgora = () => {
      if (espera) clearTimeout(espera);
      espera = setTimeout(() => void sincronizar(true), 400);
    };
    window.addEventListener(EVENTO_SINCRONIZAR_AGORA, aoPedirAgora);
    const aoRecusar = (e: Event) => {
      setRecusado(String((e as CustomEvent<string>).detail || "O servidor recusou uma alteração."));
      setTimeout(() => setRecusado(null), 7000);
    };
    window.addEventListener(EVENTO_SYNC_RECUSADO, aoRecusar);
    // Etapa 355 — rede de segurança: alguma ação que ainda depende do
    // servidor falhou por falta de internet e ninguém tratou o erro →
    // avisa com clareza (em vez de a tela "não fazer nada")
    const aoErroSolto = (e: PromiseRejectionEvent) => {
      const msg = String((e.reason as any)?.message ?? e.reason ?? "");
      if (navigator.onLine === false || /failed to fetch|network|load failed|fetch failed/i.test(msg)) {
        setSemRede(true);
        setTimeout(() => setSemRede(false), 5000);
      }
    };
    window.addEventListener("unhandledrejection", aoErroSolto);
    window.addEventListener("online", aoFicarOnline);
    // Se abriu o app já online com algo pendente da última vez (ex:
    // fechou o app sem sincronizar), tenta logo de cara também.
    if (navigator.onLine) sincronizar();

    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener(EVENTO_FILA_MUDOU, aoMudarFila);
      window.removeEventListener(EVENTO_SINCRONIZAR_AGORA, aoPedirAgora);
      window.removeEventListener(EVENTO_SYNC_RECUSADO, aoRecusar);
      window.removeEventListener("unhandledrejection", aoErroSolto);
    };
  }, []);

  if (semRede && !recusado)
    return (
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
        <div className="max-w-md bg-base-800 border border-financa/40 rounded-2xl px-4 py-2.5 text-xs shadow-lg animate-surgir">
          📴 Sem internet: essa ação precisa de conexão. Tente de novo quando a internet voltar.
        </div>
      </div>
    );
  if (recusado)
    return (
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
        <div className="max-w-md bg-base-800 border border-red-400/40 rounded-2xl px-4 py-2.5 text-xs shadow-lg animate-surgir">⚠️ Não foi salvo no servidor: {recusado}</div>
      </div>
    );
  if (status === "idle" && quantidadePendente === 0) return null;
  // Etapa 344 — com internet, o que está na fila sobe em segundos: não precisa do selo
  if (status === "idle" && typeof navigator !== "undefined" && navigator.onLine) return null;
  // sem internet, quem mostra o contador é o aviso de conexão (lá em cima)
  if (status === "idle" && typeof navigator !== "undefined" && !navigator.onLine) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      {/* Etapa 358 — toca pra ver o que está esperando */}
      <Link href="/sincronizar" className="pointer-events-auto bg-base-800 border border-base-600 rounded-full px-4 py-2 text-xs shadow-lg flex items-center gap-2 animate-surgir">
        {status === "sincronizando" && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-financa animate-pulse" />
            Sincronizando o que você fez offline...
          </>
        )}
        {status === "concluido" && <>✅ Tudo sincronizado</>}
        {status === "erro" && <>⚠️ Algumas alterações ainda não sincronizaram — vai tentar de novo</>}
        {status === "idle" && quantidadePendente > 0 && (
          <>📦 {quantidadePendente} {quantidadePendente === 1 ? "alteração esperando" : "alterações esperando"} pra sincronizar</>
        )}
      </Link>
    </div>
  );
}
