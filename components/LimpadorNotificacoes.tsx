"use client";

// Etapa 328 — tira da barra de notificações os lembretes do que você já
// fez hoje (hábito marcado, tarefa concluída). Roda ao abrir o app, ao
// voltar pra ele e sempre que o retrato de dados é atualizado.
import { useEffect } from "react";
import { EVENTO_SNAPSHOT } from "@/lib/offline/useSnapshot";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { inicioDosTitulosFeitos, tituloJaFeito } from "@/lib/notificacoes/limpar";

async function limpar() {
  const inicios = inicioDosTitulosFeitos(lerSnapshotOffline() as any, hojeISO());
  if (!inicios.length) return;
  const cap = (window as any).Capacitor;
  // app Android (notificações nativas)
  if (cap?.isNativePlatform?.()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { notifications } = await PushNotifications.getDeliveredNotifications();
      const sair = notifications.filter((n) => tituloJaFeito(n.title, inicios));
      if (sair.length) await PushNotifications.removeDeliveredNotifications({ notifications: sair });
    } catch {}
    return;
  }
  // navegador / app da tela de início (Web Push)
  try {
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const lista = (await reg?.getNotifications?.()) ?? [];
    for (const n of lista) if (tituloJaFeito(n.title, inicios)) n.close();
  } catch {}
}

export function LimpadorNotificacoes() {
  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | null = null;
    const agendar = () => {
      if (espera) clearTimeout(espera);
      espera = setTimeout(() => void limpar(), 600);
    };
    const visivel = () => document.visibilityState === "visible" && agendar();
    agendar();
    window.addEventListener(EVENTO_SNAPSHOT, agendar);
    document.addEventListener("visibilitychange", visivel);
    return () => {
      if (espera) clearTimeout(espera);
      window.removeEventListener(EVENTO_SNAPSHOT, agendar);
      document.removeEventListener("visibilitychange", visivel);
    };
  }, []);
  return null;
}
