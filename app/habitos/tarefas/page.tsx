"use client";

// Etapa 127
// Etapa 259 — Tarefas de cara nova: resumo do dia, adicionar rápido,
// filtro por categoria e duas formas de ver (por data ou por categoria),
// concluir com um toque e "Organizar" pra arrastar a ordem.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, FolderKanban, GripVertical, Plus, Trash2, Settings2 } from "lucide-react";
import { ListaTarefasArrastavel } from "@/components/ListaTarefasArrastavel";
import { AlternadorHabitosTarefas } from "@/components/AlternadorHabitosTarefas";
import { LinhaTarefa } from "@/components/LinhaTarefa";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Esqueleto } from "@/components/Esqueleto";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { adicionarNaFila } from "@/lib/offline/fila";
import { hojeISO } from "@/lib/habitos/streak";
import { hexDaCor } from "@/lib/agenda/estilo";
import { tarefaAtrasada } from "@/lib/agenda/recorrencia";
import { ORDEM_GRUPOS, NOMES_GRUPO, agruparTarefas, resumoTarefas, somarDias } from "@/lib/agenda/tarefasLista";
import { alternarConclusaoTarefa, criarTarefaRapida } from "./actions";
import { vibrar } from "@/lib/app/vibrar";

type Modo = "data" | "categoria" | "organizar";
const CHAVE_MODO = "vidatrack-tarefas-modo";
const COR_SEM = "#8A8F98";

