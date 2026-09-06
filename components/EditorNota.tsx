"use client";

import { useRef, useState, useTransition } from "react";
import { atualizarNota } from "@/app/notas/actions";
import { adicionarNaFila } from "@/lib/offline/fila";

export function EditorNota({
  notaId,
  tituloInicial,
  conteudoInicial,
  horarioLembreteInicial,
  dataLembreteInicial,
}: {
  notaId: string;
  tituloInicial: string;
  conteudoInicial: string;
  horarioLembreteInicial: string | null;
  dataLembreteInicial: string | null;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [salvoOffline, setSalvoOffline] = useState(false);
  const [temLembrete, setTemLembrete] = useState(!!horarioLembreteInicial);
  const [tipoLembrete, setTipoLembrete] = useState<"todo_dia" | "uma_vez">(
    dataLembreteInicial ? "uma_vez" : "todo_dia"
  );
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function agendarSalvamento() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const dados = new FormData(formRef.current);

      if (!navigator.onLine) {
        // Sem internet: guarda na fila em vez de tentar (e falhar) a
        // chamada de verdade. Cada nova edição enquanto offline
        // substitui a anterior na fila (não precisa acumular 10
        // versões do mesmo texto) — só a mais recente importa.
        adicionarNaFila({
          id: `editar_nota_${notaId}`, // mesmo id sempre = fica só a versão mais nova
          tipo: "editar_nota",
          notaId,
          titulo: String(dados.get("titulo") ?? ""),
          conteudo: String(dados.get("conteudo") ?? ""),
        });
        setSalvoOffline(true);
        return;
      }

      setSalvoOffline(false);
      iniciarTransicao(async () => {
        await atualizarNota(notaId, dados);
        setSalvoEm(new Date());
      });
    }, 800);
  }

  const hoje = new Date().toLocaleDateString("sv-SE");

  return (
    <form ref={formRef} className="space-y-3">
      <input
        name="titulo"
        defaultValue={tituloInicial}
        onChange={agendarSalvamento}
        placeholder="Título"
        className="w-full bg-transparent text-2xl font-display font-semibold outline-none placeholder:text-ink-400"
      />
      <textarea
        name="conteudo"
        defaultValue={conteudoInicial}
        onChange={agendarSalvamento}
        placeholder="Comece a escrever..."
        rows={14}
        className="w-full bg-transparent outline-none placeholder:text-ink-400 resize-none leading-relaxed"
      />

      <div className="bg-base-800 border border-base-600 rounded-lg p-3">
        <label className="flex items-center gap-2.5 cursor-pointer mb-1">
          <input
            type="checkbox"
            checked={temLembrete}
            onChange={(e) => {
              setTemLembrete(e.target.checked);
              agendarSalvamento();
            }}
            className="w-4 h-4 accent-nota"
          />
          <span className="text-sm">🔔 Lembrete</span>
        </label>

        {temLembrete && (
          <div className="mt-2 space-y-2.5 pl-6">
            {/* Deixa bem claro qual dia — era exatamente o que estava
                confuso antes: um lembrete "diário" disparava pra
                sempre, sem opção de ser só numa data específica. */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipoLembrete("todo_dia");
                  agendarSalvamento();
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs border transition ${
                  tipoLembrete === "todo_dia"
                    ? "bg-ink-100 text-base-900 border-ink-100"
                    : "border-base-600 text-ink-400"
                }`}
              >
                Todo dia
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoLembrete("uma_vez");
                  agendarSalvamento();
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs border transition ${
                  tipoLembrete === "uma_vez"
                    ? "bg-ink-100 text-base-900 border-ink-100"
                    : "border-base-600 text-ink-400"
                }`}
              >
                Só numa data
              </button>
            </div>

            {tipoLembrete === "uma_vez" && (
              <input
                name="dataLembrete"
                type="date"
                min={hoje}
                defaultValue={dataLembreteInicial ?? hoje}
                onChange={agendarSalvamento}
                className="w-full bg-base-900 border border-base-600 rounded-lg px-2.5 py-1.5 text-xs text-ink-100 focus:border-ink-100 outline-none transition"
              />
            )}
            {/* Se for "todo dia", manda vazio — o servidor entende
                campo vazio como "sem data específica, repete sempre". */}
            {tipoLembrete === "todo_dia" && <input type="hidden" name="dataLembrete" value="" />}

            <input
              name="horarioLembrete"
              type="time"
              defaultValue={horarioLembreteInicial ?? "09:00"}
              onChange={agendarSalvamento}
              className="bg-base-900 border border-base-600 rounded-lg px-2.5 py-1.5 text-xs text-ink-100 focus:border-ink-100 outline-none transition"
            />

            <p className="text-[11px] text-ink-400">
              {tipoLembrete === "todo_dia"
                ? "Vai avisar todo dia, sempre nesse horário, até você desmarcar."
                : "Vai avisar só uma vez, nessa data e horário."}
            </p>
          </div>
        )}

        {!temLembrete && <input type="hidden" name="horarioLembrete" value="" />}
      </div>

      <p className="text-xs text-ink-400 h-4">
        {salvoOffline
          ? "📦 Salvo offline — sincroniza quando a internet voltar"
          : pendente
            ? "Salvando..."
            : salvoEm
              ? "Salvo"
              : ""}
      </p>
    </form>
  );
}
