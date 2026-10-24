"use client";

// Etapa 355 — telas que precisam MESMO de internet (IA, importar, convidar,
// compartilhar…): sem conexão, avisa logo no topo, em vez de deixar a
// pessoa preencher tudo e dar erro no fim.
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function AvisoPrecisaInternet({ texto = "Essa tela precisa de internet. O resto do app continua funcionando sem conexão." }: { texto?: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const atualizar = () => setOffline(navigator.onLine === false);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="mb-4 flex items-start gap-2.5 rounded-2xl border border-financa/40 bg-financa/10 px-4 py-3 text-sm text-ink-100">
      <WifiOff size={18} className="mt-0.5 shrink-0 text-financa" />
      <span>{texto}</span>
    </div>
  );
}
