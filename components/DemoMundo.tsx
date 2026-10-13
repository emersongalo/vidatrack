"use client";

// Etapa 319 — na apresentação: a ilha do Mundo ao vivo, com o mascote
// passeando, alguns monumentos de conquista e o céu da hora de quem vê.
import { useEffect, useState } from "react";
import { MundoIso } from "@/components/mascote/MundoIso";
import { periodoDaHora, type Periodo } from "@/components/mascote/Mascote";

const CEU: Record<Periodo, string> = {
  manha: "linear-gradient(180deg, #BFE3F7, #FCE7C8)",
  tarde: "linear-gradient(180deg, #8FD0F5, #DDF1FF)",
  entardecer: "linear-gradient(180deg, #7C6BB5, #F7A97C)",
  noite: "linear-gradient(180deg, #0E1738, #273469)",
};

const MONUMENTOS = { h1: "feito", h50: "feito", h200: "feito", s7: "feito", s30: "feito", f1: "feito", f3: "feito", c3: "feito", c10: "feito", m10: "feito", b1: "feito", b5: "feito", d1: "feito", d2: "feito", h500: "pronto" } as const;

export function DemoMundo() {
  const [periodo, setPeriodo] = useState<Periodo>("tarde");
  useEffect(() => setPeriodo(periodoDaHora(new Date().getHours())), []);
  return (
    <div className="rounded-3xl overflow-hidden border border-base-700 shadow-2xl shadow-black/40" style={{ background: CEU[periodo] }}>
      <MundoIso
        periodo={periodo}
        humor="feliz"
        mascote={{ cor: "verde", fase: 3, nome: "Bolota", equipados: { chapeu: "palha" } }}
        garagem
        plantas={4}
        selos={{ missoes: 2 }}
        aoTocar={() => {}}
        monumentos={MONUMENTOS}
        visitantes={[{ chave: "ana", nome: "Ana", cor: "lilas", fase: 4, equipados: { chapeu: "coroa" } }]}
      />
    </div>
  );
}
