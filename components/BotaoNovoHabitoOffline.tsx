"use client";

import { useState } from "react";
import Link from "next/link";
import { adicionarNaFila } from "@/lib/offline/fila";

const ICONES_RAPIDOS = ["💧", "🏃", "📖", "🧘", "🙏", "💪", "❤️", "🎯"];
const CORES_RAPIDAS = [
  { valor: "habito", classe: "bg-habito" },
  { valor: "rosa", classe: "bg-[#E5567A]" },
  { valor: "azul", classe: "bg-[#4C8FCC]" },
  { valor: "roxo", classe: "bg-[#8B5CF6]" },
];

export function BotaoNovoHabitoOffline() {
  const [modoOffline, setModoOffline] = useState(false);
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState(ICONES_RAPIDOS[0]);
  const [cor, setCor] = useState("habito");
  const [criado, setCriado] = useState(false);

  function aoClicar(e: React.MouseEvent) {
    if (navigator.onLine) return; // deixa o link normal ir pro formulário completo
    e.preventDefault();
    setModoOffline(true);
  }

  function salvarOffline() {
    if (!nome.trim()) return;
    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_habito",
      dados: { nome: nome.trim(), icone, cor },
    });
    setCriado(true);
    setTimeout(() => {
      setModoOffline(false);
      setCriado(false);
      setNome("");
    }, 1800);
  }

  if (modoOffline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-sm w-full">
          {criado ? (
            <p className="text-sm text-habito">📦 Guardado — vai aparecer assim que a internet voltar.</p>
          ) : (
            <>
              <p className="text-sm text-ink-400 mb-3">
                Sem conexão — cria um hábito simples agora (dá pra ajustar detalhes depois, quando
                a internet voltar).
              </p>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do hábito"
                autoFocus
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-ink-100 transition"
              />
              <div className="flex gap-1.5 mb-3">
                {ICONES_RAPIDOS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcone(ic)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base border transition ${
                      icone === ic ? "border-ink-100 bg-base-700" : "border-base-600"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                {CORES_RAPIDAS.map((c) => (
                  <button
                    key={c.valor}
                    onClick={() => setCor(c.valor)}
                    className={`w-7 h-7 rounded-full ${c.classe} ${
                      cor === c.valor ? "ring-2 ring-offset-2 ring-offset-base-800 ring-ink-100" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModoOffline(false)}
                  className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarOffline}
                  disabled={!nome.trim()}
                  className="flex-1 bg-ink-100 text-base-900 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/habitos/novo"
      onClick={aoClicar}
      className="bg-ink-100 text-base-900 text-sm font-medium rounded-lg px-4 py-2 hover:opacity-90 transition"
    >
      + Novo
    </Link>
  );
}
