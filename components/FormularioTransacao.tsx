"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { criarTransacao } from "../actions";

type Conta = { id: string; nome: string };
type Categoria = { id: string; nome: string; tipo: "receita" | "despesa" };

export function FormularioTransacao({
  contas,
  categorias,
  erro,
  action = criarTransacao,
  titulo = "Novo lançamento",
  textoBotao = "Salvar lançamento",
  voltarHref = "/financas",
  valoresIniciais,
}: {
  contas: Conta[];
  categorias: Categoria[];
  erro?: string;
  action?: (formData: FormData) => void;
  titulo?: string;
  textoBotao?: string;
  voltarHref?: string;
  valoresIniciais?: {
    tipo: "despesa" | "receita";
    valor: string;
    contaId: string;
    categoriaId: string | null;
    data: string;
    descricao: string | null;
  };
}) {
  const [tipo, setTipo] = useState<"despesa" | "receita">(valoresIniciais?.tipo ?? "despesa");

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo]
  );

  const hoje = new Date().toLocaleDateString("sv-SE");

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href={voltarHref} className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">{titulo}</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipo("despesa")}
            className={`flex-1 rounded-lg py-2 text-sm border transition ${
              tipo === "despesa"
                ? "bg-red-400/15 border-red-400 text-red-400"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setTipo("receita")}
            className={`flex-1 rounded-lg py-2 text-sm border transition ${
              tipo === "receita"
                ? "bg-habito-soft border-habito text-habito"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Receita
          </button>
        </div>
        <input type="hidden" name="tipo" value={tipo} />

        <div>
          <label htmlFor="valor" className="block text-sm text-ink-400 mb-1">
            Valor
          </label>
          <input
            id="valor"
            name="valor"
            type="text"
            inputMode="decimal"
            required
            defaultValue={valoresIniciais?.valor}
            placeholder="0,00"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
          />
        </div>

        <div>
          <label htmlFor="contaId" className="block text-sm text-ink-400 mb-1">
            Conta
          </label>
          <select
            id="contaId"
            name="contaId"
            required
            defaultValue={valoresIniciais?.contaId}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {contas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="categoriaId" className="block text-sm text-ink-400 mb-1">
            Categoria
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            defaultValue={valoresIniciais?.categoriaId ?? ""}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            <option value="">Sem categoria</option>
            {categoriasFiltradas.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="data" className="block text-sm text-ink-400 mb-1">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            defaultValue={valoresIniciais?.data ?? hoje}
            required
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm text-ink-400 mb-1">
            Descrição (opcional)
          </label>
          <input
            id="descricao"
            name="descricao"
            type="text"
            defaultValue={valoresIniciais?.descricao ?? ""}
            placeholder="Ex: Supermercado, Uber, Freelance"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          {textoBotao}
        </button>
      </form>
    </main>
  );
}
