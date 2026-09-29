"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

// Etapa 218 — escolher o mês e baixar o relatório em PDF
export default function RelatorioPage() {
  const agora = new Date();
  const opcoes = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    return {
      valor: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      rotulo: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  });
  const [mes, setMes] = useState(opcoes[0].valor);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/financas/mais" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Relatório do mês</h1>
      <p className="text-ink-400 text-sm mb-6">
        Um PDF com receitas, despesas, gastos por categoria e todos os lançamentos do mês — pra guardar ou mandar pro contador.
        Ele é montado na hora; nada fica guardado no servidor.
      </p>

      <label className="block text-sm text-ink-400 mb-1">Mês</label>
      <select
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 outline-none focus:border-ink-100 capitalize mb-4"
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>

      <a
        href={`/financas/relatorio/pdf?mes=${mes}`}
        className="flex items-center justify-center gap-2 bg-financa text-base-900 font-semibold rounded-xl py-3 hover:opacity-90 transition"
      >
        <FileText size={18} /> Baixar PDF
      </a>
      <p className="text-xs text-ink-400 mt-3">No app do Android, o arquivo vai pra pasta Downloads.</p>
    </main>
  );
}
