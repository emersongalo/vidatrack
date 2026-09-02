"use client";

import { useState } from "react";
import Link from "next/link";
import { criarCategoria } from "@/app/financas/actions";
import { ICONES_CATEGORIA_DESPESA, ICONES_CATEGORIA_RECEITA } from "@/lib/financas/formatacao";
import { CORES_DISPONIVEIS } from "@/lib/agenda/estilo";

export function FormularioCategoria({
  action = criarCategoria,
  titulo = "Nova categoria",
  textoBotao = "Criar categoria",
  voltarHref = "/financas/categorias",
  erro,
  valoresIniciais,
}: {
  action?: (formData: FormData) => void;
  titulo?: string;
  textoBotao?: string;
  voltarHref?: string;
  erro?: string;
  valoresIniciais?: {
    nome: string;
    tipo: "receita" | "despesa";
    metaMensal: string | null;
    icone: string;
    cor: string;
  };
}) {
  const [tipo, setTipo] = useState<"despesa" | "receita">(valoresIniciais?.tipo ?? "despesa");
  const [icone, setIcone] = useState(valoresIniciais?.icone ?? ICONES_CATEGORIA_DESPESA[0]);
  const [cor, setCor] = useState(valoresIniciais?.cor ?? "financa");

  const opcoesIcone = tipo === "despesa" ? ICONES_CATEGORIA_DESPESA : ICONES_CATEGORIA_RECEITA;

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href={voltarHref} className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Categorias
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">{titulo}</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            defaultValue={valoresIniciais?.nome}
            placeholder="Ex: Assinaturas, Educação"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Tipo</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTipo("despesa");
                setIcone(ICONES_CATEGORIA_DESPESA[0]);
              }}
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
              onClick={() => {
                setTipo("receita");
                setIcone(ICONES_CATEGORIA_RECEITA[0]);
              }}
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
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Ícone</span>
          <div className="grid grid-cols-6 gap-2">
            {opcoesIcone.map((opcao) => (
              <button
                type="button"
                key={opcao}
                onClick={() => setIcone(opcao)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition ${
                  icone === opcao ? "border-ink-100 bg-base-700" : "border-base-600 hover:border-ink-400"
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
          <input type="hidden" name="icone" value={icone} />
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

        {tipo === "despesa" && (
          <div>
            <label htmlFor="metaMensal" className="block text-sm text-ink-400 mb-1">
              Meta mensal (opcional)
            </label>
            <input
              id="metaMensal"
              name="metaMensal"
              type="text"
              inputMode="decimal"
              defaultValue={valoresIniciais?.metaMensal ?? ""}
              placeholder="Ex: 400,00"
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
            />
          </div>
        )}

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
