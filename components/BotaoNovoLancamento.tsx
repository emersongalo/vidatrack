"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, PiggyBank, X, Check, Zap, ArrowLeftRight } from "lucide-react";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { adicionarNaFila } from "@/lib/offline/fila";
import { criarTransacaoSilenciosa } from "@/app/financas/actions";
import { formatarValorDigitado } from "@/components/CampoValorMonetario";
import { IconeCategoria } from "@/components/IconeCategoria";
import { classeFundoSuave, classeTextoCor } from "@/lib/agenda/estilo";

const CHAVE_ULTIMA_CONTA = "vidatrack-gasto-rapido-conta";

type Conta = { id: string; nome: string; tipo: string; dono_id?: string };
type Categoria = { id: string; nome: string; tipo: string; icone?: string | null; cor?: string | null; dono_id?: string };

/**
 * Etapa 135 — o "+" abre uma folha perguntando o que lançar.
 * Etapa 204 — "Gasto rápido" no topo da folha: valor → categoria →
 * pronto, sem sair da tela (3 toques). Categorias mais usadas nos
 * últimos 60 dias aparecem primeiro; a conta fica lembrada. Sem
 * internet, vai pra fila e sincroniza depois.
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

  // categorias de despesa, as mais usadas nos últimos 60 dias primeiro
  const categorias: Categoria[] = useMemo(() => {
    const todas = ((snapshot?.financas.categorias ?? []) as Categoria[]).filter(
      (c) => c.tipo === "despesa" && (!c.dono_id || c.dono_id === meuId)
    );
    const limite = new Date(Date.now() - 60 * 86400000).toLocaleDateString("sv-SE");
    const uso = new Map<string, number>();
    for (const t of (snapshot?.financas.transacoes ?? []) as any[]) {
      if (t.tipo === "despesa" && t.categoria_id && t.data >= limite) uso.set(t.categoria_id, (uso.get(t.categoria_id) ?? 0) + 1);
    }
    return [...todas].sort((a, b) => (uso.get(b.id) ?? 0) - (uso.get(a.id) ?? 0) || a.nome.localeCompare(b.nome)).slice(0, 8);
  }, [snapshot, meuId]);

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
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<string | null>(null);
  const campoValor = useRef<HTMLInputElement>(null);

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
      data: new Date().toLocaleDateString("sv-SE"),
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
            </div>

            {categorias.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {categorias.map((c) => {
                  const ativa = categoriaId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoriaId(ativa ? "" : c.id)}
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
                      <span className="text-[11px] leading-tight text-center line-clamp-2">{c.nome}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
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
