"use client";

import { useState } from "react";

export function SeletorTipoConta({
  tipoInicial = "banco",
  diaFechamentoInicial,
  diaVencimentoInicial,
}: {
  tipoInicial?: string;
  diaFechamentoInicial?: number | null;
  diaVencimentoInicial?: number | null;
}) {
  const [tipo, setTipo] = useState(tipoInicial);

  return (
    <>
      <select
        name="tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
      >
        <option value="banco">Banco</option>
        <option value="carteira">Carteira</option>
        <option value="cartao">Cartão</option>
        <option value="investimento">Investimento</option>
      </select>

      {tipo === "investimento" && (
        <p className="text-xs text-ink-400 -mt-1.5">
          Contas do tipo "Investimento" ficam separadas do seu saldo principal —
          o dinheiro guardado ali aparece numa seção própria, não conta como
          "disponível pra gastar".
        </p>
      )}

      {tipo === "cartao" && (
        <div className="grid grid-cols-2 gap-3 -mt-1.5">
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Dia do fechamento</label>
            <input
              name="diaFechamento"
              type="number"
              min={1}
              max={28}
              placeholder="Ex: 5"
              defaultValue={diaFechamentoInicial ?? ""}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Dia do vencimento</label>
            <input
              name="diaVencimento"
              type="number"
              min={1}
              max={28}
              placeholder="Ex: 12"
              defaultValue={diaVencimentoInicial ?? ""}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
        </div>
      )}
    </>
  );
}
