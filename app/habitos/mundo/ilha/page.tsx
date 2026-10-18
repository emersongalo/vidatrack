"use client";

// Etapa 323 — a ilha em RPG (protótipo): ande com o mascote, entre nos
// lugares e converse com a Dona Flora, o Seu Zé e a Lia.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { CORES_MASCOTE } from "@/lib/mascote/mascote";
import { conquistasProntas, listarConquistas } from "@/lib/mascote/conquistas";
import { missoesDoDia, resgatadas, semanaDoBau } from "@/lib/mascote/missoes";
import { iscasHoje } from "@/lib/mascote/pesca";
import { DESCONTO_FEIRA } from "@/lib/mascote/feira";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { JogoIlha, type FalaNpc } from "@/components/mascote/rpg/JogoIlha";
import type { LugarIlha } from "@/lib/mascote/rpg/ilhaRpg";
import { CarregandoTela } from "@/components/Esqueleto";
import { abrirBauIlha, bauAberto, moedasDoBau } from "@/lib/mascote/rpg/bauIlha";

const ROTA: Record<LugarIlha, string> = {
  casa: "/habitos/mascote/casa",
  lojinha: "/habitos/mascote",
  conquistas: "/habitos/mascote/conquistas",
  jardim: "/habitos/jardim",
  feira: "/habitos/mundo",
  pesca: "/habitos/mundo/pesca",
  juntos: "/habitos/juntos",
  missoes: "/habitos",
};

const CHAVE_POS = "vt-ilha-pos";

function lerPosicao(): { x: number; y: number } | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAVE_POS) ?? "null");
    return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null;
  } catch {
    return null;
  }
}

export default function IlhaRpgPage() {
  const router = useRouter();
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, moedas, dia, salvar } = useMascote(snapshot, hoje);
  const [inicio] = useState(() => (typeof window === "undefined" ? null : lerPosicao()));
  const feitosHoje = dia?.habitos.feitos ?? 0;
  const totalHoje = dia?.habitos.total ?? 0;

  const info = useMemo(() => {
    if (!snapshot) return null;
    const missoes = missoesDoDia(snapshot, hoje, mascote);
    const ja = resgatadas(mascote, hoje);
    const prontasMissao = missoes.filter((x) => x.feita && !ja.includes(x.id)).length + (semanaDoBau(mascote, hoje).disponivel ? 1 : 0);
    const prontasConquista = conquistasProntas(listarConquistas(snapshot, mascote, feitos));
    return { prontasMissao, prontasConquista };
  }, [snapshot, hoje, mascote, feitos]);

  if (snapshot === undefined || !info) return <CarregandoTela cartoes={1} linhas={2} />;

  const corBase = CORES_MASCOTE[mascote?.cor ?? "verde"] ?? CORES_MASCOTE.verde;
  const cores = { corpo: corBase.corpo.startsWith("url") ? "#B7A9F0" : corBase.corpo, sombra: corBase.sombra, barriga: corBase.barriga };
  const nome = mascote?.nome ?? "Você";
  const iscas = iscasHoje(mascote, feitosHoje, hoje);
  const faltam = Math.max(0, totalHoje - feitosHoje);

  const falas: Partial<Record<"flora" | "ze" | "lia", FalaNpc>> = {
    flora: {
      falas: [
        `Olá, ${nome}! Que bom te ver por aqui.`,
        feitosHoje > 0
          ? `Você já fez ${feitosHoje} ${feitosHoje === 1 ? "hábito" : "hábitos"} hoje. Minhas plantinhas adoram!`
          : "Ainda não vi nenhum hábito feito hoje… as plantinhas estão com sede.",
        faltam > 0 ? `Faltam ${faltam} pra fechar o dia. Quer dar uma olhada no jardim?` : "O dia está completo! Vem ver como o jardim está bonito.",
      ],
      opcoes: [{ rotulo: "🌱 Ir ao jardim", href: "/habitos/jardim" }],
    },
    ze: {
      falas:
        iscas > 0
          ? ["Ô de casa! O mar tá pra peixe hoje.", `Você tem ${iscas} ${iscas === 1 ? "isca" : "iscas"}. Bora lançar a linha?`]
          : ["Sem isca, sem peixe…", "Faz um hábito que eu te arrumo uma minhoca. Cada hábito vale uma isca!"],
      opcoes: iscas > 0 ? [{ rotulo: "🎣 Pescar", href: "/habitos/mundo/pesca" }] : [{ rotulo: "✅ Ver hábitos", href: "/habitos" }],
    },
    lia: {
      falas: [
        "Bem-vindo à feirinha!",
        `Hoje tem ${Math.round(DESCONTO_FEIRA * 100)}% de desconto em alguns itens pro seu mascote.`,
        `Você tem 🪙 ${moedas}. Quer dar uma olhada?`,
      ],
      opcoes: [{ rotulo: "🛒 Ver ofertas", href: "/habitos/mundo" }],
    },
  };

  const selos: Partial<Record<LugarIlha, string>> = {};
  if (info.prontasConquista > 0) selos.conquistas = "!";
  if (info.prontasMissao > 0) selos.missoes = "!";
  if (iscas > 0) selos.pesca = String(iscas);

  return (
    <main className="fixed inset-0 z-30 bg-base-900 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Link href="/habitos/mundo" className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 text-sm">
          ← Mundo
        </Link>
        <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ilha/itens/gold-coin.png" alt="" width={14} height={14} style={{ imageRendering: "pixelated" }} /> {moedas}
        </span>
        <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 text-sm">
          ✅ {feitosHoje}/{totalHoje}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-ink-400">protótipo</span>
      </div>
      <div className="flex-1 min-h-0 mx-2 mb-2 rounded-2xl overflow-hidden border border-base-600/70">
        <JogoIlha
          cores={cores}
          nomeMascote={nome}
          periodo={periodoDaHora(new Date().getHours())}
          falas={falas}
          selos={selos}
          inicio={inicio}
          aoEntrar={(lugar, porta) => {
            try {
              sessionStorage.setItem(CHAVE_POS, JSON.stringify(porta));
            } catch {}
            router.push(ROTA[lugar]);
          }}
          aoNavegar={(href) => router.push(href)}
          bauAberto={bauAberto(mascote, hoje)}
          aoBau={async () => {
            if (!mascote) return { falas: ["Choque seu mascote pra abrir o baú 🐣"], moedas: 0 };
            const r = abrirBauIlha(mascote, feitosHoje, hoje);
            if (!r.ok)
              return {
                moedas: 0,
                falas:
                  r.motivo === "ja"
                    ? ["O baú já foi aberto hoje.", "Volte amanhã — ele se enche de novo!"]
                    : ["O baú está trancado…", `Faça um hábito hoje pra abrir. Ele dá até ${moedasDoBau(5)} moedas!`],
              };
            const ok = await salvar(r.mascote);
            return ok
              ? { moedas: r.moedas, falas: [`Você achou 🪙 ${r.moedas} moedas!`, "Quanto mais hábitos no dia, mais moedas no baú."] }
              : { moedas: 0, falas: ["Não consegui abrir agora. Verifique a internet."] };
          }}
        />
      </div>
    </main>
  );
}
