"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { vibrar } from "@/lib/app/vibrar";
import { aguardandoConfirmacao } from "@/lib/financas/confirmacao";

/**
 * Etapa 209 — lançamento agendado (data no futuro): "✓ Paguei" marca
 * que já saiu da conta hoje (entra no saldo agora). Se já foi marcado,
 * mostra "Pago em dd/mm" com opção de desfazer.
 * Lançamento com data de hoje ou passada não mostra nada (já conta).
 */
export function BotaoPaguei({
  transacao,
  compacto = false,
}: {
  transacao: { id: string; tipo: string; data: string; pago_em?: string | null; recorrencia_id?: string | null; criado_em?: string | null; transferencia_grupo?: string | null; conta_tipo?: string | null };
  compacto?: boolean;
}) {
  const hoje = new Date().toLocaleDateString("sv-SE");
  const [pagoEm, setPagoEm] = useState<string | null>(transacao.pago_em ?? null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);

  // Etapa 268 — receita programada que chegou o dia: espera confirmar
  const aguardando = !pagoEm && aguardandoConfirmacao(transacao, hoje);
  if (transacao.data <= hoje && !pagoEm && !aguardando) return null;

  const receita = transacao.tipo === "receita";

  async function alterar(novo: string | null) {
    vibrar(novo ? [15, 40, 25] : 10); // Etapa 248
    setSalvando(true);
    setErro(false);
    const anterior = pagoEm;
    setPagoEm(novo);
    const { error } = await createClient().from("financa_transacoes").update({ pago_em: novo }).eq("id", transacao.id);
    setSalvando(false);
    if (error) {
      setPagoEm(anterior);
      setErro(true);
      return;
    }
    atualizarSnapshotEmTodasAsTelas();
  }

  if (pagoEm) {
    return (
      <span className="inline-flex items-center gap-2 text-sm leading-none">
        <span className="px-2 py-1 rounded-md bg-habito/15 text-habito font-medium">
          {receita ? "Recebido" : "Pago"} {new Date(pagoEm + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </span>
        <button
          type="button"
          disabled={salvando}
          onClick={() => alterar(null)}
          aria-label="Desfazer"
          className="text-ink-400 hover:text-ink-100 transition p-1"
        >
          <Undo2 size={13} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm leading-none">
      <span className="px-2 py-1 rounded-md bg-financa/15 text-financa font-medium">
        {aguardando ? (receita ? "Caiu?" : "Pagou?") : receita ? "A receber" : "A pagar"}
      </span>
      <button
        type="button"
        disabled={salvando}
        onClick={() => alterar(hoje)}
        className={`inline-flex items-center gap-1 rounded-md border border-habito/50 text-habito font-medium hover:bg-habito/10 transition disabled:opacity-50 ${
          compacto ? "px-2 py-1" : "px-2.5 py-1"
        }`}
      >
        <Check size={12} strokeWidth={3} /> {receita ? "Recebi" : "Paguei"}
      </button>
      {erro && <span className="text-red-400">não salvou</span>}
    </span>
  );
}
