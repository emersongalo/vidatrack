"use client";

import { useState } from "react";
import Link from "next/link";
import { criarTarefa } from "../actions";
import { ICONES_DISPONIVEIS } from "@/lib/agenda/estilo";

type Categoria = { id: string; nome: string };

const DIAS = [
  { valor: 0, rotulo: "D" },
  { valor: 1, rotulo: "S" },
  { valor: 2, rotulo: "T" },
  { valor: 3, rotulo: "Q" },
  { valor: 4, rotulo: "Q" },
  { valor: 5, rotulo: "S" },
  { valor: 6, rotulo: "S" },
];

export function FormularioTarefa({
  action = criarTarefa,
  categorias,
  erro,
  hoje,
  voltarHref = "/habitos/tarefas",
  titulo: tituloTela = "Nova tarefa",
  textoBotao = "Criar tarefa",
  mostrarChecklist = true,
  valoresIniciais,
}: {
  action?: (formData: FormData) => void;
  categorias: Categoria[];
  erro?: string;
  hoje: string;
  voltarHref?: string;
  titulo?: string;
  textoBotao?: string;
  mostrarChecklist?: boolean;
  valoresIniciais?: {
    titulo: string;
    icone: string;
    categoriaId: string | null;
    repetir: "nenhuma" | "diaria" | "dias_semana";
    diasSemana: number[];
    data: string | null;
    horarioLembrete: string | null;
  };
}) {
  const [icone, setIcone] = useState(valoresIniciais?.icone ?? ICONES_DISPONIVEIS[8]); // 📝
  const [repetir, setRepetir] = useState<"nenhuma" | "diaria" | "dias_semana">(
    valoresIniciais?.repetir ?? "nenhuma"
  );
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(
    valoresIniciais?.diasSemana ?? [1, 2, 3, 4, 5]
  );
  const [subtarefas, setSubtarefas] = useState<string[]>([]);

  function alternarDia(dia: number) {
    setDiasSelecionados((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 md:px-12 pt-2">
      <Link href={voltarHref} className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Tarefas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">{tituloTela}</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="titulo" className="block text-sm text-ink-400 mb-1">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={valoresIniciais?.titulo}
            placeholder="Ex: Pagar contas, Estudar para a prova"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        <div>
          <span className="block text-sm text-ink-400 mb-2">Ícone</span>
          <div className="grid grid-cols-8 gap-2">
            {ICONES_DISPONIVEIS.map((opcao) => (
              <button
                type="button"
                key={opcao}
                onClick={() => setIcone(opcao)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition ${
                  icone === opcao ? "border-ink-100 bg-base-700" : "border-base-600 hover:border-ink-400"
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
          <input type="hidden" name="icone" value={icone} />
        </div>

        {categorias.length > 0 && (
          <div>
            <label htmlFor="categoriaId" className="block text-sm text-ink-400 mb-1">
              Categoria (opcional)
            </label>
            <select
              id="categoriaId"
              name="categoriaId"
              defaultValue={valoresIniciais?.categoriaId ?? ""}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              <option value="">Sem categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <span className="block text-sm text-ink-400 mb-2">Repetição</span>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRepetir("nenhuma")}
              className={`flex-1 rounded-lg py-2 text-sm border transition ${
                repetir === "nenhuma"
                  ? "bg-ink-100 text-base-900 border-ink-100"
                  : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              Uma vez
            </button>
            <button
              type="button"
              onClick={() => setRepetir("diaria")}
              className={`flex-1 rounded-lg py-2 text-sm border transition ${
                repetir === "diaria"
                  ? "bg-ink-100 text-base-900 border-ink-100"
                  : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              Todo dia
            </button>
            <button
              type="button"
              onClick={() => setRepetir("dias_semana")}
              className={`flex-1 rounded-lg py-2 text-sm border transition ${
                repetir === "dias_semana"
                  ? "bg-ink-100 text-base-900 border-ink-100"
                  : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              Dias certos
            </button>
          </div>
          <input type="hidden" name="repetir" value={repetir} />

          {repetir === "dias_semana" && (
            <div className="flex gap-2 mb-3">
              {DIAS.map((dia) => (
                <button
                  type="button"
                  key={dia.valor}
                  onClick={() => alternarDia(dia.valor)}
                  className={`w-9 h-9 rounded-full text-sm border transition ${
                    diasSelecionados.includes(dia.valor)
                      ? "bg-ink-100 text-base-900 border-ink-100"
                      : "border-base-600 text-ink-400 hover:text-ink-100"
                  }`}
                >
                  {dia.rotulo}
                </button>
              ))}
              {diasSelecionados.map((d) => (
                <input key={d} type="hidden" name="diasSemana" value={d} />
              ))}
            </div>
          )}

          {repetir === "nenhuma" && (
            <input
              name="data"
              type="date"
              defaultValue={valoresIniciais?.data ?? hoje}
              className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          )}
        </div>

        <div>
          <label htmlFor="horarioLembrete" className="block text-sm text-ink-400 mb-1">
            Lembrete (opcional)
          </label>
          <input
            id="horarioLembrete"
            name="horarioLembrete"
            type="time"
            defaultValue={valoresIniciais?.horarioLembrete ?? ""}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>

        {mostrarChecklist && (
          <div>
            <span className="block text-sm text-ink-400 mb-2">Checklist (opcional)</span>
            <div className="space-y-2">
              {subtarefas.map((_, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    name="subtarefaTexto"
                    type="text"
                    placeholder={`Item ${i + 1}`}
                    className="flex-1 bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setSubtarefas((s) => s.filter((_, idx) => idx !== i))}
                    className="text-ink-400 hover:text-red-400 transition px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSubtarefas((s) => [...s, ""])}
              className="mt-2 text-sm text-ink-400 hover:text-ink-100 transition"
            >
              + Adicionar item
            </button>
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
