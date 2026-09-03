"use client";

import { useRef, useState, useTransition } from "react";
import { atualizarNota } from "@/app/notas/actions";
import { adicionarNaFila } from "@/lib/offline/fila";

export function EditorNota({
  notaId,
  tituloInicial,
  conteudoInicial,
  horarioLembreteInicial,
}: {
  notaId: string;
  tituloInicial: string;
  conteudoInicial: string;
  horarioLembreteInicial: string | null;
}) {
  const [pendente, iniciarTransicao] = useTransition();
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [salvoOffline, setSalvoOffline] = useState(false);
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
      <div className="flex items-center gap-2">
        <label htmlFor="horarioLembrete" className="text-xs text-ink-400 shrink-0">
          🔔 Lembrete diário
        </label>
        <input
          id="horarioLembrete"
          name="horarioLembrete"
          type="time"
          defaultValue={horarioLembreteInicial ?? ""}
          onChange={agendarSalvamento}
          className="bg-base-800 border border-base-600 rounded-lg px-2 py-1 text-xs text-ink-100 focus:border-ink-100 outline-none transition"
        />
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
