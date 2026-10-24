"use client";

// Etapa 341 — criar / editar compromisso (folha que sobe de baixo)
import { useEffect, useState } from "react";
import { X, Trash2, Users, Bell, Repeat, MapPin } from "lucide-react";
import {
  CORES_EVENTO,
  OPCOES_LEMBRETE,
  rotuloLembrete,
  lembretesPadrao,
  hhmm,
  type Repetir,
  type TipoEvento,
} from "@/lib/agenda/eventos";
import type { EventoAgenda, Pessoa } from "@/lib/agenda/useAgenda";
import { EMOJIS_AGENDA, juntarEmoji, separarEmoji, sugerirEmoji } from "@/lib/agenda/visual";
import { OPCOES_SAIR, ehLembreteSair, lembreteSair, minutosDoLembrete } from "@/lib/agenda/lembretesSair";
import { MapaLocal } from "@/components/agenda/MapaLocal";

const REPETIR: [Repetir, string][] = [
  ["nenhuma", "Não repete"],
  ["diaria", "Todo dia"],
  ["semanal", "Toda semana"],
  ["quinzenal", "A cada 15 dias"],
  ["mensal", "Todo mês"],
  ["anual", "Todo ano"],
];
const TIPOS: [TipoEvento, string][] = [
  ["evento", "📅 Compromisso"],
  ["aniversario", "🎂 Aniversário"],
  ["data_especial", "⭐ Data especial"],
];

const campo = "w-full bg-base-900 border border-base-600 rounded-xl px-3 py-2.5 text-base text-ink-100 outline-none focus:border-ink-100";

export type ValoresForm = Partial<EventoAgenda> & { convidados?: string[] };

