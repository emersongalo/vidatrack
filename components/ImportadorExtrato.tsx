"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analisarArquivo, confirmarImportacao } from "@/app/financas/importar/actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import type { TransacaoImportada } from "@/lib/financas/importar-extrato";

export function ImportadorExtrato({ contas }: { contas: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [transacoes, setTransacoes] = useState<TransacaoImportada[] | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ importadas: number; ignoradasPorDuplicata: number } | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.set("arquivo", arquivo);

    iniciarTransicao(async () => {
      const resposta = await analisarArquivo(formData);
      if ("erro" in resposta) {
        setErro(resposta.erro);
        setTransacoes(null);
        return;
      }
      setTransacoes(resposta.transacoes);
      setSelecionadas(new Set(resposta.transacoes.map((_, i) => i)));
    });
  }

  function alternarSelecao(indice: number) {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      novo.has(indice) ? novo.delete(indice) : novo.add(indice);
      return novo;
    });
  }

  function confirmar() {
    if (!transacoes) return;
    const escolhidas = transacoes.filter((_, i) => selecionadas.has(i));

    iniciarTransicao(async () => {
      const resposta = await confirmarImportacao(contaId, escolhidas);
      if (resposta.erro) {
        setErro(resposta.erro);
        return;
      }
      setResultado({ importadas: resposta.importadas, ignoradasPorDuplicata: resposta.ignoradasPorDuplicata });
      setTransacoes(null);
    });
  }

  if (resultado) {
    return (
      <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 text-center">
        <p className="text-2xl mb-2">📦</p>
        <p className="font-medium mb-1">{resultado.importadas} lançamento(s) importado(s)</p>
        {resultado.ignoradasPorDuplicata > 0 && (
          <p className="text-xs text-ink-400 mb-4">
            {resultado.ignoradasPorDuplicata} ignorado(s) por já existir (mesma data, valor e descrição).
          </p>
        )}
        <button
          onClick={() => router.push("/financas/extrato")}
          className="bg-ink-100 text-base-900 font-medium rounded-lg px-4 py-2 text-sm hover:opacity-90 transition"
        >
          Ver extrato
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block text-xs text-ink-400 mb-1.5">Importar pra qual conta</label>
        <select
          value={contaId}
          onChange={(e) => setContaId(e.target.value)}
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        >
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {!transacoes && (
        <div className="bg-base-800 border border-dashed border-base-600 rounded-xl2 p-6 text-center">
          <input
            type="file"
            accept=".ofx,.csv,.txt"
            onChange={aoEscolherArquivo}
            disabled={pendente}
            className="text-sm text-ink-400 file:mr-3 file:bg-financa file:text-base-900 file:border-0 file:rounded-lg file:px-3 file:py-2 file:text-sm file:font-medium file:cursor-pointer"
          />
          {pendente && <p className="text-xs text-ink-400 mt-3">Lendo arquivo...</p>}
        </div>
      )}

      {erro && (
        <p className="mt-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>
      )}

      {transacoes && (
        <div className="mt-4">
          <p className="text-sm text-ink-400 mb-3">
            {selecionadas.size} de {transacoes.length} selecionado(s) — desmarca o que não quiser importar
          </p>
          <ul className="space-y-1.5 max-h-96 overflow-y-auto mb-4">
            {transacoes.map((t, i) => (
              <li
                key={i}
                onClick={() => alternarSelecao(i)}
                className={`flex items-center gap-3 rounded-lg p-3 border cursor-pointer transition ${
                  selecionadas.has(i) ? "bg-base-800 border-base-600" : "bg-base-900 border-base-700 opacity-50"
                }`}
              >
                <input type="checkbox" checked={selecionadas.has(i)} readOnly className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.descricao}</p>
                  <p className="text-xs text-ink-400">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-ink-100"}`}>
                  {t.tipo === "receita" ? "+" : "-"}
                  {formatarMoeda(t.valor)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => setTransacoes(null)}
              className="flex-1 border border-base-600 rounded-lg py-2.5 hover:bg-base-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={pendente || selecionadas.size === 0}
              className="flex-1 bg-financa text-base-900 font-semibold rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-50"
            >
              {pendente ? "Importando..." : `Importar ${selecionadas.size}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
