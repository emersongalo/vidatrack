"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarTransacao, criarCategoriaRapida } from "@/app/financas/actions";
import { ICONES_CATEGORIA_DESPESA, ICONES_CATEGORIA_RECEITA } from "@/lib/financas/formatacao";
import { adicionarNaFila } from "@/lib/offline/fila";

type Conta = { id: string; nome: string };
type Categoria = { id: string; nome: string; tipo: "receita" | "despesa"; icone?: string };

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
  const [recorrente, setRecorrente] = useState(false);
  const [duracaoRecorrencia, setDuracaoRecorrencia] = useState<"sempre" | "ate_data">("sempre");
  const ehEdicao = !!valoresIniciais;

  const [categoriasLocais, setCategoriasLocais] = useState(categorias);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(valoresIniciais?.categoriaId ?? "");
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState("");
  const [iconeNovaCategoria, setIconeNovaCategoria] = useState(ICONES_CATEGORIA_DESPESA[0]);
  const [erroCategoria, setErroCategoria] = useState("");
  const [criandoCategoria, iniciarCriacaoCategoria] = useTransition();

  const categoriasFiltradas = useMemo(
    () => categoriasLocais.filter((c) => c.tipo === tipo),
    [categoriasLocais, tipo]
  );

  function abrirNovaCategoria() {
    setIconeNovaCategoria(tipo === "despesa" ? ICONES_CATEGORIA_DESPESA[0] : ICONES_CATEGORIA_RECEITA[0]);
    setNomeNovaCategoria("");
    setErroCategoria("");
    setMostrarNovaCategoria(true);
  }

  function salvarNovaCategoria() {
    if (!nomeNovaCategoria.trim()) {
      setErroCategoria("Digite um nome");
      return;
    }
    iniciarCriacaoCategoria(async () => {
      const resultado = await criarCategoriaRapida({
        nome: nomeNovaCategoria.trim(),
        tipo,
        icone: iconeNovaCategoria,
      });
      if ("erro" in resultado) {
        setErroCategoria(resultado.erro);
        return;
      }
      setCategoriasLocais((atual) => [...atual, resultado as Categoria]);
      setCategoriaSelecionada(resultado.id);
      setMostrarNovaCategoria(false);
    });
  }

  const hoje = new Date().toLocaleDateString("sv-SE");
  const router = useRouter();

  function aoSubmeter(e: React.FormEvent<HTMLFormElement>) {
    // Só intercepta a criação (não a edição) quando não tem internet —
    // se estiver online, deixa o <form action> normal cuidar de tudo,
    // sem mudar em nada o comportamento que já existia.
    if (navigator.onLine || ehEdicao) return;

    e.preventDefault();
    const dados = new FormData(e.currentTarget);

    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_transacao",
      dados: {
        tipo: (dados.get("tipo") === "receita" ? "receita" : "despesa") as "receita" | "despesa",
        valor: String(dados.get("valor") ?? ""),
        contaId: String(dados.get("contaId") ?? ""),
        categoriaId: String(dados.get("categoriaId") ?? ""),
        descricao: String(dados.get("descricao") ?? ""),
        data: String(dados.get("data") ?? hoje),
      },
    });

    router.push("/financas?offline=1");
  }

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

      <form action={action} onSubmit={aoSubmeter} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTipo("despesa");
              setCategoriaSelecionada("");
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
              setCategoriaSelecionada("");
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
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="categoriaId" className="block text-sm text-ink-400">
              Categoria
            </label>
            <button
              type="button"
              onClick={abrirNovaCategoria}
              className="text-xs text-financa hover:underline"
            >
              + Nova categoria
            </button>
          </div>
          <select
            id="categoriaId"
            name="categoriaId"
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            <option value="">Sem categoria</option>
            {categoriasFiltradas.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icone ? `${cat.icone} ` : ""}
                {cat.nome}
              </option>
            ))}
          </select>

          {mostrarNovaCategoria && (
            <div className="mt-2 bg-base-800 border border-base-600 rounded-lg p-3 space-y-2.5">
              <input
                type="text"
                value={nomeNovaCategoria}
                onChange={(e) => setNomeNovaCategoria(e.target.value)}
                placeholder="Nome da categoria"
                autoFocus
                className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
              />
              <div className="grid grid-cols-8 gap-1.5">
                {(tipo === "despesa" ? ICONES_CATEGORIA_DESPESA : ICONES_CATEGORIA_RECEITA).map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setIconeNovaCategoria(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base border transition ${
                      iconeNovaCategoria === ic ? "border-ink-100 bg-base-700" : "border-base-600"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              {erroCategoria && <p className="text-xs text-red-400">{erroCategoria}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarNovaCategoria(false)}
                  className="flex-1 border border-base-600 rounded-lg py-1.5 text-xs hover:bg-base-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarNovaCategoria}
                  disabled={criandoCategoria}
                  className="flex-1 bg-financa text-base-900 font-medium rounded-lg py-1.5 text-xs hover:opacity-90 transition disabled:opacity-50"
                >
                  {criandoCategoria ? "Criando..." : "Criar e usar"}
                </button>
              </div>
            </div>
          )}
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

        {!ehEdicao && (
          <div className="bg-base-800 border border-base-600 rounded-lg p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="recorrente"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
                className="w-4 h-4 accent-financa"
              />
              <span className="text-sm">🔁 Repetir todo mês</span>
            </label>
            {recorrente && (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="diaMes" className="block text-xs text-ink-400 mb-1">
                    Repete todo dia (do mês)
                  </label>
                  <input
                    id="diaMes"
                    name="diaMes"
                    type="number"
                    min={1}
                    max={28}
                    defaultValue={new Date().getDate() > 28 ? 28 : new Date().getDate()}
                    className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition font-mono"
                  />
                  <p className="text-[11px] text-ink-400 mt-1">
                    Ex: 5 = todo dia 5 de cada mês. Máximo 28, pra funcionar em
                    fevereiro também.
                  </p>
                </div>

                <div>
                  <span className="block text-xs text-ink-400 mb-1.5">Até quando repete?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDuracaoRecorrencia("sempre")}
                      className={`flex-1 rounded-lg py-1.5 text-xs border transition ${
                        duracaoRecorrencia === "sempre"
                          ? "bg-ink-100 text-base-900 border-ink-100"
                          : "border-base-600 text-ink-400 hover:text-ink-100"
                      }`}
                    >
                      Para sempre
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuracaoRecorrencia("ate_data")}
                      className={`flex-1 rounded-lg py-1.5 text-xs border transition ${
                        duracaoRecorrencia === "ate_data"
                          ? "bg-ink-100 text-base-900 border-ink-100"
                          : "border-base-600 text-ink-400 hover:text-ink-100"
                      }`}
                    >
                      Até uma data
                    </button>
                  </div>
                  {duracaoRecorrencia === "ate_data" && (
                    <input
                      name="dataFimRecorrencia"
                      type="date"
                      required
                      min={hoje}
                      className="w-full mt-2 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
                    />
                  )}
                </div>

                <p className="text-[11px] text-ink-400">
                  O lançamento de hoje é criado normalmente, e os próximos
                  meses passam a aparecer sozinhos — dá pra gerenciar (pausar
                  ou excluir) depois em Finanças → Recorrentes.
                </p>
              </div>
            )}
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
