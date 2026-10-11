"use client";

// Etapa 296 — quem abre o VidaTrack pelo ícone da tela de início (PWA) e
// ainda não entrou nele cai aqui na apresentação; manda direto pro login,
// que explica que é só entrar uma vez.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ehAppDaTelaInicial } from "@/lib/app/appInstalado";

export function RedirecionarAppInstalado() {
  const router = useRouter();
  useEffect(() => {
    if (ehAppDaTelaInicial()) router.replace("/login?app=1");
  }, [router]);
  return null;
}
