"use client";

import { useEffect } from "react";
import { salvarTokenFCM } from "@/app/notificacoes/actions";

export function RegistradorPushNativo() {
  useEffect(() => {
    // Esse componente é montado em todo lugar (inclusive no navegador
    // comum), mas só faz alguma coisa quando detecta que está rodando
    // dentro do app nativo empacotado pelo Capacitor — no navegador,
    // `Capacitor` nem existe no window, então some sozinho aqui.
    const capacitor = (window as any).Capacitor;
    if (!capacitor?.isNativePlatform?.()) return;

    let cancelado = false;

    async function registrar() {
      try {
        // Import dinâmico: só carrega esse pacote quando de fato
        // precisa dele (dentro do app nativo), então o navegador
        // comum nem baixa esse código à toa.
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const permissao = await PushNotifications.checkPermissions();
        let status = permissao.receive;
        if (status !== "granted") {
          const pedido = await PushNotifications.requestPermissions();
          status = pedido.receive;
        }
        if (status !== "granted" || cancelado) return;

        await PushNotifications.register();

        PushNotifications.addListener("registration", (token) => {
          salvarTokenFCM(token.value).catch(() => {});
        });

        PushNotifications.addListener("registrationError", (erro) => {
          console.error("Erro ao registrar push nativo:", erro);
        });
      } catch {
        // @capacitor/push-notifications não instalado/sincronizado
        // ainda — não quebra nada, só não registra.
      }
    }

    registrar();
    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
