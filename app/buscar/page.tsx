"use client";

// Etapa 215 — busca geral: lançamentos, hábitos, tarefas, metas, contas...
// Etapa 279 — resultados agrupados, ícones de verdade, buscas recentes,
// atalhos quando o campo está vazio e ações com o texto digitado
// ("criar tarefa ...", "lançar gasto ...").
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Plus, Wallet, CheckSquare, Sparkles, ChevronRight } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { agruparResultados, buscarNoSnapshot, type ResultadoBusca } from "@/lib/geral/busca";
import { ValorMonetario } from "@/components/ValorMonetario";
import { IconeHabito } from "@/components/IconeHabito";
import { IconeCategoria } from "@/components/IconeCategoria";

const EMOJI: Record<ResultadoBusca["tipo"], string> = {
  lancamento: "💸",
  habito: "✅",
  tarefa: "📝",
  meta: "🎯",
  conta: "🏦",
  categoria: "🏷️",
  diario: "🙂",
};

const ATALHOS = [
  { href: "/financas/nova", emoji: "💸", titulo: "Lançar gasto" },
  { href: "/tarefas/nova", emoji: "📝", titulo: "Nova tarefa" },
  { href: "/habitos/novo", emoji: "🌱", titulo: "Novo hábito" },
  { href: "/financas/extrato", emoji: "📄", titulo: "Extrato" },
  { href: "/tarefas/revisao", emoji: "🧹", titulo: "Revisar semana" },
  { href: "/calendario", emoji: "📅", titulo: "Calendário" },
  { href: "/rapido", emoji: "⚡", titulo: "Modo rápido" },
  { href: "/habitos/jardim", emoji: "🌳", titulo: "Jardim" },
  { href: "/resumo-dia", emoji: "🌙", titulo: "Resumo do dia" },
  { href: "/financas/metas", emoji: "🎯", titulo: "Metas" },
  { href: "/convites", emoji: "📩", titulo: "Convites" },
];

const CHAVE_RECENTES = "vidatrack-buscas-recentes";

function lerRecentes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}
function guardarRecente(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  try {
    const lista = [t, ...lerRecentes().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista));
  } catch {
    /* sem armazenamento */
  }
}

function IconeResultado({ r }: { r: ResultadoBusca }) {
  if (r.icone && (r.tipo === "habito" || r.tipo === "tarefa")) return <IconeHabito icone={r.icone} tamanho={18} />;
  if (r.icone && (r.tipo === "categoria" || r.tipo === "lancamento")) return <IconeCategoria icone={r.icone} tamanho={18} />;
  return <span className="text-lg">{EMOJI[r.tipo]}</span>;
}

export default function BuscarPage() {
  const { snapshot } = useSnapshotOffline();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [recentes, setRecentes] = useState<string[]>([]);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
    setRecentes(lerRecentes());
  }, []);

  const resultados = useMemo(() => (snapshot ? buscarNoSnapshot(snapshot, q) : []), [snapshot, q]);
  const grupos = useMemo(() => agruparResultados(resultados), [resultados]);
  const texto = q.trim();

  function abrir(href: string) {
    guardarRecente(q);
    router.push(href);
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Painel
      </Link>
      <div className="relative mt-4 mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          ref={campo}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && resultados[0]) abrir(resultados[0].href);
          }}
          type="search"
          enterKeyHint="search"
          placeholder="Buscar lançamento, hábito, tarefa, valor..."
          className="w-full bg-base-800 border border-base-600 rounded-2xl pl-10 pr-10 py-3.5 text-ink-100 outline-none focus:border-ink-100"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Limpar" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            <X size={16} />
          </button>
        )}
      </div>

      {texto.length < 2 ? (
        <>
          {recentes.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Buscas recentes</h2>
              <div className="flex flex-wrap gap-2">
                {recentes.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQ(r)}
                    className="flex items-center gap-1.5 rounded-full border border-base-600 bg-base-800 px-3 py-1.5 text-sm hover:border-ink-400 transition"
                  >
                    <Clock size={13} className="text-ink-400" /> {r}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="text-xs uppercase tracking-wide text-ink-400 mb-2">Atalhos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lista-entrar">
              {ATALHOS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2.5 bg-base-800 border border-base-600 rounded-2xl px-3 py-3 hover:border-ink-400 transition active:scale-[0.98]"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-sm font-medium">{a.titulo}</span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-ink-400 mt-4">Dica: dá pra buscar por valor também (ex: 45,90).</p>
          </section>
        </>
      ) : (
        <>
          {/* ações com o texto digitado */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-none">
            <Link
              href={`/tarefas/nova?titulo=${encodeURIComponent(texto)}`}
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-nota/15 text-nota px-3 py-1.5 text-sm font-medium"
            >
              <CheckSquare size={14} /> Criar tarefa “{texto.length > 18 ? texto.slice(0, 18) + "…" : texto}”
            </Link>
            <Link
              href="/financas/nova"
              className="shrink-0 flex items-center gap-1.5 rounded-full bg-financa/15 text-financa px-3 py-1.5 text-sm font-medium"
            >
              <Wallet size={14} /> Lançar gasto
            </Link>
            <Link
              href={`/financas/extrato?busca=${encodeURIComponent(texto)}&tudo=1`}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-base-600 px-3 py-1.5 text-sm text-ink-400"
            >
              <Sparkles size={14} /> No extrato
            </Link>
          </div>

          {resultados.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🔎</p>
              <p className="text-sm text-ink-400">Nada encontrado pra “{texto}”.</p>
              <Link href={`/tarefas/nova?titulo=${encodeURIComponent(texto)}`} className="inline-flex items-center gap-1 mt-3 text-sm text-nota">
                <Plus size={14} /> Criar como tarefa
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {grupos.map((g) => (
                <section key={g.titulo}>
                  <h2 className="flex items-baseline justify-between text-xs uppercase tracking-wide text-ink-400 mb-2 px-1">
                    {g.titulo}
                    <span className="normal-case tracking-normal">{g.itens.length}</span>
                  </h2>
                  <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden lista-entrar">
                    {g.itens.slice(0, g.titulo === "Lançamentos" ? 25 : 8).map((r, i) => (
                      <li key={`${r.href}-${i}`}>
                        <button
                          type="button"
                          onClick={() => abrir(r.href)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-base-700 transition"
                        >
                          <span className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center shrink-0">
                            <IconeResultado r={r} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm truncate">{r.titulo}</span>
                            <span className="block text-xs text-ink-400 truncate">{r.detalhe}</span>
                          </span>
                          {r.valor !== undefined ? (
                            <span className={`font-mono text-sm shrink-0 ${r.receita ? "text-habito" : "text-red-400"}`}>
                              {r.receita ? "+" : "−"}
                              <ValorMonetario valor={r.valor} />
                            </span>
                          ) : (
                            <ChevronRight size={16} className="text-ink-400 shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {resultados.length >= 60 && <p className="text-xs text-ink-400 text-center">Mostrando os 60 primeiros — refine a busca.</p>}
            </div>
          )}
        </>
      )}
    </main>
  );
}
