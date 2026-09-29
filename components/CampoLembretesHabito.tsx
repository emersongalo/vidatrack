"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { gerarHorariosIntervalo, normalizarHorarios } from "@/lib/habitos/horariosLembrete";

// Etapa 216 — lembrete único, vários horários ou "a cada X horas"
type Modo = "nenhum" | "um" | "varios" | "intervalo";

const classeCampo =
  "bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition";

export function CampoLembretesHabito({ iniciais, ehContador, unidade }: { iniciais: string[]; ehContador: boolean; unidade?: string }) {
  const [modo, setModo] = useState<Modo>(iniciais.length === 0 ? "nenhum" : iniciais.length === 1 ? "um" : "varios");
  const [um, setUm] = useState(iniciais[0] ?? "08:00");
  const [varios, setVarios] = useState<string[]>(iniciais.length > 1 ? iniciais : ["09:00", "12:00", "15:00", "18:00"]);
  const [inicio, setInicio] = useState("08:00");
  const [fim, setFim] = useState("20:00");
  const [intervalo, setIntervalo] = useState("2");

  const horarios = useMemo(() => {
    if (modo === "um") return normalizarHorarios([um]);
    if (modo === "varios") return normalizarHorarios(varios);
    if (modo === "intervalo") return gerarHorariosIntervalo(inicio, fim, Number(intervalo.replace(",", ".")) || 2);
    return [];
  }, [modo, um, varios, inicio, fim, intervalo]);

  const botao = (m: Modo, rotulo: string) => (
    <button
      type="button"
      onClick={() => setModo(m)}
      className={`rounded-lg py-2 text-xs sm:text-sm border transition ${
        modo === m ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div>
      <span className="block text-sm text-ink-400 mb-2">Lembrete (opcional)</span>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {botao("nenhum", "Sem")}
        {botao("um", "1 horário")}
        {botao("varios", "Vários")}
        {botao("intervalo", "A cada…")}
      </div>

      {modo === "um" && <input type="time" value={um} onChange={(e) => setUm(e.target.value)} className={`w-full ${classeCampo}`} />}

      {modo === "varios" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {varios.map((h, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="time"
                  value={h}
                  onChange={(e) => setVarios((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
                  className={`flex-1 min-w-0 ${classeCampo} py-2`}
                />
                <button
                  type="button"
                  aria-label="Remover horário"
                  onClick={() => setVarios((l) => l.filter((_, j) => j !== i))}
                  className="w-8 h-8 flex items-center justify-center text-ink-400 hover:text-red-400 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          {varios.length < 24 && (
            <button
              type="button"
              onClick={() => setVarios((l) => [...l, "20:00"])}
              className="flex items-center gap-1 text-xs text-habito hover:underline"
            >
              <Plus size={14} /> Adicionar horário
            </button>
          )}
        </div>
      )}

      {modo === "intervalo" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-400">A cada</span>
          <select value={intervalo} onChange={(e) => setIntervalo(e.target.value)} className={`${classeCampo} py-2`}>
            {["1", "1.5", "2", "3", "4"].map((v) => (
              <option key={v} value={v}>
                {v.replace(".", ",")} h
              </option>
            ))}
          </select>
          <span className="text-ink-400">das</span>
          <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} className={`${classeCampo} py-2`} />
          <span className="text-ink-400">às</span>
          <input type="time" value={fim} onChange={(e) => setFim(e.target.value)} className={`${classeCampo} py-2`} />
        </div>
      )}

      {horarios.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {horarios.map((h) => (
            <span key={h} className="text-xs font-mono bg-habito-soft text-habito rounded-full px-2 py-0.5">
              {h}
            </span>
          ))}
        </div>
      )}

      {horarios.map((h) => (
        <input key={h} type="hidden" name="horariosLembrete" value={h} />
      ))}
      <input type="hidden" name="horarioLembrete" value={horarios[0] ?? ""} />

      {modo !== "nenhum" && (
        <p className="text-xs text-ink-400 mt-2">
          A notificação chega no celular em {horarios.length === 1 ? "cada dia do hábito" : `${horarios.length} horários por dia`}.
          Se você já tiver completado o hábito no dia, o app não avisa de novo.
          {ehContador && ` No lembrete, o "✓ Feito" soma 1${unidade ? ` ${unidade}` : ""}.`}
        </p>
      )}
    </div>
  );
}
