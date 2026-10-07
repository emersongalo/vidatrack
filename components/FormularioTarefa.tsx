"use client";

import { useState } from "react";
import Link from "next/link";
import { criarTarefa } from "@/app/habitos/tarefas/actions";
import { SeletorIcone } from "@/components/SeletorIcone";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { PRIORIDADES, descreverRepeticao } from "@/lib/agenda/recorrencia";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";

type Categoria = { id: string; nome: string };

export type TipoRepeticao = "nenhuma" | "diaria" | "dias_semana" | "mensal" | "anual" | "intervalo";

const DIAS = [
  { valor: 0, rotulo: "D" },
  { valor: 1, rotulo: "S" },
  { valor: 2, rotulo: "T" },
  { valor: 3, rotulo: "Q" },
  { valor: 4, rotulo: "Q" },
  { valor: 5, rotulo: "S" },
  { valor: 6, rotulo: "S" },
];

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Etapa 193 — mais tipos de repetição (dia X do mês, anual, a cada N
// dias/semanas) e prioridade. Ordem pensada pro uso comum: contas do
// mês ("Mensal") logo depois das opções que já existiam.
const OPCOES_REPETICAO: { valor: TipoRepeticao; rotulo: string }[] = [
  { valor: "nenhuma", rotulo: "Uma vez" },
  { valor: "diaria", rotulo: "Todo dia" },
  { valor: "dias_semana", rotulo: "Dias da semana" },
  { valor: "mensal", rotulo: "Todo mês" },
  { valor: "anual", rotulo: "Todo ano" },
  { valor: "intervalo", rotulo: "A cada..." },
];

const classeCampo =
  "w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition";

function classeOpcao(ativo: boolean) {
  return `rounded-lg py-2 px-2 text-sm border transition ${
    ativo ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
  }`;
}

export function FormularioTarefa({
  action = criarTarefa,
  categorias,
  erro,
  hoje,
  voltarHref = "/tarefas",
  titulo: tituloTela = "Nova tarefa",
  textoBotao = "Criar tarefa",
  mostrarChecklist = true,
  valoresIniciais,
  contasFinancas = [],
  categoriasFinancas = [],
}: {
  /** Etapa 194 — pra vincular a tarefa a um lançamento */
  contasFinancas?: { id: string; nome: string }[];
  categoriasFinancas?: { id: string; nome: string; tipo: string }[];
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
    repetir: TipoRepeticao;
    diasSemana: number[];
    data: string | null;
    horarioLembrete: string | null;
    observacoes?: string | null;
    diaMes?: number | null;
    mes?: number | null;
    intervaloDias?: number | null;
    prioridade?: number | null;
    financaTipo?: string | null;
    financaValor?: number | null;
    financaContaId?: string | null;
    financaCategoriaId?: string | null;
  };
}) {
  const diaHoje = Number(hoje.slice(8, 10));
  const mesHoje = Number(hoje.slice(5, 7));
  const intervaloInicial = valoresIniciais?.intervaloDias ?? 7;

  const [icone, setIcone] = useState(valoresIniciais?.icone || "NotebookPen");
  const [repetir, setRepetir] = useState<TipoRepeticao>(valoresIniciais?.repetir ?? "nenhuma");
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(
    valoresIniciais?.diasSemana?.length ? valoresIniciais.diasSemana : [1, 2, 3, 4, 5]
  );
  const [diaMes, setDiaMes] = useState<number>(valoresIniciais?.diaMes ?? diaHoje);
  const [mes, setMes] = useState<number>(valoresIniciais?.mes ?? mesHoje);
  const [unidadeIntervalo, setUnidadeIntervalo] = useState<"dias" | "semanas">(
    intervaloInicial % 7 === 0 ? "semanas" : "dias"
  );
  const [quantidadeIntervalo, setQuantidadeIntervalo] = useState<number>(
    intervaloInicial % 7 === 0 ? intervaloInicial / 7 : intervaloInicial
  );
  const [prioridade, setPrioridade] = useState<number>(valoresIniciais?.prioridade ?? 0);
  const [subtarefas, setSubtarefas] = useState<string[]>([]);
  const [vinculado, setVinculado] = useState<boolean>(!!valoresIniciais?.financaValor);
  const [tipoFinanca, setTipoFinanca] = useState<"despesa" | "receita">(
    valoresIniciais?.financaTipo === "receita" ? "receita" : "despesa"
  );

  const intervaloDias = Math.max(1, Math.min(365, quantidadeIntervalo * (unidadeIntervalo === "semanas" ? 7 : 1)));

  function alternarDia(dia: number) {
    setDiasSelecionados((atual) =>
      atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia].sort()
    );
  }

  const resumo =
    repetir === "nenhuma"
      ? null
      : descreverRepeticao({ repetir, dias_semana: diasSelecionados, dia_mes: diaMes, mes, intervalo_dias: intervaloDias });

  return (
    <main className="pagina-form px-6 md:px-12 pt-2 pb-10">
      <Link href={voltarHref} className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Tarefas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-6">{tituloTela}</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form action={action}>
        {/* Etapa 193 — no desktop o formulário vira 2 colunas: o "o quê"
            (título, ícone, prioridade...) à esquerda e o "quando"
            (repetição, lembrete) à direita. No celular continua uma
            coluna só, na mesma ordem. */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-x-10">
          <div className="space-y-5">
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
                className={classeCampo}
              />
            </div>

            <div>
              <span className="block text-sm text-ink-400 mb-2">Prioridade</span>
              <div className="grid grid-cols-4 gap-2">
                {PRIORIDADES.map((p) => (
                  <button
                    type="button"
                    key={p.valor}
                    onClick={() => setPrioridade(p.valor)}
                    className={`flex items-center justify-center gap-1.5 ${classeOpcao(prioridade === p.valor)}`}
                  >
                    {p.valor > 0 && <span className={`w-2 h-2 rounded-full ${p.fundo}`} />}
                    {p.rotulo}
                  </button>
                ))}
              </div>
              <input type="hidden" name="prioridade" value={prioridade} />
            </div>

            <div>
              <span className="block text-sm text-ink-400 mb-2">Ícone ou emoji</span>
              <SeletorIcone tipo="habito" valor={icone} aoMudar={setIcone} name="icone" />
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
                  className={classeCampo}
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
              <label htmlFor="observacoes" className="block text-sm text-ink-400 mb-1.5">
                Observações (opcional)
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                defaultValue={valoresIniciais?.observacoes ?? ""}
                placeholder="Alguma anotação sobre essa tarefa..."
                className={`${classeCampo} resize-none`}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <span className="block text-sm text-ink-400 mb-2">Repetição</span>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {OPCOES_REPETICAO.map((o) => (
                  <button type="button" key={o.valor} onClick={() => setRepetir(o.valor)} className={classeOpcao(repetir === o.valor)}>
                    {o.rotulo}
                  </button>
                ))}
              </div>
              <input type="hidden" name="repetir" value={repetir} />

              {repetir === "nenhuma" && (
                <div>
                  <label htmlFor="data" className="block text-xs text-ink-400 mb-1">
                    Data (se passar dela sem concluir, aparece como atrasada em Hoje)
                  </label>
                  <input id="data" name="data" type="date" defaultValue={valoresIniciais?.data ?? hoje} className={classeCampo} />
                </div>
              )}

              {repetir === "dias_semana" && (
                <div className="flex gap-2 flex-wrap">
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

              {(repetir === "mensal" || repetir === "anual") && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-ink-400 shrink-0">Dia</span>
                  <select value={diaMes} onChange={(e) => setDiaMes(Number(e.target.value))} className={classeCampo}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    <option value={31}>Último dia do mês</option>
                  </select>
                  {repetir === "anual" && (
                    <>
                      <span className="text-sm text-ink-400 shrink-0">de</span>
                      <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={classeCampo}>
                        {MESES.map((nome, i) => (
                          <option key={nome} value={i + 1}>
                            {nome}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
              <input type="hidden" name="diaMes" value={diaMes} />
              <input type="hidden" name="mes" value={mes} />

              {repetir === "intervalo" && (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-ink-400 shrink-0">A cada</span>
                    <input
                      type="number"
                      min={1}
                      max={unidadeIntervalo === "semanas" ? 52 : 365}
                      value={quantidadeIntervalo}
                      onChange={(e) => setQuantidadeIntervalo(Math.max(1, Number(e.target.value) || 1))}
                      className={`${classeCampo} w-20`}
                    />
                    <select
                      value={unidadeIntervalo}
                      onChange={(e) => setUnidadeIntervalo(e.target.value as "dias" | "semanas")}
                      className={classeCampo}
                    >
                      <option value="dias">dias</option>
                      <option value="semanas">semanas</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dataInicio" className="block text-xs text-ink-400 mb-1">
                      Começando em
                    </label>
                    <input
                      id="dataInicio"
                      name="data"
                      type="date"
                      defaultValue={valoresIniciais?.data ?? hoje}
                      className={classeCampo}
                    />
                  </div>
                </div>
              )}
              <input type="hidden" name="intervaloDias" value={intervaloDias} />

              {resumo && <p className="text-xs text-ink-400 mt-2">↻ {resumo}</p>}
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
                className={classeCampo}
              />
            </div>

            {/* Etapa 194 — vincular a finanças */}
            <div className="bg-base-800 border border-base-600 rounded-2xl p-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="financaVinculado"
                  checked={vinculado}
                  onChange={(e) => setVinculado(e.target.checked)}
                  className="w-4 h-4 accent-financa"
                />
                <span className="text-sm">💰 Lançar em Finanças ao concluir</span>
              </label>
              {vinculado &&
                (contasFinancas.length === 0 ? (
                  <p className="text-xs text-ink-400 mt-2">
                    Crie uma conta em Finanças → Contas primeiro pra poder vincular.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      {(["despesa", "receita"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipoFinanca(t)}
                          className={`rounded-lg py-1.5 text-sm border transition ${
                            tipoFinanca === t
                              ? t === "despesa"
                                ? "bg-red-400/15 border-red-400 text-red-400"
                                : "bg-habito/15 border-habito text-habito"
                              : "border-base-600 text-ink-400"
                          }`}
                        >
                          {t === "despesa" ? "Despesa" : "Receita"}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="financaTipo" value={tipoFinanca} />
                    <CampoValorMonetario
                      name="financaValor"
                      placeholder="Valor (ex: 150,00)"
                      valorInicial={valoresIniciais?.financaValor ?? undefined}
                      className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 font-mono focus:border-ink-100 outline-none transition"
                    />
                    <select
                      name="financaContaId"
                      defaultValue={valoresIniciais?.financaContaId ?? contasFinancas[0]?.id}
                      className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
                    >
                      {contasFinancas.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      key={tipoFinanca}
                      name="financaCategoriaId"
                      defaultValue={valoresIniciais?.financaCategoriaId ?? ""}
                      className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
                    >
                      <option value="">Sem categoria</option>
                      {categoriasFinancas
                        .filter((c) => c.tipo === tipoFinanca)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-ink-400">
                      Quando você marcar a tarefa como feita, o lançamento é criado sozinho (na data em que marcar
                      {repetir !== "nenhuma" ? ", a cada vez que ela repetir" : ""}). Desmarcou? O lançamento some.
                    </p>
                  </div>
                ))}
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
          </div>
        </div>

        <div className="mt-8 lg:max-w-sm lg:ml-auto">
          <BotaoSalvarFormulario>{textoBotao}</BotaoSalvarFormulario>
        </div>
      </form>
    </main>
  );
}
