"use client";

// Etapa 302 — bandejinha de cuidar: mostra barriga e saúde e o que tem na
// despensa (comidinhas, frutas colhidas, remédios). Tocou, ele come.
import Link from "next/link";
import { CONSUMIVEIS, usarConsumivel, type DadosMascote } from "@/lib/mascote/mascote";
import { LIMITE_PETISCOS_DIA, textoBarriga, textoSaude, type Vida } from "@/lib/mascote/vida";
import { vibrar } from "@/lib/app/vibrar";

export function BarrasVida({ vida, compacto = false }: { vida: Vida; compacto?: boolean }) {
  const barras = [
    { rotulo: "🍗 Barriga", valor: vida.barriga, texto: textoBarriga(vida.barriga), cor: vida.barriga < 25 ? "#F59E0B" : "rgb(var(--c-habito))" },
    { rotulo: "❤️ Saúde", valor: vida.saude, texto: textoSaude(vida.saude), cor: vida.saude < 35 ? "#EF4444" : vida.saude < 50 ? "#F59E0B" : "#F472B6" },
  ];
  return (
    <div className={compacto ? "space-y-1" : "space-y-2"}>
      {barras.map((b) => (
        <div key={b.rotulo}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-300">{b.rotulo}</span>
            <span className="text-ink-400">{b.texto}</span>
          </div>
          <div className={`${compacto ? "h-1.5" : "h-2"} rounded-full bg-base-900/50 overflow-hidden`}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(4, b.valor)}%`, background: b.cor }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BandejaComida({
  mascote,
  vida,
  hoje,
  salvar,
  salvando,
  aoComer,
}: {
  mascote: DadosMascote;
  vida: Vida | null;
  hoje: string;
  salvar: (m: DadosMascote) => Promise<boolean>;
  salvando: boolean;
  aoComer?: (emoji: string) => void;
}) {
  const itens = CONSUMIVEIS.filter((c) => c.tipo !== "planta" && (mascote.estoque?.[c.id] ?? 0) > 0);
  const cheio = (vida?.petiscosHoje ?? 0) >= LIMITE_PETISCOS_DIA;

  async function dar(id: string, emoji: string) {
    const r = usarConsumivel(mascote, id, hoje);
    if (!r.ok) return;
    vibrar([10, 30, 10]);
    aoComer?.(emoji);
    await salvar(r.mascote);
  }

  if (!itens.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <span>Despensa vazia.</span>
        <Link href="/habitos/mascote?aba=comidas" className="font-semibold text-habito">
          Comprar comidinha →
        </Link>
      </div>
    );
  }
  return (
    <div>
      {cheio && <p className="text-[11px] text-ink-400 mb-1.5">Ele já comeu bastante hoje 😋 — amanhã tem mais.</p>}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
        {itens.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={salvando || cheio}
            onClick={() => void dar(c.id, c.emoji)}
            title={`${c.nome} — ${c.descricao}`}
            className="relative shrink-0 w-12 h-12 rounded-2xl bg-base-900/50 border border-base-600 text-2xl flex items-center justify-center active:scale-90 transition disabled:opacity-40"
          >
            {c.emoji}
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-ink-100 text-base-900 text-[10px] font-bold flex items-center justify-center px-1">
              {mascote.estoque?.[c.id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
