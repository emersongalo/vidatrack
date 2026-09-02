"use client";

import { useEffect, useState, useTransition } from "react";
import { salvarLocalizacao } from "@/app/dashboard/actions";

export function DefinirLocalizacao() {
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState("");
  const [semSuporte, setSemSuporte] = useState(false);

  function pedirLocalizacao() {
    setErro("");
    if (!navigator.geolocation) {
      setSemSuporte(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        iniciarTransicao(() => {
          salvarLocalizacao(posicao.coords.latitude, posicao.coords.longitude, "Sua localização");
        });
      },
      (erroGeo) => {
        if (erroGeo.code === erroGeo.PERMISSION_DENIED) {
          setErro("Localização bloqueada. Ative nas permissões do navegador pra ver o clima aqui.");
        } else {
          setErro("Não foi possível pegar sua localização agora. Tenta de novo em instantes.");
        }
      }
    );
  }

  useEffect(() => {
    // Se a permissão já tinha sido concedida antes (ex: voltou depois
    // de já ter aceitado uma vez), busca sozinho, sem precisar de
    // outro clique.
    if (!navigator.geolocation) {
      setSemSuporte(true);
      return;
    }
    if (!("permissions" in navigator)) return;

    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (status.state === "granted") pedirLocalizacao();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <p className="text-sm font-medium mb-1">Ver a previsão do tempo</p>
      <p className="text-xs text-ink-400 mb-3">
        Precisamos da sua localização pra mostrar o clima aqui.
      </p>

      {semSuporte ? (
        <p className="text-xs text-red-400">
          Seu navegador não suporta compartilhar localização.
        </p>
      ) : (
        <button
          onClick={pedirLocalizacao}
          disabled={pendente}
          className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {pendente ? "Buscando..." : "📍 Permitir localização"}
        </button>
      )}

      {erro && <p className="text-xs text-red-400 mt-3">{erro}</p>}
    </div>
  );
}
