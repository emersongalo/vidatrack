"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, PiggyBank, X, Check, Zap, ArrowLeftRight, Camera } from "lucide-react";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { adicionarNaFila } from "@/lib/offline/fila";
import { criarTransacaoSilenciosa } from "@/app/financas/actions";
import { formatarValorDigitado } from "@/components/CampoValorMonetario";
import { IconeCategoria } from "@/components/IconeCategoria";
import { classeFundoSuave, classeTextoCor } from "@/lib/agenda/estilo";
import { extrairDadosCupom } from "@/lib/financas/cupom";
import { sugerirCategoria } from "@/lib/financas/sugestaoCategoria";
import { sugerirDescricoes, descricoesFrequentes, type DescricaoSugerida } from "@/lib/financas/sugestaoDescricao";
import { ChipsDescricao } from "@/components/ChipsDescricao";

const CHAVE_ULTIMA_CONTA = "vidatrack-gasto-rapido-conta";

type Conta = { id: string; nome: string; tipo: string; dono_id?: string };
type Categoria = { id: string; nome: string; tipo: string; icone?: string | null; cor?: string | null; dono_id?: string };

/**
 * Etapa 135 — o "+" abre uma folha perguntando o que lançar.
 * Etapa 204 — "Gasto rápido" no topo da folha: valor → categoria →
 * pronto, sem sair da tela (3 toques). Categorias mais usadas nos
 * últimos 60 dias aparecem primeiro; a conta fica lembrada. Sem
 * internet, vai pra fila e sincroniza depois.
 * Etapa 214 — "Ler cupom": tira foto do cupom/nota e preenche valor,
 * data e descrição (OCR no próprio aparelho).
 */
export function BotaoNovoLancamento() {
  const [aberto, setAberto] = useState(false);

  // Atalho do ícone do app (segurar o ícone → "Novo gasto") abre direto
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("gasto") === "1") {
        setAberto(true);
        params.delete("gasto");
        const resto = params.toString();
        window.history.replaceState(window.history.state, "", window.location.pathname + (resto ? `?${resto}` : ""));
      }
    } catch {}
  }, []);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Novo lançamento"
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-20 w-14 h-14 rounded-full bg-financa text-base-900 flex items-center justify-center shadow-lg shadow-financa/30 hover:opacity-90 active:scale-95 transition"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {aberto && <FolhaLancamento aoFechar={() => setAberto(false)} />}
    </>
  );
}

