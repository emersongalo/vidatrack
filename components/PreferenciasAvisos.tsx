"use client";

import { useEffect, useState } from "react";
import { Moon, BarChart3, Sun, Wallet, HeartHandshake, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Chave = "resumo_manha" | "aviso_noite" | "resumo_semanal" | "lembrete_lancar" | "avisos_dupla";

const ITENS: { chave: Chave; titulo: string; texto: string; Icone: typeof Moon }[] = [
  {
    chave: "resumo_manha",
    titulo: "Resumo da manhã (07:00)",
    texto: "O que tem pro dia: hábitos, tarefas e contas que vencem hoje.",
    Icone: Sun,
  },
  {
    chave: "aviso_noite",
    titulo: "Aviso da noite (20:30)",
    texto: "Se ainda faltar algum hábito do dia, a gente te lembra quais são.",
    Icone: Moon,
  },
  {
    chave: "lembrete_lancar",
    titulo: "Lembrete de lançar gastos (21:00)",
    texto: "Se você passar 2 dias sem lançar nada, a gente pergunta se gastou algo.",
    Icone: Wallet,
  },
  {
    chave: "resumo_semanal",
    titulo: "Resumos da semana e do mês",
    texto: "Domingo às 19:00: hábitos, tarefas e gastos da semana. Dia 1 às 09:00: quanto entrou e saiu no mês.",
    Icone: BarChart3,
  },
  {
    chave: "avisos_dupla",
    titulo: "Hábitos em dupla",
    texto: "Quando seu par fizer um hábito de vocês, te cutucar ou reagir ao seu.",
    Icone: HeartHandshake,
  },
];

const HORARIOS_SUGERIDOS = ["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "18:00", "20:00"];

/** Etapa 202 — ligar/desligar os avisos automáticos (padrão: ligados). */
export function PreferenciasAvisos() {
  const [valores, setValores] = useState<Record<Chave, boolean> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Etapa 257 — horário do aviso de contas a pagar
  const [horarioContas, setHorarioContas] = useState<string | null>(null);
  const [salvoHorario, setSalvoHorario] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("perfis").select("aviso_noite, resumo_semanal, resumo_manha, lembrete_lancar, avisos_dupla, horario_contas").eq("id", user.id).maybeSingle();
      setValores({
        resumo_manha: (data as any)?.resumo_manha ?? true,
        aviso_noite: data?.aviso_noite ?? true,
        resumo_semanal: data?.resumo_semanal ?? true,
        lembrete_lancar: (data as any)?.lembrete_lancar ?? true,
        avisos_dupla: (data as any)?.avisos_dupla ?? true,
      });
      setHorarioContas(String((data as any)?.horario_contas ?? "08:00").slice(0, 5));
    });
  }, []);

  async function alternar(chave: Chave) {
    if (!valores) return;
    const novo = !valores[chave];
    setValores({ ...valores, [chave]: novo });
    setErro(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("perfis").update({ [chave]: novo }).eq("id", user.id);
    if (error) {
      setValores((v) => (v ? { ...v, [chave]: !novo } : v));
      setErro("Não consegui salvar agora. Tente de novo.");
    }
  }

  async function salvarHorario(novo: string) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(novo)) return;
    const anterior = horarioContas;
    setHorarioContas(novo);
    setErro(null);
    setSalvoHorario(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("perfis").update({ horario_contas: novo }).eq("id", user.id);
    if (error) {
      setHorarioContas(anterior);
      setErro("Não consegui salvar o horário. Tente de novo.");
    } else {
      setSalvoHorario(true);
      setTimeout(() => setSalvoHorario(false), 2500);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Avisos automáticos</h2>

      {/* Etapa 257 — horário das contas a pagar */}
      <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-2">
        <div className="flex items-start gap-3">
          <span className="text-financa shrink-0 mt-0.5">
            <Receipt size={18} strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Contas a pagar</p>
            <p className="text-xs text-ink-400 mt-0.5">
              Contas fixas, despesas agendadas e fatura do cartão: aviso na véspera e no dia do vencimento, no horário que você escolher.
            </p>
          </div>
          <input
            type="time"
            step={300}
            aria-label="Horário do aviso de contas"
            disabled={horarioContas === null}
            value={horarioContas ?? "08:00"}
            onChange={(e) => salvarHorario(e.target.value.slice(0, 5))}
            className="shrink-0 bg-base-900 border border-base-600 rounded-lg px-2 py-1.5 font-mono text-sm text-ink-100 outline-none focus:border-financa"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {HORARIOS_SUGERIDOS.map((h) => (
            <button
              key={h}
              type="button"
              disabled={horarioContas === null}
              onClick={() => salvarHorario(h)}
              className={`text-xs font-mono px-2.5 py-1 rounded-full border transition ${
                horarioContas === h ? "bg-financa text-base-900 border-financa font-semibold" : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        {salvoHorario && <p className="text-xs text-habito mt-2">✓ Salvo — os próximos avisos chegam às {horarioContas}.</p>}
      </div>
      <div className="space-y-2">
        {ITENS.map(({ chave, titulo, texto, Icone }) => {
          const ligado = valores?.[chave] ?? true;
          return (
            <button
              key={chave}
              type="button"
              disabled={!valores}
              onClick={() => alternar(chave)}
              className="w-full flex items-start gap-3 text-left bg-base-800 border border-base-600 rounded-xl2 p-4 disabled:opacity-60"
            >
              <span className="text-habito shrink-0 mt-0.5">
                <Icone size={18} strokeWidth={2} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium">{titulo}</span>
                <span className="block text-xs text-ink-400 mt-0.5">{texto}</span>
              </span>
              <span
                aria-hidden
                className={`mt-0.5 w-10 h-6 rounded-full p-0.5 shrink-0 transition ${ligado ? "bg-habito" : "bg-base-600"}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition ${ligado ? "translate-x-4" : ""}`} />
              </span>
            </button>
          );
        })}
      </div>
      {erro && <p className="text-xs text-red-400 mt-2">{erro}</p>}
    </div>
  );
}