export default function TarefasPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [modo, setModo] = useState<Modo>("data");
  const [filtro, setFiltro] = useState<string>("todas"); // "todas" | "sem" | id
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
  // marcações feitas agora (antes do retrato atualizar)
  const [local, setLocal] = useState<Record<string, boolean>>({});
  // adicionar rápido
  const [texto, setTexto] = useState("");
  const [quando, setQuando] = useState<"hoje" | "amanha">("hoje");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    try {
      const m = localStorage.getItem(CHAVE_MODO);
      if (m === "data" || m === "categoria") setModo(m);
    } catch {}
  }, []);
  function trocarModo(m: Modo) {
    setModo(m);
    if (m !== "organizar") {
      try {
        localStorage.setItem(CHAVE_MODO, m);
      } catch {}
    }
  }

  const categorias = (snapshot?.categoriasProdutividade ?? []) as { id: string; nome: string; cor: string }[];
  const mapaCat = new Map(categorias.map((c) => [c.id, c]));
  const corDe = (id?: string | null) => (id && mapaCat.get(id) ? hexDaCor(mapaCat.get(id)!.cor) : COR_SEM);

  const todas = useMemo(() => [...((snapshot?.tarefas ?? []) as any[])].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)), [snapshot]);

  // conclusões de hoje, com as marcações locais por cima
  const conclusoesHoje = useMemo(() => {
    const s = new Set((snapshot?.conclusoesTarefas ?? []).filter((c) => c.data === hoje).map((c) => c.tarefa_id));
    for (const [id, v] of Object.entries(local)) v ? s.add(id) : s.delete(id);
    return s;
  }, [snapshot, hoje, local]);
  const comLocal = useMemo(
    () => todas.map((t) => (t.repetir === "nenhuma" && id_in(local, t.id) ? { ...t, concluida: local[t.id] } : t)),
    [todas, local]
  );

  const filtradas = comLocal.filter((t) => (filtro === "todas" ? true : filtro === "sem" ? !t.categoria_id || !mapaCat.has(t.categoria_id) : t.categoria_id === filtro));
  const grupos = useMemo(() => agruparTarefas(filtradas, hoje, conclusoesHoje), [filtradas, hoje, conclusoesHoje]);
  const resumo = resumoTarefas(filtradas, hoje, conclusoesHoje);

  const contagemCat = (id: string | "sem") =>
    comLocal.filter((t) => (id === "sem" ? !t.categoria_id || !mapaCat.has(t.categoria_id) : t.categoria_id === id) && !(t.repetir === "nenhuma" && t.concluida)).length;

  async function alternar(t: any) {
    const feitaAgora = t.repetir === "nenhuma" ? !!t.concluida : conclusoesHoje.has(t.id);
    vibrar(feitaAgora ? 10 : [15, 40, 25]);
    setLocal((l) => ({ ...l, [t.id]: !feitaAgora }));
    try {
      if (!navigator.onLine) {
        adicionarNaFila({ tipo: "conclusao_tarefa", tarefaId: t.id, data: hoje });
        return;
      }
      await alternarConclusaoTarefa(t.id, hoje);
      await atualizarSnapshotEmTodasAsTelas();
    } catch {
      setLocal((l) => ({ ...l, [t.id]: feitaAgora }));
    }
  }

  async function adicionar() {
    const titulo = texto.trim();
    if (!titulo || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      const r = await criarTarefaRapida({
        titulo,
        categoriaId: filtro !== "todas" && filtro !== "sem" ? filtro : null,
        data: quando === "hoje" ? hoje : somarDias(hoje, 1),
      });
      if (r.erro) setErro(r.erro);
      else {
        setTexto("");
        vibrar(15);
        await atualizarSnapshotEmTodasAsTelas();
      }
    } catch {
      setErro("Sem internet? Use o + Nova quando voltar a conexão.");
    }
    setSalvando(false);
  }

  const linha = (t: any, mostrarCategoria: boolean) => (
    <LinhaTarefa
      key={t.id}
      tarefa={t}
      feita={t._feita}
      proxima={t._proxima}
      hoje={hoje}
      atrasada={tarefaAtrasada(t, hoje)}
      cor={corDe(t.categoria_id)}
      nomeCategoria={mostrarCategoria && t.categoria_id ? mapaCat.get(t.categoria_id)?.nome : null}
      aoAlternar={() => alternar(t)}
    />
  );

  const pctHoje = resumo.deHoje ? Math.round((resumo.feitasHoje / resumo.deHoje) * 100) : 0;
  const raio = 30;
  const volta = 2 * Math.PI * raio;

  return (
    <main className="pagina px-6 md:px-12 pt-2 pb-10">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-display font-bold">Tarefas</h1>
        <Link href={filtro !== "todas" && filtro !== "sem" ? `/habitos/tarefas/nova?categoria=${filtro}` : "/habitos/tarefas/nova"} className="flex items-center gap-1.5 bg-nota text-base-900 text-sm font-semibold rounded-full px-4 py-2 hover:opacity-90 transition">
          <Plus size={16} strokeWidth={2.6} /> Nova
        </Link>
      </div>

      <AlternadorHabitosTarefas ativo="tarefas" />

      {snapshot === undefined ? (
        <Esqueleto linhas={4} />
      ) : todas.length === 0 ? (
        <EstadoVazio tom="nota" emoji="📝" titulo="Nenhuma tarefa ainda" texto="Tarefas podem ser únicas (com data) ou repetir — e dá pra separar por categoria." acao={{ rotulo: "+ Criar a primeira", href: "/habitos/tarefas/nova" }} />
      ) : (
        <>
          {/* Resumo do dia */}
          <section className="relative overflow-hidden rounded-3xl p-5 mb-4 border border-nota/30" style={{ background: "linear-gradient(135deg, rgba(156,143,217,0.22), rgba(156,143,217,0.05))" }}>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
                  <circle cx="36" cy="36" r={raio} fill="none" stroke="rgb(var(--c-ink-400) / 0.2)" strokeWidth="7" />
                  <circle cx="36" cy="36" r={raio} fill="none" stroke="#9C8FD9" strokeWidth="7" strokeLinecap="round" strokeDasharray={volta} strokeDashoffset={volta * (1 - pctHoje / 100)} style={{ transition: "stroke-dashoffset .8s ease-out" }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-display font-bold">
                  {resumo.feitasHoje}/{resumo.deHoje}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold">
                  {resumo.deHoje === 0 ? "Nada marcado pra hoje" : resumo.feitasHoje === resumo.deHoje ? "Tudo feito hoje! 🎉" : `Faltam ${resumo.deHoje - resumo.feitasHoje} hoje`}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {resumo.atrasadas > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-400/15 text-red-400">⏰ {resumo.atrasadas} atrasada{resumo.atrasadas > 1 ? "s" : ""}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-base-900/50 text-ink-400">📅 {resumo.semana} nos próximos dias</span>
                </div>
              </div>
            </div>
          </section>

          {/* Adicionar rápido */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              adicionar();
            }}
            className="flex items-center gap-2 bg-base-800 border border-base-600 rounded-2xl pl-4 pr-1.5 py-1.5 mb-1 focus-within:border-nota transition"
          >
            <Plus size={18} className="text-nota shrink-0" />
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={filtro !== "todas" && filtro !== "sem" ? `Nova tarefa em ${mapaCat.get(filtro)?.nome ?? ""}…` : "Adicionar tarefa…"}
              className="flex-1 min-w-0 bg-transparent py-2 text-base outline-none placeholder:text-ink-400"
              maxLength={200}
            />
            <button
              type="button"
              onClick={() => setQuando((q) => (q === "hoje" ? "amanha" : "hoje"))}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-full border border-base-600 text-ink-400"
              title="Quando"
            >
              {quando === "hoje" ? "Hoje" : "Amanhã"}
            </button>
            <button type="submit" disabled={!texto.trim() || salvando} className="shrink-0 bg-nota text-base-900 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-40">
              {salvando ? "…" : "Adicionar"}
            </button>
          </form>
          {erro && <p className="text-xs text-red-400 mb-2">{erro}</p>}
          <p className="text-xs text-ink-400 mb-4">Pra repetir, lembrete ou subtarefas, use o <Link href="/habitos/tarefas/nova" className="underline">+ Nova</Link>.</p>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 pb-1 mb-3">
            {[{ id: "todas", nome: "Todas", cor: "" }, ...categorias, { id: "sem", nome: "Sem categoria", cor: "" }].map((c) => {
              const ativo = filtro === c.id;
              const cor = c.id === "todas" ? "#9C8FD9" : c.id === "sem" ? COR_SEM : hexDaCor(c.cor);
              const n = c.id === "todas" ? comLocal.filter((t) => !(t.repetir === "nenhuma" && t.concluida)).length : contagemCat(c.id);
              if (c.id === "sem" && n === 0) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFiltro(c.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition ${ativo ? "font-semibold text-base-900" : "border-base-600 text-ink-400 hover:text-ink-100"}`}
                  style={ativo ? { background: cor, borderColor: cor } : undefined}
                >
                  {c.id !== "todas" && <span className="w-2 h-2 rounded-full" style={{ background: ativo ? "rgba(0,0,0,0.35)" : cor }} />}
                  {c.nome}
                  <span className={ativo ? "opacity-70" : "opacity-60"}>{n}</span>
                </button>
              );
            })}
            <Link href="/habitos/categorias" className="shrink-0 flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-dashed border-base-600 text-ink-400 hover:text-ink-100">
              <Settings2 size={14} /> Categorias
            </Link>
          </div>

          {/* Modo de ver */}
          <div className="flex items-center gap-1 bg-base-800 border border-base-600 rounded-2xl p-1 mb-5">
            {([
              ["data", "Por data", CalendarDays],
              ["categoria", "Por categoria", FolderKanban],
              ["organizar", "Organizar", GripVertical],
            ] as const).map(([m, rotulo, Icone]) => (
              <button
                key={m}
                type="button"
                onClick={() => trocarModo(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-xl transition ${modo === m ? "bg-base-700 text-ink-100 font-medium" : "text-ink-400"}`}
              >
                <Icone size={15} /> {rotulo}
              </button>
            ))}
          </div>

          {modo === "organizar" ? (
            <>
              <p className="text-xs text-ink-400 mb-3">Arraste ⠿ para mudar a ordem (vale dentro de cada grupo).</p>
              <ListaTarefasArrastavel tarefas={filtradas as any} />
            </>
          ) : modo === "data" ? (
            <div className="space-y-6">
              {ORDEM_GRUPOS.map((g) => {
                const lista = grupos.get(g)!;
                if (!lista.length) return null;
                const concluidas = g === "concluidas";
                const visiveis = concluidas ? (mostrarConcluidas ? lista.slice(0, 30) : []) : lista;
                return (
                  <section key={g}>
                    <button
                      type="button"
                      disabled={!concluidas}
                      onClick={() => setMostrarConcluidas((v) => !v)}
                      className="w-full flex items-center gap-2 mb-2 text-left"
                    >
                      <span className="text-base">{NOMES_GRUPO[g].emoji}</span>
                      <h2 className={`text-base font-semibold ${g === "atrasadas" ? "text-red-400" : ""}`}>{NOMES_GRUPO[g].titulo}</h2>
                      <span className="text-xs text-ink-400 bg-base-800 border border-base-600 rounded-full px-2 py-0.5">{lista.length}</span>
                      {concluidas && <ChevronDown size={16} className={`ml-auto text-ink-400 transition ${mostrarConcluidas ? "rotate-180" : ""}`} />}
                    </button>
                    <div className="space-y-2">{visiveis.map((t) => linha(t, filtro === "todas"))}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {[...categorias, { id: "sem", nome: "Sem categoria", cor: "" }]
                .filter((c) => filtro === "todas" || filtro === c.id)
                .map((c) => {
                  const ehSem = c.id === "sem";
                  const daCat = ORDEM_GRUPOS.filter((g) => g !== "concluidas").flatMap((g) =>
                    grupos.get(g)!.filter((t) => (ehSem ? !t.categoria_id || !mapaCat.has(t.categoria_id) : t.categoria_id === c.id))
                  );
                  if (!daCat.length) return null;
                  const cor = ehSem ? COR_SEM : hexDaCor(c.cor);
                  const feitas = daCat.filter((t) => t._feita).length;
                  return (
                    <section key={c.id} className="rounded-3xl border border-base-600 bg-base-900/40 p-3">
                      <div className="flex items-center gap-2 px-1 mb-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: cor }} />
                        <h2 className="text-base font-semibold flex-1 truncate">{c.nome}</h2>
                        <span className="text-xs text-ink-400">
                          {feitas}/{daCat.length}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-base-800 mx-1 mb-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(feitas / daCat.length) * 100}%`, background: cor }} />
                      </div>
                      <div className="space-y-2">{daCat.map((t) => linha(t, false))}</div>
                    </section>
                  );
                })}
            </div>
          )}

          {filtradas.length === 0 && (
            <EstadoVazio compacto tom="nota" emoji="🗂️" titulo="Nada nesta categoria" texto="Use o campo acima pra adicionar a primeira." />
          )}

          <Link href="/habitos/tarefas/lixeira" className="mt-8 flex items-center justify-center gap-1.5 text-xs text-ink-400 hover:text-ink-100 transition">
            <Trash2 size={13} /> Lixeira de tarefas
          </Link>
        </>
      )}
    </main>
  );
}

function id_in(o: Record<string, boolean>, id: string) {
  return Object.prototype.hasOwnProperty.call(o, id);
}
