"use client";

// Etapa 357 — o card completo do compromisso. Quem foi convidado vê TUDO
// (horário, local no mapa, anotações, quem vai) mas não edita; o dono vê
// o mesmo card com o botão "Editar".
import { X, Pencil, Repeat, Bell, Clock, Users, StickyNote, LogOut } from "lucide-react";
import { corDoEvento, hhmm, rotuloDia, rotuloLembrete, type Ocorrencia, type Resposta } from "@/lib/agenda/eventos";
import { separarEmoji } from "@/lib/agenda/visual";
import type { EventoAgenda } from "@/lib/agenda/useAgenda";
import { MapaLocal } from "@/components/agenda/MapaLocal";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const REPETE: Record<string, string> = {
  diaria: "Todo dia",
  semanal: "Toda semana",
  quinzenal: "A cada 15 dias",
  mensal: "Todo mês",
  anual: "Todo ano",
};
const RESPOSTA: Record<string, { txt: string; cor: string }> = {
  vou: { txt: "vai", cor: "text-habito" },
  talvez: { txt: "talvez", cor: "text-financa" },
  nao_vou: { txt: "não vai", cor: "text-red-400" },
  pendente: { txt: "não respondeu", cor: "text-ink-400" },
};

function dataPorExtenso(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  const sem = SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${sem}, ${d} de ${MESES[m - 1]}`;
}

export function DetalheEvento({
  o,
  eu,
  hoje,
  nomeDe,
  corDe,
  aoFechar,
  aoEditar,
  aoResponder,
  aoSair,
}: {
  o: Ocorrencia;
  eu: string | null;
  hoje: string;
  nomeDe: (id: string) => string;
  corDe: (id: string) => string;
  aoFechar: () => void;
  aoEditar?: () => void;
  aoResponder: (r: Resposta) => void;
  aoSair?: () => void;
}) {
  const e = o.evento as EventoAgenda;
  const c = corDoEvento(e.cor);
  const { emoji, texto } = separarEmoji(e.titulo);
  const souDono = e.dono_id === eu || !!e.pendente;
  const participantes = e.evento_participantes ?? [];
  const minha = participantes.find((p) => p.usuario_id === eu)?.resposta;
  const ini = hhmm(e.hora_inicio);
  const fim = hhmm(e.hora_fim);
  const corDono = corDe(e.dono_id);
  const rel = rotuloDia(o.dia, hoje);
  const opcoes: [Resposta, string, string][] = [
    ["vou", "Vou", "bg-habito"],
    ["talvez", "Talvez", "bg-financa"],
    ["nao_vou", "Não vou", "bg-red-400"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fundo" onClick={aoFechar}>
      <div
        className="animate-folha w-full max-w-lg max-h-[92vh] overflow-y-auto bg-base-800 border-t sm:border border-base-600 rounded-t-3xl sm:rounded-3xl"
        onClick={(ev) => ev.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        {/* topo na cor do compromisso */}
        <div className="relative px-5 pt-5 pb-4" style={{ background: `linear-gradient(160deg, ${c.hex}40, transparent 85%)` }}>
          <div className="flex items-start gap-3">
            <span
              className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl animate-pop shadow-lg"
              style={{ background: `${c.hex}33`, border: `1px solid ${c.hex}66` }}
            >
              {emoji ?? (e.tipo === "aniversario" ? "🎂" : e.tipo === "data_especial" ? "⭐" : "📅")}
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xl font-display font-bold leading-tight break-words">{texto}</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${corDono}26`, color: corDono }}>
                <span className="w-2 h-2 rounded-full" style={{ background: corDono }} />
                {souDono ? "Seu compromisso" : `De ${nomeDe(e.dono_id)}`}
              </span>
            </div>
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="p-1 -mr-1 text-ink-400 hover:text-ink-100">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="px-5 space-y-3">
          {/* quando */}
          <div className="flex items-start gap-3 animate-entrar" style={{ animationDelay: "40ms" }}>
            <Clock size={17} className="text-ink-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">
                {/^(hoje|amanh|ontem)/i.test(rel) ? (
                  <>
                    {rel.charAt(0).toUpperCase() + rel.slice(1)}
                    <span className="text-ink-400 font-normal"> · {dataPorExtenso(o.dia)}</span>
                  </>
                ) : (
                  dataPorExtenso(o.dia).charAt(0).toUpperCase() + dataPorExtenso(o.dia).slice(1)
                )}
              </p>
              <p className="text-ink-400">{ini ? `${ini}${fim ? ` até ${fim}` : ""}` : "Dia todo"}</p>
            </div>
          </div>

          {e.repetir !== "nenhuma" && (
            <div className="flex items-center gap-3 text-sm animate-entrar" style={{ animationDelay: "70ms" }}>
              <Repeat size={17} className="text-ink-400 shrink-0" />
              <span>
                {REPETE[e.repetir] ?? "Repete"}
                {e.repetir_ate ? <span className="text-ink-400"> · até {e.repetir_ate.split("-").reverse().join("/")}</span> : null}
              </span>
            </div>
          )}

          {(e.lembretes ?? []).length > 0 && (
            <div className="flex items-start gap-3 text-sm animate-entrar" style={{ animationDelay: "100ms" }}>
              <Bell size={17} className="text-ink-400 mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {(e.lembretes ?? []).map((m) => (
                  <span key={m} className="rounded-full bg-base-700 px-2 py-0.5 text-xs">
                    {rotuloLembrete(m, !ini)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {e.local && (
            <div className="animate-entrar" style={{ animationDelay: "130ms" }}>
              <p className="text-sm font-medium mb-1.5">📍 {e.local}</p>
              <MapaLocal local={e.local} />
            </div>
          )}

          {e.descricao && (
            <div className="flex items-start gap-3 text-sm animate-entrar" style={{ animationDelay: "160ms" }}>
              <StickyNote size={17} className="text-ink-400 mt-0.5 shrink-0" />
              <p className="whitespace-pre-wrap break-words text-ink-100/90">{e.descricao}</p>
            </div>
          )}

          {participantes.length > 0 && (
            <div className="flex items-start gap-3 text-sm animate-entrar" style={{ animationDelay: "190ms" }}>
              <Users size={17} className="text-ink-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                {[{ usuario_id: e.dono_id, resposta: "vou" as Resposta, dono: true }, ...participantes.map((p) => ({ ...p, dono: false }))].map((p) => (
                  <div key={p.usuario_id} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase text-base-900" style={{ background: corDe(p.usuario_id) }}>
                      {nomeDe(p.usuario_id).slice(0, 1)}
                    </span>
                    <span className="flex-1">{nomeDe(p.usuario_id)}</span>
                    <span className={`text-xs ${p.dono ? "text-ink-400" : RESPOSTA[p.resposta]?.cor}`}>{p.dono ? "organiza" : RESPOSTA[p.resposta]?.txt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {e.pendente && <p className="text-xs text-financa">⏳ Salvo no aparelho — vai sincronizar quando tiver internet.</p>}

          {/* convidado: só responde (não edita) */}
          {!souDono && (
            <div className="pt-1 animate-entrar" style={{ animationDelay: "220ms" }}>
              <p className="text-xs text-ink-400 mb-1.5">Você vai?</p>
              <div className="grid grid-cols-3 gap-1.5">
                {opcoes.map(([r, t, bg]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => aoResponder(r)}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition ${minha === r ? `${bg} text-base-900 scale-[1.03]` : "border border-base-600 text-ink-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-400 mt-2">Só {nomeDe(e.dono_id)} pode mudar esse compromisso.</p>
              {aoSair && (
                <button type="button" onClick={aoSair} className="mt-2 flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-400">
                  <LogOut size={13} /> Sair deste compromisso
                </button>
              )}
            </div>
          )}

          {souDono && aoEditar && (
            <button type="button" onClick={aoEditar} className="w-full mt-1 flex items-center justify-center gap-2 rounded-2xl bg-nota text-base-900 font-semibold py-3 animate-entrar" style={{ animationDelay: "220ms" }}>
              <Pencil size={16} /> Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
