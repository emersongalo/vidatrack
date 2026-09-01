"use client";

import { useState } from "react";
import { ICONES_DISPONIVEIS, CORES_DISPONIVEIS } from "@/lib/agenda/estilo";

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

export function FormularioHabito({
  action,
  categorias,
  valoresIniciais,
  textoBotao,
}: {
  action: (formData: FormData) => void;
  categorias: Categoria[];
  valoresIniciais?: {
    nome: string;
    cor: string;
    icone: string;
    frequencia: string;
    diasSemana: number[];
    categoriaId: string | null;
    horarioLembrete: string | null;
    metaDiaria: number;
    unidade: string | null;
  };
  textoBotao: string;
}) {
  const [cor, setCor] = useState(valoresIniciais?.cor ?? "habito");
  const [icone, setIcone] = useState(valoresIniciais?.icone ?? ICONES_DISPONIVEIS[0]);
  const [frequencia, setFrequencia] = useState<"diaria" | "dias_semana">(
    (valoresIniciais?.frequencia as "diaria" | "dias_semana") ?? "diaria"
  );
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(
    valoresIniciais?.diasSemana ?? [1, 2, 3, 4, 5]
  );
  const [metaDiaria, setMetaDiaria] = useState(valoresIniciais?.metaDiaria ?? 1);

  function alternarDia(dia: number) {
    setDiasSelecionados((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="nome" className="block text-sm text-ink-400 mb-1">
          Nome do hábito
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          defaultValue={valoresIniciais?.nome}
          placeholder="Ex: Beber água, Ler 10 páginas, Meditar"
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
        <span className="block text-sm text-ink-400 mb-2">Frequência</span>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setFrequencia("diaria")}
            className={`flex-1 rounded-lg py-2 text-sm border transition ${
              frequencia === "diaria"
                ? "bg-ink-100 text-base-900 border-ink-100"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Todos os dias
          </button>
          <button
            type="button"
            onClick={() => setFrequencia("dias_semana")}
            className={`flex-1 rounded-lg py-2 text-sm border transition ${
              frequencia === "dias_semana"
                ? "bg-ink-100 text-base-900 border-ink-100"
                : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            Dias específicos
          </button>
        </div>
        <input type="hidden" name="frequencia" value={frequencia} />

        {frequencia === "dias_semana" && (
          <div className="flex gap-2">
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
      </div>

      <div>
        <span className="block text-sm text-ink-400 mb-2">Meta diária (opcional)</span>
        <div className="flex gap-2 items-center">
          <input
            name="metaDiaria"
            type="number"
            min={1}
            value={metaDiaria}
            onChange={(e) => setMetaDiaria(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
          />
          <input
            name="unidade"
            type="text"
            defaultValue={valoresIniciais?.unidade ?? ""}
            placeholder="unidade (ex: copos, min, páginas)"
            className="flex-1 bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-ink-100 focus:border-ink-100 outline-none transition"
          />
        </div>
        <p className="text-xs text-ink-400 mt-1">
          Deixe 1 pra um hábito simples de "feito/não feito". Acima disso,
          vira um contador (ex: 8 copos de água).
        </p>
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
        <p className="text-xs text-ink-400 mt-1">
          Isso só marca o horário na tela — enviar notificação de verdade fica para uma etapa futura.
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-ink-100 text-base-900 font-medium rounded-lg py-2.5 hover:opacity-90 transition"
      >
        {textoBotao}
      </button>
    </form>
  );
}
