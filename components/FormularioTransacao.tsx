"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { criarTransacao, criarCategoriaRapida, removerParcelasDaqui } from "@/app/financas/actions";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { ICONES_CATEGORIA } from "@/lib/financas/icones-categoria";
import { IconeCategoria } from "@/components/IconeCategoria";
import { adicionarNaFila } from "@/lib/offline/fila";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { sugerirCategoria } from "@/lib/financas/sugestaoCategoria";
import { sugerirDescricoes, descricoesFrequentes, type DescricaoSugerida } from "@/lib/financas/sugestaoDescricao";
import { ChipsDescricao } from "@/components/ChipsDescricao";
import { CampoEtiquetas } from "@/components/CampoEtiquetas";
import { formatarValorDigitado } from "@/components/CampoValorMonetario";

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
  tipoInicial,
  idTransacaoEditada,
}: {
  /** Etapa 210 — pra excluir parcelas a partir da tela de edição */
  idTransacaoEditada?: string;
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
    /** Etapa 218 */
    etiquetas?: string[] | null;
    recorrencia?: { id: string; diaMes: number; dataFim: string | null } | null;
    parcela?: { grupo: string; numero: number; total: number } | null;
  };
  /** Etapa 135 — pra pré-marcar Receita/Despesa vindo da folha rápida
   *  do "+", sem precisar fingir que é uma edição (valoresIniciais). */
  tipoInicial?: "despesa" | "receita";
}) {
  const [tipo, setTipo] = useState<"despesa" | "receita">(valoresIniciais?.tipo ?? tipoInicial ?? "despesa");
  const [recorrente, setRecorrente] = useState(false);
  // Etapa 210 — compra parcelada
  const [parcelado, setParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState(2);
  const [modoParcela, setModoParcela] = useState<"total" | "parcela">("total");
  const [valorDigitado, setValorDigitado] = useState(valoresIniciais?.valor ? String(valoresIniciais.valor) : "");
  const [duracaoRecorrencia, setDuracaoRecorrencia] = useState<"sempre" | "ate_data">("sempre");
  const ehEdicao = !!valoresIniciais;
  const recorrenciaExistente = valoresIniciais?.recorrencia ?? null;
  const [escopoRecorrencia, setEscopoRecorrencia] = useState<"proximos" | "so_este">("proximos");
  const [pararRecorrencia, setPararRecorrencia] = useState(false);

  const [categoriasLocais, setCategoriasLocais] = useState(categorias);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(valoresIniciais?.categoriaId ?? "");
  // Etapa 215 — categoria sugerida pela descrição (só enquanto a pessoa não escolheu uma)
  const [categoriaTocada, setCategoriaTocada] = useState(!!valoresIniciais?.categoriaId);
  const [categoriaSugerida, setCategoriaSugerida] = useState(false);
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState("");
  const [iconeNovaCategoria, setIconeNovaCategoria] = useState(ICONES_CATEGORIA[0].nome);
  const [erroCategoria, setErroCategoria] = useState("");
  const [criandoCategoria, iniciarCriacaoCategoria] = useTransition();

  const categoriasFiltradas = useMemo(
    () => categoriasLocais.filter((c) => c.tipo === tipo),
    [categoriasLocais, tipo]
  );

  // Etapa 217 — completar a descrição ("lave" → "Lavagem do carro")
  const [descricaoTexto, setDescricaoTexto] = useState(valoresIniciais?.descricao ?? "");
  const [valorPreenchido, setValorPreenchido] = useState<string | null>(null);
  const [chaveValor, setChaveValor] = useState(0);
  // lido depois de montar (no servidor não existe o retrato local)
  const [historicoLocal, setHistoricoLocal] = useState<any[]>([]);
  useEffect(() => {
    setHistoricoLocal((lerSnapshotOffline()?.financas.transacoes ?? []) as any[]);
  }, []);
  const ehNovo = !valoresIniciais;
  const sugestoesDescricao = useMemo(
    () => (ehNovo && descricaoTexto.trim().length >= 2 ? sugerirDescricoes(descricaoTexto, tipo, historicoLocal) : []),
    [ehNovo, descricaoTexto, tipo, historicoLocal]
  );
  const frequentes = useMemo(
    () => (ehNovo ? descricoesFrequentes(tipo, historicoLocal, new Date().toLocaleDateString("sv-SE")) : []),
    [ehNovo, tipo, historicoLocal]
  );

  function escolherDescricao(s: DescricaoSugerida) {
    setDescricaoTexto(s.descricao);
    if (s.categoriaId && categoriasFiltradas.some((c) => c.id === s.categoriaId)) {
      setCategoriaSelecionada(s.categoriaId);
      setCategoriaTocada(true);
      setCategoriaSugerida(false);
    }
    if (!valorDigitado && s.ultimoValor > 0) {
      const texto = formatarValorDigitado(s.ultimoValor.toFixed(2).replace(".", ""));
      setValorPreenchido(s.ultimoValor.toFixed(2));
      setValorDigitado(texto);
      setChaveValor((k) => k + 1);
    }
  }

  function sugerirPelaDescricao(texto: string) {
    if (categoriaTocada) return;
    const snap = lerSnapshotOffline();
    if (!snap) return;
    const id = sugerirCategoria(texto, tipo, snap.financas.transacoes, categoriasFiltradas);
    if (id) {
      setCategoriaSelecionada(id);
      setCategoriaSugerida(true);
    } else if (categoriaSugerida) {
      setCategoriaSelecionada("");
      setCategoriaSugerida(false);
    }
  }

  function abrirNovaCategoria() {
    setIconeNovaCategoria(ICONES_CATEGORIA[0].nome);
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
      setCategoriaTocada(true);
      setCategoriaSugerida(false);
      setMostrarNovaCategoria(false);
    });
  }

  const hoje = new Date().toLocaleDateString("sv-SE");
  const router = useRouter();
  // Etapa 205 — o dia da repetição acompanha a data escolhida (lançou
  // pro dia 09/10 → "todo dia 9"), a menos que a pessoa mude na mão.
  const [dataLancamento, setDataLancamento] = useState(valoresIniciais?.data ?? hoje);
  const diaDaData = (iso: string) => Math.min(28, Number(iso.slice(8, 10)) || 1);
  const [diaMesRecorrencia, setDiaMesRecorrencia] = useState(diaDaData(valoresIniciais?.data ?? hoje));
  const [diaMesEditado, setDiaMesEditado] = useState(false);

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
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href={voltarHref} className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-6">{titulo}</h1>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      <form
        action={action}
        onSubmit={aoSubmeter}
        onInput={(e) => {
          const alvo = e.target as HTMLInputElement;
          if (alvo.name === "valor") setValorDigitado(alvo.value);
        }}
      >
        <div className="form-colunas">
        <div className="form-coluna">
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
          <CampoValorMonetario
            key={chaveValor}
            id="valor"
            name="valor"
            valorInicial={valorPreenchido ?? valoresIniciais?.valor}
            required
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
            onChange={(e) => {
              setCategoriaSelecionada(e.target.value);
              setCategoriaTocada(true);
              setCategoriaSugerida(false);
            }}
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            <option value="">Sem categoria</option>
            {categoriasFiltradas.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          {categoriaSugerida && (
            <p className="text-[11px] text-financa mt-1">✨ Sugerida pela descrição — pode trocar se quiser</p>
          )}

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
              <div className="grid grid-cols-8 lg:grid-cols-12 gap-1.5 max-h-40 overflow-y-auto">
                {ICONES_CATEGORIA.map(({ nome, Icone }) => (
                  <button
                    type="button"
                    key={nome}
                    onClick={() => setIconeNovaCategoria(nome)}
                    aria-label={nome}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition ${
                      iconeNovaCategoria === nome ? "border-ink-100 bg-base-700 text-ink-100" : "border-base-600 text-ink-400"
                    }`}
                  >
                    <Icone size={16} strokeWidth={2} />
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

        </div>

        <div className="form-coluna">
        <div>
          <label htmlFor="data" className="block text-sm text-ink-400 mb-1">
            Data
          </label>
          <input
            id="data"
            name="data"
            type="date"
            value={dataLancamento}
            onChange={(e) => {
              setDataLancamento(e.target.value);
              if (!diaMesEditado && e.target.value) setDiaMesRecorrencia(diaDaData(e.target.value));
            }}
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
            value={descricaoTexto}
            autoComplete="off"
            onChange={(e) => {
              setDescricaoTexto(e.target.value);
              sugerirPelaDescricao(e.target.value);
            }}
            placeholder="Ex: Supermercado, Uber, Freelance"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
          {descricaoTexto.trim().length >= 2 ? (
            <ChipsDescricao sugestoes={sugestoesDescricao} aoEscolher={escolherDescricao} />
          ) : (
            <ChipsDescricao sugestoes={frequentes} titulo="Frequentes — toque pra preencher" aoEscolher={escolherDescricao} />
          )}
        </div>

        <CampoEtiquetas iniciais={valoresIniciais?.etiquetas ?? null} />

        {/* Etapa 208 — editando um lançamento que repete: escolhe se a
           mudança vale só pra este ou também pros próximos meses. */}
        {recorrenciaExistente && (
          <div className="bg-base-800 border border-financa/40 rounded-lg p-3 space-y-2.5">
            <p className="text-sm">
              <span className="text-financa">↻</span> Esse lançamento repete todo mês (dia {recorrenciaExistente.diaMes})
            </p>
            <input type="hidden" name="recorrenciaId" value={recorrenciaExistente.id} />
            <input type="hidden" name="escopoRecorrencia" value={escopoRecorrencia} />
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["proximos", "Este e os próximos"],
                  ["so_este", "Só este mês"],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setEscopoRecorrencia(valor)}
                  className={`rounded-lg py-2 text-xs border transition ${
                    escopoRecorrencia === valor
                      ? "bg-ink-100 text-base-900 border-ink-100"
                      : "border-base-600 text-ink-400 hover:text-ink-100"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink-400">
              {escopoRecorrencia === "proximos"
                ? `Valor, conta, categoria e descrição valem daqui pra frente. Mudou a data? Os próximos passam a cair no dia ${diaDaData(dataLancamento)}.`
                : "Muda só este lançamento; os próximos meses continuam como estavam."}
            </p>
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="pararRecorrencia"
                checked={pararRecorrencia}
                onChange={(e) => setPararRecorrencia(e.target.checked)}
                className="w-4 h-4 accent-red-400"
              />
              <span className="text-sm">Parar de repetir depois deste</span>
            </label>
          </div>
        )}

        {/* Etapa 210 — compra parcelada (só ao criar) */}
        {!ehEdicao && (
          <div className="bg-base-800 border border-base-600 rounded-lg p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="parcelado"
                checked={parcelado}
                onChange={(e) => {
                  setParcelado(e.target.checked);
                  if (e.target.checked) setRecorrente(false);
                }}
                className="w-4 h-4 accent-financa"
              />
              <span className="text-sm">💳 Compra parcelada</span>
            </label>
            {parcelado && (() => {
              const valorNum = Number(valorDigitado.replace(/\./g, "").replace(",", ".")) || 0;
              const porParcela = modoParcela === "total" ? valorNum / numParcelas : valorNum;
              const total = modoParcela === "total" ? valorNum : valorNum * numParcelas;
              const fim = (() => {
                const [a, m] = (dataLancamento || hoje).split("-").map(Number);
                return new Date(a, m - 1 + numParcelas - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
              })();
              const inicio = new Date((dataLancamento || hoje) + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
              const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
              return (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400">Em</span>
                    <input
                      name="numParcelas"
                      type="number"
                      min={2}
                      max={48}
                      value={numParcelas}
                      onChange={(e) => setNumParcelas(Math.max(2, Math.min(48, Number(e.target.value) || 2)))}
                      className="w-16 bg-base-900 border border-base-600 rounded-lg px-2 py-1.5 text-sm text-ink-100 font-mono outline-none focus:border-ink-100"
                    />
                    <span className="text-xs text-ink-400">vezes</span>
                  </div>
                  <input type="hidden" name="modoParcela" value={modoParcela} />
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["total", "Valor é o total"],
                        ["parcela", "Valor é cada parcela"],
                      ] as const
                    ).map(([v, r]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setModoParcela(v)}
                        className={`rounded-lg py-1.5 text-xs border transition ${
                          modoParcela === v ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink-400">
                    {valorNum > 0 ? (
                      <>
                        <span className="text-ink-100 font-mono">
                          {numParcelas}× de {moeda(porParcela)}
                        </span>{" "}
                        (total {moeda(total)}), de {inicio} a {fim}. Cada parcela entra no saldo no mês dela.
                      </>
                    ) : (
                      "Digite o valor lá em cima pra ver as parcelas."
                    )}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Etapa 210 — editando uma parcela */}
        {valoresIniciais?.parcela && (
          <div className="bg-base-800 border border-financa/40 rounded-lg p-3 space-y-2">
            <p className="text-sm">
              💳 Parcela {valoresIniciais.parcela.numero} de {valoresIniciais.parcela.total}
            </p>
            <input type="hidden" name="parcelaGrupo" value={valoresIniciais.parcela.grupo} />
            <input type="hidden" name="parcelaNumero" value={valoresIniciais.parcela.numero} />
            {valoresIniciais.parcela.numero < valoresIniciais.parcela.total && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" name="aplicarParcelas" className="w-4 h-4 accent-financa" />
                <span className="text-sm">Aplicar valor, conta e categoria às próximas parcelas</span>
              </label>
            )}
          </div>
        )}

        {!recorrenciaExistente && !parcelado && !valoresIniciais?.parcela && (
          <div className="bg-base-800 border border-base-600 rounded-lg p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="recorrente"
                checked={recorrente}
                onChange={(e) => {
                  setRecorrente(e.target.checked);
                  if (e.target.checked) setParcelado(false);
                }}
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
                    value={diaMesRecorrencia}
                    onChange={(e) => {
                      setDiaMesEditado(true);
                      setDiaMesRecorrencia(Math.max(1, Math.min(28, Number(e.target.value) || 1)));
                    }}
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
                      Sem data pra acabar
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
                      min={dataLancamento || hoje}
                      className="w-full mt-2 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition"
                    />
                  )}
                </div>

                <p className="text-[11px] text-ink-400">
                  Começa em{" "}
                  <span className="text-ink-100">
                    {dataLancamento ? new Date(dataLancamento + "T00:00:00").toLocaleDateString("pt-BR") : "--"}
                  </span>{" "}
                  e repete todo dia {diaMesRecorrencia} dos meses seguintes — nada é lançado antes dessa data.
                  Dá pra pausar ou excluir depois em Finanças → Recorrentes.
                </p>
              </div>
            )}
          </div>
        )}

        </div>
        </div>

        <div className="form-rodape">
          <BotaoSalvarFormulario>{textoBotao}</BotaoSalvarFormulario>
        </div>
      </form>

      {valoresIniciais?.parcela && (
        <div className="mt-6 flex justify-center">
          <BotaoComConfirmacao
            acao={removerParcelasDaqui.bind(null, idTransacaoEditada ?? "")}
            textoBotao={
              valoresIniciais.parcela.numero < valoresIniciais.parcela.total
                ? `Excluir esta e as próximas parcelas (${valoresIniciais.parcela.numero} a ${valoresIniciais.parcela.total})`
                : "Excluir esta parcela"
            }
            textoConfirmacao="Excluir essas parcelas? Não tem volta."
            classeBotao="text-sm text-red-400 hover:underline"
            aoConcluir={() => router.push("/financas")}
          />
        </div>
      )}
    </main>
  );
}
