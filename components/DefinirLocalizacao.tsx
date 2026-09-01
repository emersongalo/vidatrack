"use client";

import { useState, useTransition } from "react";
import { salvarLocalizacao } from "@/app/dashboard/actions";

type Cidade = { nome: string; latitude: number; longitude: number };

export function DefinirLocalizacao() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Cidade[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState("");

  async function buscarCidades() {
    if (busca.trim().length < 2) return;
    setBuscando(true);
    setErro("");
    try {
      const resposta = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(busca)}&count=5&language=pt`
      );
      const dados = await resposta.json();
      setResultados(
        (dados.results ?? []).map((r: any) => ({
          nome: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
          latitude: r.latitude,
          longitude: r.longitude,
        }))
      );
    } catch {
      setErro("Não foi possível buscar. Tenta de novo.");
    }
    setBuscando(false);
  }

  function escolherCidade(cidade: Cidade) {
    iniciarTransicao(() => {
      salvarLocalizacao(cidade.latitude, cidade.longitude, cidade.nome);
    });
  }

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setErro("Seu navegador não suporta geolocalização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        iniciarTransicao(() => {
          salvarLocalizacao(posicao.coords.latitude, posicao.coords.longitude, "Sua localização");
        });
      },
      () => setErro("Não deu pra acessar sua localização. Tenta buscar pelo nome da cidade.")
    );
  }

  return (
    <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
      <p className="text-sm font-medium mb-1">Ver a previsão do tempo</p>
      <p className="text-xs text-ink-400 mb-3">Defina sua cidade pra ver o clima aqui.</p>

      <button
        onClick={usarLocalizacaoAtual}
        disabled={pendente}
        className="text-xs border border-base-600 rounded-lg px-3 py-1.5 hover:bg-base-700 transition mb-3 disabled:opacity-50"
      >
        📍 Usar minha localização atual
      </button>

      <div className="flex gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscarCidades()}
          placeholder="Ou digite o nome da cidade"
          className="flex-1 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-ink-100 transition"
        />
        <button
          onClick={buscarCidades}
          disabled={buscando}
          className="text-sm border border-base-600 rounded-lg px-3 py-2 hover:bg-base-700 transition shrink-0"
        >
          {buscando ? "..." : "Buscar"}
        </button>
      </div>

      {erro && <p className="text-xs text-red-400 mt-2">{erro}</p>}

      {resultados.length > 0 && (
        <ul className="mt-2 space-y-1">
          {resultados.map((c, i) => (
            <li key={i}>
              <button
                onClick={() => escolherCidade(c)}
                disabled={pendente}
                className="text-sm text-left w-full px-2 py-1.5 rounded hover:bg-base-700 transition disabled:opacity-50"
              >
                {c.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
