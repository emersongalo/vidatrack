"use client";

import { useRef, useState, useEffect } from "react";

type Mensagem = { autor: "usuario" | "assistente"; texto: string };

const SUGESTOES = [
  "Como estão meus gastos esse mês?",
  "Vou estourar algum orçamento?",
  "Tenho alguma conta pra pagar essa semana?",
  "Tenho hábito ou tarefa pendente hoje?",
];

export function ChatAssistente() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const fimDaLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  async function enviar(texto: string) {
    if (!texto.trim() || carregando) return;
    setErro("");
    const novasMensagens: Mensagem[] = [...mensagens, { autor: "usuario", texto }];
    setMensagens(novasMensagens);
    setEntrada("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: novasMensagens }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro ?? "Algo deu errado.");
      } else {
        setMensagens((atual) => [...atual, { autor: "assistente", texto: dados.texto }]);
      }
    } catch {
      setErro("Falha de conexão. Tenta de novo.");
    }
    setCarregando(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {mensagens.length === 0 && (
          <div>
            <p className="text-sm text-ink-400 mb-3">
              Pergunte sobre seus gastos, orçamento, contas a pagar ou pendências de hoje.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="text-xs border border-base-600 rounded-full px-3 py-1.5 hover:border-financa hover:text-financa transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m, i) => (
          <div key={i} className={`flex ${m.autor === "usuario" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl2 px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.autor === "usuario"
                  ? "bg-ink-100 text-base-900"
                  : "bg-base-800 border border-base-600 text-ink-100"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start">
            <div className="bg-base-800 border border-base-600 rounded-xl2 px-4 py-2.5 text-sm text-ink-400">
              Pensando...
            </div>
          </div>
        )}

        {erro && <p className="text-xs text-red-400 text-center">{erro}</p>}
        <div ref={fimDaLista} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="flex gap-2 pt-3 border-t border-base-600"
      >
        <input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Pergunte algo sobre suas finanças..."
          disabled={carregando}
          className="flex-1 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-sm text-ink-100 focus:border-ink-100 outline-none transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={carregando || !entrada.trim()}
          className="bg-financa text-base-900 font-medium rounded-lg px-4 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
