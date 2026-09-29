"use client";

import { useRef, useState, useEffect } from "react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { interpretarPergunta, type RespostaAssistente } from "@/lib/assistente/interpretar";
import { adicionarNaFila } from "@/lib/offline/fila";
import { processarFilaSincronizacao } from "@/lib/offline/processarFila";

type Mensagem =
  | { autor: "usuario"; texto: string }
  | { autor: "assistente"; resposta: RespostaAssistente; confirmado?: boolean };

const CHAVE_CONVERSA = "vidatrack-conversa-assistente";

const SUGESTOES = [
  "Como estão meus gastos esse mês?",
  "Quanto gastei com mercado mês passado?",
  "Qual minha previsão pro fim do mês?",
  "Alguma categoria subiu muito?",
  "Qual minha melhor sequência de hábito?",
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
  const [carregou, setCarregou] = useState(false);

  // Etapa 220 — a conversa fica guardada neste aparelho (últimas 40 mensagens)
  useEffect(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem(CHAVE_CONVERSA) || "[]");
      if (Array.isArray(salvas)) setMensagens(salvas);
    } catch {}
    setCarregou(true);
  }, []);
  useEffect(() => {
    if (!carregou) return;
    try {
      localStorage.setItem(CHAVE_CONVERSA, JSON.stringify(mensagens.slice(-40)));
    } catch {}
  }, [mensagens, carregou]);
  const [entrada, setEntrada] = useState("");
  const lista = useRef<HTMLDivElement>(null);

  // Etapa 219 — rola só a conversa (scrollIntoView rolava a página toda)
  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [mensagens]);

  function enviar(texto: string) {
    if (!texto.trim() || !snapshot) return;
    const resposta = interpretarPergunta(texto, snapshot);
    setMensagens((atual) => [...atual, { autor: "usuario", texto }, { autor: "assistente", resposta }]);
    setEntrada("");
  }

  function confirmarLancamento(
    indice: number,
    dados: { tipo: "despesa" | "receita"; valor: string; descricao: string | null; data?: string; contaId?: string | null; categoriaId?: string | null }
  ) {
    // conta citada na frase > última usada no Gasto rápido > primeira conta
    let ultimaUsada: string | null = null;
    try {
      ultimaUsada = localStorage.getItem("vidatrack-gasto-rapido-conta");
    } catch {}
    const contas = (snapshot?.financas.contas ?? []).filter((c: any) => c.tipo !== "investimento");
    const contaPadrao =
      contas.find((c: any) => c.id === dados.contaId) ?? contas.find((c: any) => c.id === ultimaUsada) ?? contas[0];
    if (!contaPadrao) return;

    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_transacao",
      dados: {
        tipo: dados.tipo,
        valor: dados.valor,
        contaId: contaPadrao.id,
        categoriaId: dados.categoriaId ?? "",
        descricao: dados.descricao ?? "",
        data: dados.data ?? new Date().toLocaleDateString("sv-SE"),
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
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={lista} data-gesto-proprio="1" className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pb-4">
        {mensagens.length > 0 && (
          <div className="flex justify-end">
            <button type="button" onClick={() => setMensagens([])} className="text-[11px] text-ink-400 underline">
              Limpar conversa
            </button>
          </div>
        )}
        {mensagens.length === 0 && (
          <div>
            <p className="text-sm text-ink-400 mb-3">
              Pergunte sobre seus gastos, orçamento, contas a pagar ou pendências de hoje — ou peça pra eu
              lançar algo, tipo "gastei 20 reais no mercado" ou "lança 50 de gasolina ontem no nubank".
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

      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="flex gap-2 pt-3 pb-3 border-t border-base-600 shrink-0"
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
