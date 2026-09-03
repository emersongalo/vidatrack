"use client";

import { useEffect } from "react";
import { salvarSnapshotOffline } from "@/lib/offline/snapshot";

// A cada quantas horas tenta atualizar o retrato offline de novo,
// mesmo que a pessoa não tenha feito login de novo nesse meio tempo.
const INTERVALO_ATUALIZACAO_HORAS = 6;
const CHAVE_ULTIMA_TENTATIVA = "vidatrack-ultima-tentativa-snapshot";

export function BaixadorOfflineAutomatico() {
  useEffect(() => {
    async function baixar() {
      if (!navigator.onLine) return;

      try {
        const resposta = await fetch("/api/offline/baixar-tudo");
        if (!resposta.ok) return; // provavelmente deslogado — sem problema, tenta de novo depois
        const dados = await resposta.json();
        salvarSnapshotOffline(dados);
        localStorage.setItem(CHAVE_ULTIMA_TENTATIVA, String(Date.now()));
      } catch {
        // Sem internet de verdade, ou o servidor está fora — não é
        // grave, o retrato antigo (se existir) continua servindo.
      }
    }

    const ultimaTentativa = Number(localStorage.getItem(CHAVE_ULTIMA_TENTATIVA) ?? "0");
    const horasDesdeUltima = (Date.now() - ultimaTentativa) / 1000 / 60 / 60;

    if (horasDesdeUltima > INTERVALO_ATUALIZACAO_HORAS) {
      baixar();
    }

    // Também tenta sempre que a conexão volta, pra manter o retrato
    // razoavelmente atualizado sem esperar as 6 horas passarem.
    window.addEventListener("online", baixar);
    return () => window.removeEventListener("online", baixar);
  }, []);

  return null;
}
