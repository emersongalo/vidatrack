"use client";

// Etapa 279 — topo com a identidade de cada área: faixa na cor da área,
// saudação do momento do dia e uma ilustração (emoji) boiando.
import { useEffect, useState, type ReactNode } from "react";
import { saudacao } from "@/lib/painel/seuDia";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

type Area = "habito" | "tarefa" | "financa";

const ESTILO: Record<Area, { cor: string; borda: string; emoji: string }> = {
  habito: { cor: "rgb(var(--c-habito) / 0.22)", borda: "border-habito/30", emoji: "🌱" },
  tarefa: { cor: "rgb(var(--c-nota) / 0.22)", borda: "border-nota/30", emoji: "✅" },
  financa: { cor: "rgb(var(--c-financa) / 0.22)", borda: "border-financa/30", emoji: "💰" },
};

function emojiDaHora(h: number) {
  if (h < 5) return "🌙";
  if (h < 12) return "☀️";
  if (h < 18) return "🌤️";
  return "🌙";
}

export function TopoArea({
  area,
  titulo,
  subtitulo,
  emoji,
  acoes,
  children,
}: {
  area: Area;
  titulo: string;
  subtitulo?: ReactNode;
  emoji?: string;
  acoes?: ReactNode;
  children?: ReactNode;
}) {
  const { snapshot } = useSnapshotOffline();
  const e = ESTILO[area];
  // a hora só no navegador (evita diferença entre servidor e aparelho)
  const [hora, setHora] = useState<number | null>(null);
  useEffect(() => setHora(new Date().getHours()), []);
  const nome = String(snapshot?.perfil?.nome ?? "").trim().split(" ")[0];

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border ${e.borda} p-5 mb-4 animate-surgir`}
      style={{ background: `linear-gradient(135deg, ${e.cor}, transparent 75%)` }}
    >
      <span aria-hidden className="pointer-events-none absolute -right-2 -top-2 text-7xl opacity-25 animate-boiar select-none">
        {emoji ?? e.emoji}
      </span>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {hora !== null && (
            <p className="text-sm text-ink-400">
              {saudacao(hora)}
              {nome ? `, ${nome}` : ""} {emojiDaHora(hora)}
            </p>
          )}
          <h1 className="text-3xl font-display font-bold leading-tight">{titulo}</h1>
          {subtitulo && <div className="text-sm text-ink-400 mt-0.5">{subtitulo}</div>}
        </div>
        {acoes && <div className="relative flex items-center gap-2 shrink-0">{acoes}</div>}
      </div>
      {children && <div className="relative mt-3">{children}</div>}
    </section>
  );
}