export function FormEvento({
  inicial,
  pessoas,
  diaOcorrencia,
  aoSalvar,
  aoApagar,
  aoFechar,
}: {
  inicial: ValoresForm;
  pessoas: Pessoa[];
  /** quando abriu a partir de uma ocorrência de evento que repete */
  diaOcorrencia?: string;
  aoSalvar: (v: ValoresForm, convidados: string[]) => Promise<string | null>;
  aoApagar?: (soODia?: string) => Promise<string | null>;
  aoFechar: () => void;
}) {
  const editando = !!inicial.id;
  // Etapa 357 — emoji do compromisso (fica no começo do título)
  const separado = separarEmoji(inicial.titulo);
  const [titulo, setTitulo] = useState(separado.texto);
  const [emoji, setEmoji] = useState<string | null>(separado.emoji);
  const [emojiEscolhido, setEmojiEscolhido] = useState(!!separado.emoji || editando);
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [localMapa, setLocalMapa] = useState(inicial.local ?? "");
  const [tipo, setTipo] = useState<TipoEvento>(inicial.tipo ?? "evento");
  const [data, setData] = useState(inicial.data ?? new Date().toLocaleDateString("sv-SE"));
  const [diaInteiro, setDiaInteiro] = useState(!inicial.hora_inicio);
  const [inicio, setInicio] = useState(hhmm(inicial.hora_inicio) ?? "09:00");
  const [fim, setFim] = useState(hhmm(inicial.hora_fim) ?? "");
  const [repetir, setRepetir] = useState<Repetir>(inicial.repetir ?? "nenhuma");
  const [ate, setAte] = useState(inicial.repetir_ate ?? "");
  const [local, setLocal] = useState(inicial.local ?? "");
  const [descricao, setDescricao] = useState(inicial.descricao ?? "");
  const [cor, setCor] = useState(inicial.cor ?? (inicial.tipo === "aniversario" ? "rosa" : "nota"));
  const [lembretes, setLembretes] = useState<number[]>((inicial.lembretes ?? lembretesPadrao(inicial.tipo ?? "evento", !!inicial.hora_inicio)).filter((m) => !ehLembreteSair(m)));
  // Etapa 361 — "hora de sair" (minutos antes do início; null = desligado)
  const [sair, setSair] = useState<number | null>(() => {
    const v = (inicial.lembretes ?? []).find((m) => ehLembreteSair(m));
    return v === undefined ? null : minutosDoLembrete(v);
  });
  const [convidados, setConvidados] = useState<string[]>(inicial.convidados ?? []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  // sugere um emoji enquanto digita (até a pessoa escolher um)
  useEffect(() => {
    if (!emojiEscolhido) setEmoji(sugerirEmoji(titulo, tipo));
  }, [titulo, tipo, emojiEscolhido]);
  // o mapinha só atualiza quando a pessoa para de digitar
  useEffect(() => {
    const t = setTimeout(() => setLocalMapa(local), 900);
    return () => clearTimeout(t);
  }, [local]);

  function trocarTipo(t: TipoEvento) {
    setTipo(t);
    if (t === "aniversario") {
      setRepetir("anual");
      setDiaInteiro(true);
      setCor("rosa");
      setLembretes([1440, 0]);
    }
  }

  async function salvar() {
    if (!titulo.trim()) return setErro("Dê um nome pro compromisso");
    if (!diaInteiro && fim && fim <= inicio) return setErro("O fim precisa ser depois do início");
    setSalvando(true);
    setErro(null);
    const r = await aoSalvar(
      {
        id: inicial.id,
        titulo: juntarEmoji(emoji, titulo),
        tipo,
        data,
        hora_inicio: diaInteiro ? null : inicio,
        hora_fim: diaInteiro ? null : fim || null,
        repetir,
        repetir_ate: repetir !== "nenhuma" && ate ? ate : null,
        local: local.trim() || null,
        descricao: descricao.trim() || null,
        cor,
        lembretes: [...[...lembretes].sort((a, b) => b - a), ...(sair !== null && !diaInteiro && local.trim() ? [lembreteSair(sair)] : [])],
      },
      convidados
    );
    setSalvando(false);
    if (r) setErro(r.includes("eventos") ? "A agenda ainda não foi ativada no servidor." : r);
    else aoFechar();
  }

  async function apagar(soODia?: string) {
    if (!aoApagar) return;
    setSalvando(true);
    const r = await aoApagar(soODia);
    setSalvando(false);
    if (r) setErro(r);
    else aoFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fundo" onClick={aoFechar}>
      <div
        className="animate-folha w-full max-w-lg max-h-[92vh] overflow-y-auto bg-base-800 border-t sm:border border-base-600 rounded-t-3xl sm:rounded-3xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-display font-semibold">{editando ? "Editar compromisso" : "Novo compromisso"}</p>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="p-1 text-ink-400 hover:text-ink-100">
            <X size={22} />
          </button>
        </div>

        <div className="flex gap-1.5 mb-3 overflow-x-auto">
          {TIPOS.map(([t, r]) => (
            <button
              key={t}
              type="button"
              onClick={() => trocarTipo(t)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm border transition ${tipo === t ? "bg-ink-100 text-base-900 border-ink-100 font-semibold" : "border-base-600 text-ink-400"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMostrarEmojis((m) => !m)}
            aria-label="Escolher emoji"
            className={`w-12 h-12 shrink-0 rounded-xl border text-2xl flex items-center justify-center transition ${mostrarEmojis ? "border-nota bg-nota/15" : "border-base-600 bg-base-900"}`}
          >
            <span key={emoji ?? "nada"} className="animate-pop">{emoji ?? "😀"}</span>
          </button>
          <input
            autoFocus={!editando}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={tipo === "aniversario" ? "Aniversário de quem?" : "Ex: Jantar com a família"}
            maxLength={120}
            className={`${campo} text-lg font-semibold`}
          />
        </div>
        {mostrarEmojis && (
          <div className="grid grid-cols-8 gap-1 mb-3 p-2 rounded-2xl border border-base-600 bg-base-900/60 animate-surgir">
            <button
              type="button"
              onClick={() => {
                setEmoji(null);
                setEmojiEscolhido(true);
                setMostrarEmojis(false);
              }}
              className="aspect-square rounded-lg text-[10px] text-ink-400 border border-dashed border-base-600"
            >
              sem
            </button>
            {EMOJIS_AGENDA.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setEmoji(em);
                  setEmojiEscolhido(true);
                  setMostrarEmojis(false);
                }}
                className={`aspect-square rounded-lg text-xl flex items-center justify-center hover:bg-base-700 ${emoji === em ? "bg-nota/25" : ""}`}
              >
                {em}
              </button>
            ))}
          </div>
        )}
        {!mostrarEmojis && <div className="mb-1" />}

        {/* quando */}
        <div className="rounded-2xl border border-base-600 p-3 mb-3 space-y-3">
          <div className="flex items-center gap-2">
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${campo} flex-1`} />
            <label className="flex items-center gap-2 text-sm text-ink-400 shrink-0 select-none">
              <input type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} className="w-4 h-4 accent-current" />
              Dia todo
            </label>
          </div>
          {!diaInteiro && (
            <div className="flex items-center gap-2">
              <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} aria-label="Começa" />
              <span className="text-ink-400 text-sm">até</span>
              <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} className={campo} aria-label="Termina" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-ink-400 shrink-0" />
            <select value={repetir} onChange={(e) => setRepetir(e.target.value as Repetir)} className={`${campo} flex-1`}>
              {REPETIR.map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
            {repetir !== "nenhuma" && (
              <input type="date" value={ate} min={data} onChange={(e) => setAte(e.target.value)} className={`${campo} w-40`} aria-label="Repete até" title="Repete até (opcional)" />
            )}
          </div>
        </div>

        {/* lembretes */}
        <p className="flex items-center gap-1.5 text-sm text-ink-400 mb-1.5">
          <Bell size={14} /> Avisar
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {OPCOES_LEMBRETE.filter((m) => !diaInteiro || [0, 1440, 10080].includes(m)).map((m) => {
            const on = lembretes.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => setLembretes((l) => (on ? l.filter((x) => x !== m) : l.length >= 3 ? [...l.slice(1), m] : [...l, m]))}
                className={`rounded-full px-3 py-1.5 text-xs border transition ${on ? "bg-nota/20 border-nota/60 text-nota font-semibold" : "border-base-600 text-ink-400"}`}
              >
                {rotuloLembrete(m, diaInteiro)}
              </button>
            );
          })}
        </div>

        {/* Etapa 361 — hora de sair (precisa de horário e local) */}
        {!diaInteiro && (
          <div className="mb-3">
            <p className="flex items-center gap-1.5 text-sm text-ink-400 mb-1.5">🚗 Hora de sair {!local.trim() && <span className="text-[11px]">(coloque o local)</span>}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSair(null)}
                className={`rounded-full px-3 py-1.5 text-xs border transition ${sair === null ? "bg-ink-100 text-base-900 border-ink-100 font-semibold" : "border-base-600 text-ink-400"}`}
              >
                Não avisar
              </button>
              {OPCOES_SAIR.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={!local.trim()}
                  onClick={() => setSair(m)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition disabled:opacity-40 ${sair === m ? "bg-financa/20 border-financa/60 text-financa font-semibold" : "border-base-600 text-ink-400"}`}
                >
                  {m < 60 ? `${m} min` : m === 60 ? "1 h" : "1h30"} antes
                </button>
              ))}
            </div>
            {sair !== null && local.trim() && inicio && (
              <p className="text-[11px] text-ink-400 mt-1">
                Aviso pra sair às{" "}
                {(() => {
                  const [h, mm] = inicio.split(":").map(Number);
                  const t = Math.max(0, h * 60 + mm - sair);
                  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
                })()}{" "}
                com o botão de rota.
              </p>
            )}
          </div>
        )}

        {/* com quem */}
        <p className="flex items-center gap-1.5 text-sm text-ink-400 mb-1.5">
          <Users size={14} /> Compartilhar com
        </p>
        {pessoas.length ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {pessoas.map((p) => {
              const on = convidados.includes(p.usuarioId);
              return (
                <button
                  key={p.usuarioId}
                  type="button"
                  onClick={() => setConvidados((c) => (on ? c.filter((x) => x !== p.usuarioId) : [...c, p.usuarioId]))}
                  className={`flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-sm border transition ${on ? "bg-habito/15 border-habito/60 text-habito" : "border-base-600 text-ink-400"}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase ${on ? "bg-habito text-base-900" : "bg-base-700"}`}>
                    {p.nome.slice(0, 1)}
                  </span>
                  {p.nome}
                  {on && " ✓"}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-ink-400 mb-3">Só pessoal. Pra compartilhar, primeiro divida um hábito, tarefa ou conta com a pessoa — ela aparece aqui.</p>
        )}

        {/* detalhes */}
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-ink-400 shrink-0" />
          <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Local ou endereço (opcional)" maxLength={200} className={campo} />
        </div>
        {/* Etapa 357 — prévia no mapa */}
        {localMapa.trim().length >= 4 && (
          <div className="mb-3 animate-surgir">
            <MapaLocal local={localMapa} compacto />
          </div>
        )}
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Anotações (opcional)"
          rows={2}
          maxLength={2000}
          className={`${campo} mb-3 resize-none`}
        />
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(CORES_EVENTO).map(([id, c]) => (
            <button
              key={id}
              type="button"
              aria-label={c.nome}
              onClick={() => setCor(id)}
              className={`w-8 h-8 rounded-full transition ${cor === id ? "ring-2 ring-offset-2 ring-offset-base-800 ring-ink-100 scale-110" : ""}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>

        {erro && <p className="mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">{erro}</p>}

        <button
          type="button"
          disabled={salvando}
          onClick={salvar}
          className="w-full rounded-2xl bg-nota text-base-900 font-semibold py-3.5 text-base disabled:opacity-60"
        >
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar na agenda"}
        </button>

        {editando && aoApagar && (
          <div className="mt-3">
            {!confirmarApagar ? (
              <button type="button" onClick={() => setConfirmarApagar(true)} className="w-full flex items-center justify-center gap-2 text-sm text-red-400 py-2">
                <Trash2 size={15} /> Apagar
              </button>
            ) : (
              <div className="flex gap-2">
                {repetir !== "nenhuma" && diaOcorrencia && (
                  <button type="button" onClick={() => apagar(diaOcorrencia)} className="flex-1 rounded-xl border border-red-400/40 text-red-400 text-sm py-2.5">
                    Só este dia
                  </button>
                )}
                <button type="button" onClick={() => apagar()} className="flex-1 rounded-xl bg-red-500/90 text-white text-sm font-semibold py-2.5">
                  {repetir !== "nenhuma" ? "Todos" : "Apagar mesmo"}
                </button>
                <button type="button" onClick={() => setConfirmarApagar(false)} className="rounded-xl border border-base-600 text-ink-400 text-sm px-3">
                  Não
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
