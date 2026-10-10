"use client";

// Etapa 281 — calendário único: num só mês, hábitos (verde), tarefas
// (lilás) e dinheiro (dourado). Tocar no dia mostra tudo dele.
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { calendarioDoMes, diasDoMes } from "@/lib/geral/calendarioUnico";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { tarefaApareceNoDia } from "@/lib/agenda/recorrencia";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { CarregandoTela } from "@/components/Esqueleto";
import { IconeHabito } from "@/components/IconeHabito";
import { IconeCategoria } from "@/components/IconeCategoria";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7);
}

export default function CalendarioPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function Conteudo() {
  const params = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const ocultos = useValoresOcultos();
  const hoje = hojeISO();
  const mParam = params.get("m");
  const [mes, setMes] = useState(mParam && /^\d{4}-\d{2}$/.test(mParam) ? mParam : hoje.slice(0, 7));
  const [dia, setDia] = useState<string>(hoje.slice(0, 7) === mes ? hoje : `${mes}-01`);

  const mapa = useMemo(() => (snapshot ? calendarioDoMes(snapshot, mes, hoje) : null), [snapshot, mes, hoje]);

  if (snapshot === undefined) return <CarregandoTela cartoes={1} linhas={4} />;
  if (!snapshot || !mapa) return <main className="pagina px-6 pt-6 text-ink-400">Abra o app com internet uma vez pra montar o calendário.</main>;

  const dias = diasDoMes(mes);
  const offset = new Date(dias[0] + "T12:00:00").getDay();
  const nomeMes = new Date(mes + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const dinheiro = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));

  function mudarMes(n: number) {
    const novo = somarMeses(mes, n);
    setMes(novo);
    setDia(novo === hoje.slice(0, 7) ? hoje : `${novo}-01`);
  }

  // detalhes do dia escolhido
  const meuId = snapshot.perfil.id;
  const habitosDoDia = (snapshot.habitos as any[])
    .filter((h) => !h.eh_negativo && !h.arquivado && h.frequencia !== "semanal" && habitoDevidoNoDia(h, dia))
    .map((h) => {
      const meta = Math.max(1, Number(h.meta_diaria) || 1);
      const q = (snapshot.habitoCheckins as any[])
        .filter((c) => c.habito_id === h.id && c.data === dia && (!c.usuario_id || c.usuario_id === meuId))
        .reduce((s, c) => s + Number(c.quantidade ?? 1), 0);
      return { h, feito: q >= meta };
    });
  const conclusoes = new Set(snapshot.conclusoesTarefas.filter((c) => c.data === dia).map((c) => c.tarefa_id));
  const tarefasDoDia = (snapshot.tarefas as any[])
    .filter((t) => !t.arquivada && tarefaApareceNoDia(t, dia))
    .map((t) => ({ t, feita: t.repetir === "nenhuma" ? !!t.concluida : conclusoes.has(t.id) }));
  const categorias = new Map((snapshot.financas.categorias as any[]).map((c) => [c.id, c]));
  const lancamentos = (snapshot.financas.transacoes as any[]).filter((t) => t.data === dia && !t.transferencia_grupo);
  const infoDia = mapa.get(dia);
  const tituloDia = new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <main className="pagina px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/dashboard" voltarTexto="Início" emoji="📅" titulo="Calendário" subtitulo="Hábitos, tarefas e dinheiro num lugar só." />

      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="w-10 h-10 rounded-full border border-base-600 flex items-center justify-center hover:border-ink-400">
          <ChevronLeft size={18} />
        </button>
        <p className="text-lg font-semibold capitalize">{nomeMes}</p>
        <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês" className="w-10 h-10 rounded-full border border-base-600 flex items-center justify-center hover:border-ink-400">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-base-800 border border-base-600 rounded-3xl p-3">
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {SEMANA.map((s, i) => (
            <span key={i} className="text-xs text-ink-400">
              {s}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`v${i}`} />
          ))}
          {dias.map((d) => {
            const info = mapa.get(d)!;
            const escolhido = d === dia;
            const ehHoje = d === hoje;
            const todosHabitos = info.habitosDevidos > 0 && info.habitosFeitos >= info.habitosDevidos;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDia(d)}
                aria-label={d}
                aria-pressed={escolhido}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm transition ${
                  escolhido ? "bg-ink-100 text-base-900 font-semibold" : ehHoje ? "ring-2 ring-ink-100" : "hover:bg-base-700"
                } ${d > hoje && !escolhido ? "text-ink-400" : ""}`}
              >
                <span className="leading-none">{Number(d.slice(8))}</span>
                <span className="flex gap-0.5 h-1.5">
                  {info.habitosFeitos > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${todosHabitos ? "bg-habito" : "bg-habito/50"}`} />
                  )}
                  {info.tarefas > 0 && <span className={`w-1.5 h-1.5 rounded-full ${info.tarefasFeitas >= info.tarefas ? "bg-nota" : "bg-nota/50"}`} />}
                  {(info.despesas > 0 || info.receitas > 0) && (
                    <span className={`w-1.5 h-1.5 rounded-full ${info.agendado ? "bg-financa/50" : "bg-financa"}`} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-[11px] text-ink-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-habito" /> hábitos</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nota" /> tarefas</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-financa" /> dinheiro</span>
          <span>· apagado = falta / agendado</span>
        </div>
      </div>

      {/* o dia escolhido */}
      <section key={dia} className="mt-6 entrada-avancar">
        <h2 className="text-lg font-semibold capitalize mb-3">{tituloDia}</h2>

        {habitosDoDia.length === 0 && tarefasDoDia.length === 0 && lancamentos.length === 0 && (
          <p className="text-sm text-ink-400 bg-base-800 border border-base-600 rounded-2xl px-4 py-3">Nada nesse dia. 🌤️</p>
        )}

        {habitosDoDia.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-habito mb-2">
              Hábitos {infoDia && dia <= hoje ? `· ${infoDia.habitosFeitos}/${infoDia.habitosDevidos}` : ""}
            </p>
            <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden">
              {habitosDoDia.map(({ h, feito }) => (
                <li key={h.id}>
                  <Link href={`/habitos/${h.id}`} className="flex items-center gap-3 px-4 py-2.5">
                    <IconeHabito icone={h.icone} tamanho={17} />
                    <span className={`flex-1 truncate text-sm ${feito ? "" : "text-ink-400"}`}>{h.nome}</span>
                    <span className={`text-sm ${feito ? "text-habito" : "text-ink-400"}`}>{dia > hoje ? "" : feito ? "✓" : "—"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tarefasDoDia.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-nota mb-2">Tarefas</p>
            <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden">
              {tarefasDoDia.map(({ t, feita }) => (
                <li key={t.id}>
                  <Link href={`/tarefas/${t.id}`} className="flex items-center gap-3 px-4 py-2.5">
                    <IconeHabito icone={t.icone} tamanho={17} />
                    <span className={`flex-1 truncate text-sm ${feita ? "line-through text-ink-400" : ""}`}>{t.titulo}</span>
                    {t.horario_lembrete && <span className="text-xs text-ink-400">{String(t.horario_lembrete).slice(0, 5)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lancamentos.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-financa mb-2">Dinheiro</p>
            <ul className="bg-base-800 border border-base-600 rounded-2xl divide-y divide-base-600 overflow-hidden">
              {lancamentos.map((t) => {
                const cat = t.categoria_id ? categorias.get(t.categoria_id) : null;
                const receita = t.tipo === "receita";
                return (
                  <li key={t.id}>
                    <Link href={`/financas/${t.id}/editar`} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 flex justify-center">{cat?.icone ? <IconeCategoria icone={cat.icone} tamanho={16} /> : receita ? "💰" : "💸"}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm">{t.descricao || cat?.nome || (receita ? "Receita" : "Gasto")}</span>
                        {t.data > hoje && !t.pago_em && <span className="block text-[11px] text-financa">agendado</span>}
                      </span>
                      <span className={`font-mono text-sm ${receita ? "text-habito" : "text-red-400"}`}>
                        {receita ? "+" : "−"}
                        {dinheiro(Number(t.valor))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
