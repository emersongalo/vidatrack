"use client";

import { useRef, useState, useEffect } from "react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { interpretarPergunta, type RespostaAssistente } from "@/lib/assistente/interpretar";
import { adicionarNaFila } from "@/lib/offline/fila";
import { processarFilaSincronizacao } from "@/lib/offline/processarFila";

type Mensagem =
  | { autor: "usuario"; texto: string }
  | { autor: "assistente"; resposta: RespostaAssistente; confirmado?: boolean };

const SUGESTOES = [
  "Como estão meus gastos esse mês?",
  "Vou estourar algum orçamento?",
  "Tenho alguma conta pra pagar essa semana?",
  "Tenho hábito ou tarefa pendente hoje?",
];

/**
 * Etapa 142 — antes chamava a API paga da Anthropic (/api/assistente).
 * Trocado pelo caminho 100% gratuito: um "cérebro" baseado em
 * palavras-chave (lib/assistente/interpretar.ts) rodando aqui mesmo,
 * no navegador, usando o retrato local — sem custo de API nenhum, e
 * funciona offline também.
 */
export function ChatAssistente() {
  const { snapshot } = useSnapshotOffline();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const fimDaLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  function enviar(texto: string) {
    if (!texto.trim() || !snapshot) return;
    const resposta = interpretarPergunta(texto, snapshot);
    setMensagens((atual) => [...atual, { autor: "usuario", texto }, { autor: "assistente", resposta }]);
    setEntrada("");
  }

  function confirmarLancamento(indice: number, dados: { tipo: "despesa" | "receita"; valor: string; descricao: string | null }) {
    const contaPadrao = snapshot?.financas.contas.find((c: any) => c.tipo !== "investimento");
    if (!contaPadrao) return;

    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_transacao",
      dados: {
        tipo: dados.tipo,
        valor: dados.valor,
        contaId: contaPadrao.id,
        categoriaId: "",
        descricao: dados.descricao ?? "",
        data: new Date().toLocaleDateString("sv-SE"),
      },
    } as any);
    processarFilaSincronizacao().catch(() => {});

    setMensagens((atual) =>
      atual.map((m, i) => (i === indice && m.autor === "assistente" ? { ...m, confirmado: true } : m))
    );
    setMensagens((atual) => [
      ...atual,
      { autor: "assistente", resposta: { tipo: "texto", texto: "Lançado! ✅ (sincroniza sozinho quando houver internet, se estiver offline agora)" } },
    ]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {mensagens.length === 0 && (
          <div>
            <p className="text-sm text-ink-400 mb-3">
              Pergunte sobre seus gastos, orçamento, contas a pagar ou pendências de hoje — ou peça pra eu
              lançar algo, tipo "gastei 20 reais no mercado".
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
            {m.autor === "usuario" ? (
              <div className="max-w-[85%] rounded-xl2 px-4 py-2.5 text-sm whitespace-pre-wrap bg-ink-100 text-base-900">
                {m.texto}
              </div>
            ) : (
              <div className="max-w-[85%] rounded-xl2 px-4 py-2.5 text-sm whitespace-pre-wrap bg-base-800 border border-base-600 text-ink-100">
                {m.resposta.texto}
                {m.resposta.tipo === "proposta_lancamento" && !m.confirmado && (() => {
                  const dadosLancamento = m.resposta.dados;
                  return (
                    <button
                      onClick={() => confirmarLancamento(i, dadosLancamento)}
                      className="mt-2.5 block bg-financa text-base-900 text-xs font-medium rounded-lg px-3 py-2 hover:opacity-90 transition"
                    >
                      Confirmar lançamento
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        ))}

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
          className="flex-1 bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <button
          type="submit"
          disabled={!entrada.trim()}
          className="bg-financa text-base-900 font-medium rounded-lg px-4 py-2.5 text-sm hover:opacity-90 transition disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