function FolhaLancamento({ aoFechar }: { aoFechar: () => void }) {
  const snapshot = useMemo(() => lerSnapshotOffline(), []);
  const meuId = snapshot?.perfil.id;

  const contas: Conta[] = useMemo(
    () =>
      ((snapshot?.financas.contas ?? []) as Conta[]).filter(
        (c) => c.tipo !== "investimento" && (!c.dono_id || c.dono_id === meuId)
      ),
    [snapshot, meuId]
  );

  const todasDespesa: Categoria[] = useMemo(
    () => ((snapshot?.financas.categorias ?? []) as Categoria[]).filter((c) => c.tipo === "despesa" && (!c.dono_id || c.dono_id === meuId)),
    [snapshot, meuId]
  );

  // categorias de despesa, as mais usadas nos últimos 60 dias primeiro
  const categoriasMaisUsadas: Categoria[] = useMemo(() => {
    const todas = todasDespesa;
    const limite = new Date(Date.now() - 60 * 86400000).toLocaleDateString("sv-SE");
    const uso = new Map<string, number>();
    for (const t of (snapshot?.financas.transacoes ?? []) as any[]) {
      if (t.tipo === "despesa" && t.categoria_id && t.data >= limite) uso.set(t.categoria_id, (uso.get(t.categoria_id) ?? 0) + 1);
    }
    return [...todas].sort((a, b) => (uso.get(b.id) ?? 0) - (uso.get(a.id) ?? 0) || a.nome.localeCompare(b.nome)).slice(0, 8);
  }, [snapshot, todasDespesa]);

  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [contaId, setContaId] = useState<string>(() => {
    try {
      const salva = localStorage.getItem(CHAVE_ULTIMA_CONTA);
      if (salva && contas.some((c) => c.id === salva)) return salva;
    } catch {}
    return contas[0]?.id ?? "";
  });
  const [descricao, setDescricao] = useState("");
  // Etapa 215 — categoria sugerida pela descrição (até a pessoa tocar numa)
  const [categoriaTocada, setCategoriaTocada] = useState(false);
  const [categoriaSugerida, setCategoriaSugerida] = useState(false);
  const categorias: Categoria[] = useMemo(() => {
    if (!categoriaId || categoriasMaisUsadas.some((c) => c.id === categoriaId)) return categoriasMaisUsadas;
    const extra = todasDespesa.find((c) => c.id === categoriaId);
    return extra ? [extra, ...categoriasMaisUsadas.slice(0, 7)] : categoriasMaisUsadas;
  }, [categoriaId, categoriasMaisUsadas, todasDespesa]);

  // Etapa 217 — completar a descrição com o que você costuma lançar
  const historico = useMemo(() => (snapshot?.financas.transacoes ?? []) as any[], [snapshot]);
  const frequentes = useMemo(
    () => descricoesFrequentes("despesa", historico, new Date().toLocaleDateString("sv-SE")),
    [historico]
  );
  const sugestoesDescricao = useMemo(
    () => (descricao.trim().length >= 1 ? sugerirDescricoes(descricao, "despesa", historico) : []),
    [descricao, historico]
  );

  function escolherDescricao(s: DescricaoSugerida) {
    setDescricao(s.descricao);
    if (s.categoriaId && todasDespesa.some((c) => c.id === s.categoriaId)) {
      setCategoriaId(s.categoriaId);
      setCategoriaTocada(true);
      setCategoriaSugerida(false);
    }
    // Etapa 228 — não preenche mais o valor: a pessoa coloca
    if (s.contaId && contas.some((c) => c.id === s.contaId)) setContaId(s.contaId);
  }

  function mudarDescricao(texto: string) {
    setDescricao(texto);
    if (categoriaTocada) return;
    const id = sugerirCategoria(texto, "despesa", (snapshot?.financas.transacoes ?? []) as any[], todasDespesa);
    if (id) {
      setCategoriaId(id);
      setCategoriaSugerida(true);
    } else if (categoriaSugerida) {
      setCategoriaId("");
      setCategoriaSugerida(false);
    }
  }
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const campoValor = useRef<HTMLInputElement>(null);
  const campoFoto = useRef<HTMLInputElement>(null);
  const [dataCupom, setDataCupom] = useState<string | null>(null);
  const [lendo, setLendo] = useState<number | null>(null);
  const [avisoCupom, setAvisoCupom] = useState<string | null>(null);

  async function lerCupom(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setAvisoCupom(null);
    if (!navigator.onLine) return setErro("Ler cupom precisa de internet.");
    setLendo(0);
    try {
      const { lerTextoDaImagem } = await import("@/lib/financas/ocr");
      const texto = await lerTextoDaImagem(arquivo, (p) => setLendo(p));
      const d = extrairDadosCupom(texto);
      if (d.valor) setValor(d.valor);
      if (d.descricao && !descricao.trim()) mudarDescricao(d.descricao);
      const hoje = new Date().toLocaleDateString("sv-SE");
      setDataCupom(d.data && d.data !== hoje ? d.data : null);
      setAvisoCupom(
        d.valor
          ? "Confira o valor antes de lançar — a leitura pode errar."
          : "Não achei o valor no cupom. Digite ou tente uma foto mais nítida e reta."
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui ler o cupom.");
    } finally {
      setLendo(null);
      if (campoFoto.current) campoFoto.current.value = "";
    }
  }

  useEffect(() => {
    const t = setTimeout(() => campoValor.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  async function lancar() {
    setErro(null);
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!numero || numero <= 0) return setErro("Digite o valor do gasto");
    if (!contaId) return setErro("Crie uma conta em Finanças → Contas primeiro");

    const categoria = categorias.find((c) => c.id === categoriaId);
    const dados = {
      tipo: "despesa" as const,
      valor,
      contaId,
      categoriaId,
      descricao: descricao.trim() || categoria?.nome || "",
      data: dataCupom ?? new Date().toLocaleDateString("sv-SE"),
    };
    try {
      localStorage.setItem(CHAVE_ULTIMA_CONTA, contaId);
    } catch {}

    setSalvando(true);
    try {
      if (!navigator.onLine) {
        adicionarNaFila({ id: crypto.randomUUID?.() ?? String(Date.now()), tipo: "criar_transacao", dados });
        setFeito(`R$ ${valor} guardado — lança quando voltar a internet`);
      } else {
        const r = await criarTransacaoSilenciosa(dados);
        if (!r.sucesso) {
          setErro(r.erro ?? "Não consegui lançar. Tente de novo.");
          return;
        }
        setFeito(`R$ ${valor}${categoria ? ` em ${categoria.nome}` : ""} lançado!`);
        atualizarSnapshotEmTodasAsTelas();
      }
      setValor("");
      setDescricao("");
      setCategoriaId("");
      setCategoriaTocada(false);
      setCategoriaSugerida(false);
      setDataCupom(null);
      setTimeout(aoFechar, 1100);
    } catch {
      setErro("Não deu pra lançar. Se o app acabou de atualizar, feche e abra de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/60" onClick={aoFechar}>
      <div
        className="w-full max-w-md bg-base-800 border-t border-base-600 rounded-t-2xl p-5 pb-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-semibold flex items-center gap-2">
            <Zap size={16} className="text-financa" /> Gasto rápido
          </p>
          <button onClick={aoFechar} aria-label="Fechar" className="text-ink-400 hover:text-ink-100 transition">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {feito ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="w-14 h-14 rounded-full bg-habito/20 text-habito flex items-center justify-center mb-3">
              <Check size={28} strokeWidth={2.5} />
            </span>
            <p className="font-medium">{feito}</p>
          </div>
        ) : contas.length === 0 ? (
          <p className="text-sm text-ink-400 mb-5">
            Crie uma conta em <Link href="/financas/contas" onClick={aoFechar} className="text-financa underline">Finanças → Contas</Link> pra lançar gastos.
          </p>
        ) : (
          <div className="mb-6">
            <div className="flex items-baseline gap-2 border-b-2 border-financa/60 pb-1 mb-4">
              <span className="text-2xl font-mono text-ink-400">R$</span>
              <input
                ref={campoValor}
                inputMode="numeric"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(formatarValorDigitado(e.target.value))}
                className="flex-1 min-w-0 bg-transparent text-4xl font-mono font-semibold text-ink-100 outline-none"
              />
              <button
                type="button"
                onClick={() => campoFoto.current?.click()}
                disabled={lendo !== null}
                aria-label="Ler cupom pela câmera"
                className="shrink-0 flex items-center gap-1 text-xs text-financa border border-financa/40 rounded-lg px-2 py-1.5 hover:bg-financa/10 transition disabled:opacity-50"
              >
                <Camera size={15} strokeWidth={2} />
                {lendo !== null ? `${lendo}%` : "Cupom"}
              </button>
              <input
                ref={campoFoto}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => lerCupom(e.target.files?.[0])}
              />
            </div>

            {lendo !== null && (
              <p className="text-xs text-ink-400 mb-3">Lendo o cupom... (na 1ª vez baixa o leitor, pode levar alguns segundos)</p>
            )}
            {avisoCupom && lendo === null && <p className="text-xs text-amber-400 mb-3">{avisoCupom}</p>}
            {dataCupom && (
              <p className="text-xs text-ink-400 mb-3 flex items-center gap-2">
                Data do cupom: {dataCupom.split("-").reverse().join("/")}
                <button type="button" onClick={() => setDataCupom(null)} className="underline">
                  usar hoje
                </button>
              </p>
            )}

            {categorias.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {categorias.map((c) => {
                  const ativa = categoriaId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategoriaId(ativa ? "" : c.id);
                        setCategoriaTocada(true);
                        setCategoriaSugerida(false);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition ${
                        ativa ? "border-financa bg-financa/15" : "border-base-600 hover:border-ink-400"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${classeFundoSuave(c.cor ?? "financa")} ${classeTextoCor(
                          c.cor ?? "financa"
                        )}`}
                      >
                        <IconeCategoria icone={c.icone ?? null} />
                      </span>
                      <span className="text-xs leading-tight text-center line-clamp-2">{c.nome}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {categoriaSugerida && <p className="text-xs text-financa -mt-1 mb-2">✨ Categoria sugerida pela descrição</p>}
            <div className="flex gap-2 mb-3">
              <input
                value={descricao}
                onChange={(e) => mudarDescricao(e.target.value)}
                maxLength={200}
                placeholder="Descrição (opcional)"
                className="flex-1 min-w-0 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none"
              />
              {contas.length > 1 && (
                <select
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="w-32 bg-base-900 border border-base-600 rounded-lg px-2 py-2 text-sm text-ink-100 outline-none"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Etapa 228 — sugestões só aparecem enquanto digita, sem valor */}
            <div className="-mt-2 mb-3 empty:hidden">
              <ChipsDescricao sugestoes={sugestoesDescricao} aoEscolher={escolherDescricao} textoAtual={descricao} />
            </div>

            {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

            <button
              onClick={lancar}
              disabled={salvando}
              className="w-full bg-financa text-base-900 font-semibold rounded-xl py-3.5 hover:opacity-90 transition disabled:opacity-50"
            >
              {salvando ? "Lançando..." : valor ? `Lançar R$ ${valor}` : "Lançar gasto"}
            </button>
          </div>
        )}

        {!feito && (
          <>
            <p className="text-xs text-ink-400 mb-2">Ou abra o formulário completo</p>
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/financas/nova?tipo=despesa"
                onClick={aoFechar}
                className="flex flex-col items-center gap-1 border border-red-400/40 text-red-400 rounded-xl py-3 hover:bg-red-400/10 transition"
              >
                <TrendingDown size={18} strokeWidth={2} />
                <span className="text-xs font-medium">Despesa</span>
              </Link>
              <Link
                href="/financas/nova?tipo=receita"
                onClick={aoFechar}
                className="flex flex-col items-center gap-1 border border-habito/40 text-habito rounded-xl py-3 hover:bg-habito/10 transition"
              >
                <TrendingUp size={18} strokeWidth={2} />
                <span className="text-xs font-medium">Receita</span>
              </Link>
              <Link
                href="/financas/transferir"
                onClick={aoFechar}
                className="flex flex-col items-center gap-1 border border-base-600 text-ink-100 rounded-xl py-3 hover:bg-base-700 transition"
              >
                <ArrowLeftRight size={18} strokeWidth={2} />
                <span className="text-xs font-medium">Transferir</span>
              </Link>
              <Link
                href="/financas/investir"
                onClick={aoFechar}
                className="flex flex-col items-center gap-1 border border-financa/40 text-financa rounded-xl py-3 hover:bg-financa/10 transition"
              >
                <PiggyBank size={18} strokeWidth={2} />
                <span className="text-xs font-medium">Investir</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
