"use client";

// Etapa 275 — revisão semanal guiada: passa uma tarefa por vez (atrasadas
// e sem data) e você decide na hora: concluir, hoje, amanhã, próxima
// semana ou apagar. No fim, mostra como ficou a semana.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, Sun, Sunrise, CalendarDays, Trash2, SkipForward, type LucideIcon } from "lucide-react";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { createClient } from "@/lib/supabase/client";
import { hojeISO } from "@/lib/habitos/streak";
import { tarefaAtrasada } from "@/lib/agenda/recorrencia";
import { agruparTarefas, rotuloData, somarDias } from "@/lib/agenda/tarefasLista";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";
import { IconeHabito } from "@/components/IconeHabito";
import { CarregandoTela } from "@/components/Esqueleto";
import { explodirEm, chuvaDeConfete, textoFlutuante } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";

type Decisao = "concluir" | "hoje" | "amanha" | "semana" | "apagar" | "pular";

/** Próxima segunda-feira (a partir de amanhã). */
function proximaSegunda(hoje: string) {
  for (let i = 1; i <= 7; i++) {
    const d = somarDias(hoje, i);
    if (new Date(d + "T12:00:00").getDay() === 1) return d;
  }
  return somarDias(hoje, 7);
}

export default function RevisaoSemanalPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  // a fila é montada uma vez (quando o retrato chega) e não muda enquanto revisa
  const fila = useRef<any[] | null>(null);
  if (fila.current === null && snapshot) {
    const tarefas = ((snapshot.tarefas ?? []) as any[]).filter((t) => t.repetir === "nenhuma" && !t.concluida);
    const atrasadas = tarefas.filter((t) => tarefaAtrasada(t, hoje)).sort((a, b) => String(a.data).localeCompare(String(b.data)));
    const semData = tarefas.filter((t) => !t.data);
    fila.current = [...atrasadas.map((t) => ({ ...t, _motivo: "atrasada" })), ...semData.map((t) => ({ ...t, _motivo: "sem data" }))];
  }
  const lista = fila.current ?? [];

  const [indice, setIndice] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [contagem, setContagem] = useState({ feitas: 0, agendadas: 0, apagadas: 0 });
  const [saindo, setSaindo] = useState<"esq" | "dir" | null>(null);
  const refCartao = useRef<HTMLDivElement>(null);
  const terminou = snapshot !== undefined && indice >= lista.length;
  const comemorou = useRef(false);

  const semana = useMemo(() => {
    if (!terminou || !snapshot) return [];
    const tarefas = (snapshot.tarefas ?? []) as any[];
    const grupos = agruparTarefas(tarefas, hoje, new Set());
    return [...(grupos.get("hoje") ?? []), ...(grupos.get("amanha") ?? []), ...(grupos.get("semana") ?? [])].filter((t) => !t._feita);
  }, [terminou, snapshot, hoje]);

  useEffect(() => {
    if (terminou && !comemorou.current && lista.length > 0) {
      comemorou.current = true;
      chuvaDeConfete({ quantidade: 60 });
    }
  }, [terminou, lista.length]);

  async function decidir(d: Decisao) {
    const t = lista[indice];
    if (!t || salvando) return;
    setErro(null);
    if (d === "pular") {
      avancar("dir");
      return;
    }
    setSalvando(true);
    try {
      const supabase = createClient();
      if (d === "concluir") {
        explodirEm(refCartao.current, { cor: "#9C8FD9", emojis: ["✨"] });
        vibrar([15, 40, 25]);
        await alternarConclusaoTarefa(t.id, hoje);
        setContagem((c) => ({ ...c, feitas: c.feitas + 1 }));
      } else if (d === "apagar") {
        // vai pra lixeira (arquivada) — dá pra restaurar em Tarefas → Lixeira
        const { error } = await supabase.from("tarefas").update({ arquivada: true }).eq("id", t.id);
        if (error) throw error;
        setContagem((c) => ({ ...c, apagadas: c.apagadas + 1 }));
      } else {
        const data = d === "hoje" ? hoje : d === "amanha" ? somarDias(hoje, 1) : proximaSegunda(hoje);
        const { error } = await supabase.from("tarefas").update({ data }).eq("id", t.id);
        if (error) throw error;
        textoFlutuante(refCartao.current, d === "hoje" ? "Pra hoje ☀️" : d === "amanha" ? "Amanhã 🌤️" : "Próxima semana 📅", "#9C8FD9");
        vibrar(10);
        setContagem((c) => ({ ...c, agendadas: c.agendadas + 1 }));
      }
      avancar(d === "apagar" ? "esq" : "dir");
      void atualizarSnapshotEmTodasAsTelas();
    } catch {
      setErro("Não salvou — confira a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  function avancar(lado: "esq" | "dir") {
    setSaindo(lado);
    setTimeout(() => {
      setSaindo(null);
      setIndice((i) => i + 1);
    }, 220);
  }

  if (snapshot === undefined) return <CarregandoTela comTopo={false} linhas={3} />;

  const atual = lista[indice];

  return (
    <main className="pagina-curta px-6 md:px-12 pt-2 pb-10">
      <Link href="/tarefas" className="inline-flex items-center gap-1 text-ink-400 text-base hover:text-ink-100 transition">
        <ChevronLeft size={18} /> Tarefas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-3">Revisão da semana</h1>

      {lista.length === 0 ? (
        <div className="mt-8 text-center animate-quicar">
          <p className="text-5xl mb-3">🧘</p>
          <p className="text-lg font-semibold">Tudo em ordem!</p>
          <p className="text-sm text-ink-400 mt-1">Nenhuma tarefa atrasada ou sem data. Aproveite a semana.</p>
          <Link href="/tarefas" className="inline-block mt-6 bg-nota text-base-900 font-semibold rounded-full px-5 py-2.5">
            Voltar pras tarefas
          </Link>
        </div>
      ) : !terminou && atual ? (
        <>
          <p className="text-sm text-ink-400 mt-1">
            Decida o que fazer com cada uma. {indice + 1} de {lista.length}
          </p>
          <div className="h-1.5 rounded-full bg-base-800 mt-3 overflow-hidden">
            <div className="h-full bg-nota rounded-full transition-[width] duration-500" style={{ width: `${(indice / lista.length) * 100}%` }} />
          </div>

          <div
            key={atual.id}
            ref={refCartao}
            className={`mt-6 rounded-3xl border border-nota/30 p-6 transition-all duration-200 ${
              saindo === "dir" ? "translate-x-16 opacity-0" : saindo === "esq" ? "-translate-x-16 opacity-0" : "animate-quicar"
            }`}
            style={{ background: "linear-gradient(135deg, rgba(156,143,217,0.18), rgba(156,143,217,0.04))" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  atual._motivo === "atrasada" ? "bg-red-400/15 text-red-400" : "bg-base-900/50 text-ink-400"
                }`}
              >
                {atual._motivo === "atrasada" ? `⏰ atrasada · era ${rotuloData(atual.data, hoje)}` : "📭 sem data"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-nota/15 text-nota flex items-center justify-center shrink-0">
                <IconeHabito icone={atual.icone} tamanho={22} />
              </span>
              <p className="text-xl font-semibold leading-snug break-words min-w-0">{atual.titulo}</p>
            </div>
            {atual.observacoes && <p className="text-sm text-ink-400 mt-3 line-clamp-3 whitespace-pre-wrap">{atual.observacoes}</p>}
          </div>

          {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}

          <div className="grid grid-cols-2 gap-2 mt-5">
            <BotaoDecisao onClick={() => decidir("concluir")} disabled={salvando} destaque Icone={Check} texto="Já fiz" />
            <BotaoDecisao onClick={() => decidir("hoje")} disabled={salvando} Icone={Sun} texto="Fazer hoje" />
            <BotaoDecisao onClick={() => decidir("amanha")} disabled={salvando} Icone={Sunrise} texto="Amanhã" />
            <BotaoDecisao onClick={() => decidir("semana")} disabled={salvando} Icone={CalendarDays} texto="Próx. semana" />
            <BotaoDecisao onClick={() => decidir("apagar")} disabled={salvando} Icone={Trash2} texto="Não vou fazer" perigo />
            <BotaoDecisao onClick={() => decidir("pular")} disabled={salvando} Icone={SkipForward} texto="Pular" />
          </div>
          <p className="text-xs text-ink-400 mt-3 text-center">"Não vou fazer" manda pra lixeira — dá pra recuperar depois.</p>
        </>
      ) : (
        <div className="mt-6 animate-quicar">
          <div className="rounded-3xl border border-habito/30 bg-habito/10 p-6 text-center">
            <p className="text-5xl mb-2">🎉</p>
            <p className="text-xl font-semibold">Semana organizada!</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div>
                <p className="text-2xl font-bold">{contagem.feitas}</p>
                <p className="text-ink-400">feitas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{contagem.agendadas}</p>
                <p className="text-ink-400">agendadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{contagem.apagadas}</p>
                <p className="text-ink-400">tiradas</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mt-8 mb-3">📅 Seus próximos 7 dias</h2>
          {semana.length === 0 ? (
            <p className="text-sm text-ink-400">Nenhuma tarefa marcada pros próximos dias.</p>
          ) : (
            <ul className="space-y-2 lista-entrar">
              {semana.slice(0, 15).map((t: any) => (
                <li key={t.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl px-4 py-3">
                  <span className="text-xs text-nota font-medium w-20 shrink-0">{rotuloData(t._proxima, hoje)}</span>
                  <span className="text-sm truncate">{t.titulo}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tarefas" className="block text-center mt-6 bg-nota text-base-900 font-semibold rounded-full px-5 py-3">
            Pronto
          </Link>
        </div>
      )}
    </main>
  );
}

function BotaoDecisao({
  onClick,
  disabled,
  Icone,
  texto,
  destaque,
  perigo,
}: {
  onClick: () => void;
  disabled?: boolean;
  Icone: LucideIcon;
  texto: string;
  destaque?: boolean;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium border transition active:scale-95 disabled:opacity-50 ${
        destaque
          ? "bg-nota text-base-900 border-nota"
          : perigo
            ? "border-red-400/40 text-red-400 hover:bg-red-400/10"
            : "border-base-600 hover:border-ink-400"
      }`}
    >
      <Icone size={17} />
      {texto}
    </button>
  );
}
