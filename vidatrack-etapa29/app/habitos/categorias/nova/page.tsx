"use client";

import { useState } from "react";
import Link from "next/link";
import { criarCategoriaProdutividade } from "../actions";
import { CORES_DISPONIVEIS } from "@/lib/agenda/estilo";

export default function NovaCategoriaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const [cor, setCor] = useState("habito");

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <Link href="/habitos/categorias" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Categorias
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">Nova categoria</h1>

      {searchParams.erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(searchParams.erro)}
        </p>
      )}

      <form action={criarCategoriaProdutividade} className="space-y-5">
        <div>
          <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Ex: Trabalho, Saúde, Casa"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Cor</span>
          <div className="flex gap-3">
            {CORES_DISPONIVEIS.map((c) => (
              <button
                type="button"
                key={c.valor}
                onClick={() => setCor(c.valor)}
                aria-label={`Cor ${c.valor}`}
                className={`w-8 h-8 rounded-full ${c.classe} ${
                  cor === c.valor ? "ring-2 ring-offset-2 ring-offset-base-900 ring-ink-100" : ""
                }`}
              />
            ))}
          </div>
          <input type="hidden" name="cor" value={cor} />
        </div>

        <button
          type="submit"
          className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
        >
          Criar categoria
        </button>
      </form>
    </main>
  );
}
