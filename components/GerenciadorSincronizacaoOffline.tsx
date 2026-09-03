"use client";

import { useEffect, useState } from "react";
import { processarFilaSincronizacao } from "@/lib/offline/processarFila";
import { lerFila } from "@/lib/offline/fila";

export const EVENTO_SINCRONIZACAO_CONCLUIDA = "vidatrack:sincronizacao-concluida";

export function GerenciadorSincronizacaoOffline() {
  const [status, setStatus] = useState<"idle" | "sincronizando" | "concluido" | "erro">("idle");
  const [quantidadePendente, setQuantidadePendente] = useState(0);

  useEffect(() => {
    setQuantidadePendente(lerFila().length);

    async function sincronizar() {
      if (lerFila().length === 0) return;
      setStatus("sincronizando");
      const resultado = await processarFilaSincronizacao();
      setQuantidadePendente(resultado.restantes);
      setStatus(resultado.comErro ? "erro" : "concluido");

      if (resultado.processados > 0) {
        window.dispatchEvent(new CustomEvent(EVENTO_SINCRONIZACAO_CONCLUIDA, { detail: resultado }));
      }

      setTimeout(() => setStatus("idle"), 3000);
    }

    function aoFicarOnline() {
      sincronizar();
    }

    window.addEventListener("online", aoFicarOnline);
    // Se abriu o app já online com algo pendente da última vez (ex:
    // fechou o app sem sincronizar), tenta logo de cara também.
    if (navigator.onLine) sincronizar();

    return () => window.removeEventListener("online", aoFicarOnline);
  }, []);

  if (status === "idle" && quantidadePendente === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="bg-base-800 border border-base-600 rounded-full px-4 py-2 text-xs shadow-lg flex items-center gap-2">
        {status === "sincronizando" && (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-financa animate-pulse" />
            Sincronizando o que você fez offline...
          </>
        )}
        {status === "concluido" && <>✅ Tudo sincronizado</>}
        {status === "erro" && <>⚠️ Algumas alterações ainda não sincronizaram — vai tentar de novo</>}
        {status === "idle" && quantidadePendente > 0 && (
          <>📦 {quantidadePendente} ação(ões) esperando conexão pra sincronizar</>
        )}
      </div>
    </div>
  );
}
