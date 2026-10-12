"use client";

// Etapa 308 — o jardim pessoal como bloco da aba Hábitos: marcou um
// hábito, a planta dele é regada na hora (com pulinho e gotinhas).
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { JardimIso } from "@/components/mascote/JardimIso";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { jardimPessoal } from "@/lib/mascote/jardimDados";
import { useMascote } from "@/lib/mascote/useMascote";

const CEU_ISO: Record<string, string> = {
  manha: "linear-gradient(180deg, #BFE3F7, #FCE7C8)",
  tarde: "linear-gradient(180deg, #8FD0F5, #DDF1FF)",
  entardecer: "linear-gradient(180deg, #7C6BB5, #F7A97C)",
  noite: "linear-gradient(180deg, #0E1738, #273469)",
};

export function BlocoJardim({ snapshot, hoje }: { snapshot: any; hoje: string }) {
  const router = useRouter();
  const { mascote, fase } = useMascote(snapshot, hoje);
  const plantas = useMemo(() => jardimPessoal(snapshot, hoje), [snapshot, hoje]);
  if (!snapshot || !plantas.length) return null;
  const regadas = plantas.filter((p) => p.regada).length;
  const periodo = periodoDaHora(new Date().getHours());
  return (
    <section className="mb-4 rounded-3xl overflow-hidden border border-base-600/70">
      <div className="flex items-center justify-between px-4 py-2.5 bg-base-800">
        <p className="font-semibold text-sm">
          🌳 Seu jardim · <span className="text-habito">{regadas}/{plantas.length} regadas</span>
        </p>
        <Link href="/habitos/jardim" className="text-xs text-ink-400 hover:text-ink-100">
          Ver tudo ›
        </Link>
      </div>
      <div style={{ background: CEU_ISO[periodo] }}>
        <JardimIso
          plantas={plantas}
          periodo={periodo}
          mascotes={[
            mascote
              ? { chave: "eu", nome: mascote.nome, cor: mascote.cor, fase: fase.nivel, equipados: mascote.equipados, regou: regadas > 0 }
              : { chave: "eu", nome: "Você", cor: "verde", fase: 0, equipados: {}, regou: false, ovo: true },
          ]}
          aoTocarPlanta={(id) => router.push(`/habitos/${id}`)}
        />
      </div>
    </section>
  );
}
