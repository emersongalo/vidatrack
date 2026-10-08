"use client";

// Etapa 276 — oferta do escudo da sequência (detalhe do hábito e Hoje).
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { pausasComEscudo, type OfertaEscudo } from "@/lib/habitos/escudo";
import { explodirEm, textoFlutuante } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";

export function CartaoEscudo({
  habito,
  oferta,
  compacto = false,
}: {
  habito: { id: string; nome: string; pausas?: unknown };
  oferta: OfertaEscudo;
  compacto?: boolean;
}) {
  const [estado, setEstado] = useState<"parado" | "salvando" | "usado" | "erro">("parado");
  const [dispensado, setDispensado] = useState(false);
  const refBotao = useRef<HTMLButtonElement>(null);
  if (dispensado) return null;

  async function usar() {
    setEstado("salvando");
    const { error } = await createClient()
      .from("habitos")
      .update({ pausas: pausasComEscudo(habito, oferta.dia) })
      .eq("id", habito.id);
    if (error) {
      setEstado("erro");
      return;
    }
    vibrar([15, 40, 25]);
    explodirEm(refBotao.current, { cor: "#4C8FCC", emojis: ["🛡️", "✨"] });
    textoFlutuante(refBotao.current, "Sequência salva! 🛡️", "#7CB0DE");
    setEstado("usado");
    void atualizarSnapshotEmTodasAsTelas();
  }

  if (estado === "usado") {
    return (
      <div className={`rounded-2xl border border-[#4C8FCC]/40 bg-[#4C8FCC]/10 px-4 py-3 ${compacto ? "mb-4" : "mb-6"} animate-quicar`}>
        <p className="text-sm font-medium">🛡️ Escudo usado — sua sequência de {oferta.sequencia} dias continua!</p>
        <p className="text-xs text-ink-400 mt-0.5">Ontem virou folga. O próximo escudo libera em 7 dias.</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#4C8FCC]/40 bg-[#4C8FCC]/10 p-4 ${compacto ? "mb-4" : "mb-6"} animate-surgir`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl animate-boiar" aria-hidden>
          🛡️
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {compacto ? `${habito.nome}: ontem ficou sem marcar` : "Ontem ficou sem marcar"}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">
            Use o escudo da semana e não perca sua sequência de <strong className="text-ink-100">{oferta.sequencia} dias</strong>.
          </p>
          {estado === "erro" && <p className="text-xs text-red-400 mt-1">Não salvou — confira a internet.</p>}
          <div className="flex gap-2 mt-3">
            <button
              ref={refBotao}
              type="button"
              onClick={usar}
              disabled={estado === "salvando"}
              className="rounded-xl bg-[#4C8FCC] text-white text-sm font-semibold px-4 py-2 active:scale-95 transition disabled:opacity-60"
            >
              {estado === "salvando" ? "Salvando..." : "Usar escudo"}
            </button>
            <button type="button" onClick={() => setDispensado(true)} className="rounded-xl text-sm text-ink-400 px-3 py-2 hover:text-ink-100">
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
