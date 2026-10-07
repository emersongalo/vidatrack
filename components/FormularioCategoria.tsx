"use client";

import { useState } from "react";
import Link from "next/link";
import { criarCategoria } from "@/app/financas/actions";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CORES_DISPONIVEIS, classeFundoSuave } from "@/lib/agenda/estilo";
import { SeletorIcone } from "@/components/SeletorIcone";
import { IconeCategoria } from "@/components/IconeCategoria";

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
  const [icone, setIcone] = useState(valoresIniciais?.icone || "🛒");
  const [cor, setCor] = useState(valoresIniciais?.cor ?? "financa");
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href={voltarHref} className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Categorias
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-6">{titulo}</h1>

      {/* Etapa 272 — prévia ao vivo de como a categoria vai aparecer */}
      <div className="flex items-center gap-3.5 bg-base-800 border border-base-600 rounded-2xl p-4 mb-6 lg:max-w-md">
        <span className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${classeFundoSuave(cor)}`}>
          <IconeCategoria icone={icone} tamanho={26} />
        </span>
        <div className="min-w-0">
          <p className="font-medium truncate">{nome.trim() || "Nome da categoria"}</p>
          <p className={`text-xs mt-0.5 ${tipo === "despesa" ? "text-red-400" : "text-habito"}`}>
            {tipo === "despesa" ? "Despesa" : "Receita"}
          </p>
        </div>
      </div>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={action}>
        <div className="form-colunas">
        <div className="form-coluna">
        <div>
          <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Assinaturas, Educação"
            className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Tipo</span>
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
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
            />
          </div>
        )}
        </div>

        <div className="form-coluna">

        <div>
          <span className="block text-sm text-ink-400 mb-2">Ícone ou emoji</span>
          <SeletorIcone tipo="categoria" valor={icone} aoMudar={setIcone} name="icone" />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Cor</span>
          <div className="flex flex-wrap gap-3">
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

        </div>
        </div>

        <div className="form-rodape">
          <BotaoSalvarFormulario>{textoBotao}</BotaoSalvarFormulario>
        </div>
      </form>
    </main>
  );
}
