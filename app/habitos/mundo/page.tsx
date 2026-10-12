"use client";

// Etapa 310 — o Mundo: um mapa-ilha que junta tudo do jogo dos hábitos
// (casa, garagem, jardim, lojinha, missões, conquistas e o jardim juntos).
// Toque num lugar pra ir até ele; os selinhos avisam o que tem pra pegar.
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { missoesDoDia, resgatadas, semanaDoBau } from "@/lib/mascote/missoes";
import { conquistasProntas, listarConquistas } from "@/lib/mascote/conquistas";
import { jardimPessoal } from "@/lib/mascote/jardimDados";
import { progressoDoDesejo } from "@/lib/mascote/casa";
import { MundoIso, type LugarMundo } from "@/components/mascote/MundoIso";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { ZoomPan } from "@/components/ZoomPan";
import { estadosDosMonumentos } from "@/lib/mascote/ilha";
import { CarregandoTela } from "@/components/Esqueleto";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

const CEU: Record<string, string> = {
  manha: "linear-gradient(180deg, #BFE3F7, #FCE7C8)",
  tarde: "linear-gradient(180deg, #8FD0F5, #DDF1FF)",
  entardecer: "linear-gradient(180deg, #7C6BB5, #F7A97C)",
  noite: "linear-gradient(180deg, #0E1738, #273469)",
};

const ROTA_DO_LUGAR: Record<LugarMundo, string> = {
  casa: "/habitos/mascote/casa",
  garagem: "/habitos/mascote/casa",
  jardim: "/habitos/jardim",
  juntos: "/habitos/juntos",
  lojinha: "/habitos/mascote",
  missoes: "/habitos",
  conquistas: "/habitos/mascote/conquistas",
};

export default function MundoPage() {
  const router = useRouter();
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, fase, moedas } = useMascote(snapshot, hoje);
  const periodo = periodoDaHora(new Date().getHours());

  const info = useMemo(() => {
    if (!snapshot) return null;
    const missoes = missoesDoDia(snapshot, hoje, mascote);
    const ja = resgatadas(mascote, hoje);
    const prontasMissao = missoes.filter((x) => x.feita && !ja.includes(x.id)).length + (semanaDoBau(mascote, hoje).disponivel ? 1 : 0);
    const conquistas = listarConquistas(snapshot, mascote, feitos);
    const plantas = jardimPessoal(snapshot, hoje);
    const temJuntos = ((snapshot.parceiros ?? []) as any[]).length > 0;
    return { missoes, prontasMissao, conquistas, prontasConquista: conquistasProntas(conquistas), plantas, temJuntos };
  }, [snapshot, hoje, mascote, feitos]);

  if (snapshot === undefined || !info) return <CarregandoTela cartoes={2} linhas={3} />;

  const garagem = !!mascote?.casa?.comodos?.garagem;
  const sonho = progressoDoDesejo(mascote?.casa, moedas);
  const feitasConq = info.conquistas.filter((c) => c.resgatada).length;
  const ir = (l: LugarMundo) => {
    if (l === "juntos" && !info.temJuntos) return router.push("/habitos/juntos");
    router.push(ROTA_DO_LUGAR[l]);
  };

  return (
    <main className="pagina-curta px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina voltarHref="/habitos" voltarTexto="Hábitos" emoji="🗺️" titulo="Mundo" subtitulo="Toque num lugar pra ir até ele" />

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 font-semibold">🪙 {moedas}</span>
        {mascote && (
          <span className="rounded-full bg-base-800 border border-base-600 px-3 py-1.5 truncate">
            {mascote.nome} · {fase.nome}
          </span>
        )}
      </div>

      <ZoomPan className="rounded-3xl border border-base-600/70 mb-2">
        <div style={{ background: CEU[periodo] }}>
        <MundoIso
          periodo={periodo}
          mascote={mascote ? { cor: mascote.cor, fase: fase.nivel, equipados: mascote.equipados, nome: mascote.nome } : null}
          garagem={garagem}
          plantas={info.plantas.length}
          selos={{ missoes: info.prontasMissao, conquistas: info.prontasConquista }}
          aoTocar={ir}
          monumentos={estadosDosMonumentos(info.conquistas)}
        />
        </div>
      </ZoomPan>
      <p className="text-xs text-ink-400 mb-4 text-center">
        🏝️ {feitasConq} de {info.conquistas.length} monumentos na ilha
        {info.prontasConquista > 0 && <span className="text-financa font-semibold"> · {info.prontasConquista} 🎁 esperando</span>}
      </p>

      {sonho && (
        <Link href="/habitos/mascote/casa" className="block rounded-2xl border border-financa/40 bg-financa/10 px-4 py-3 mb-4">
          <p className="text-sm font-semibold">
            {sonho.movel.emoji} Sonho: {sonho.movel.nome} {sonho.pronto ? "— já dá pra comprar! 🎉" : `· faltam ${sonho.faltam} 🪙 (~${sonho.habitos} hábitos)`}
          </p>
          <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mt-2">
            <div className="h-full rounded-full bg-financa" style={{ width: `${Math.round(sonho.progresso * 100)}%` }} />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["casa", "🏠", "Casa", mascote ? `de ${mascote.nome}` : "Choque o mascote"],
            ["jardim", "🌳", "Jardim", `${info.plantas.length} ${info.plantas.length === 1 ? "planta" : "plantas"}`],
            ["missoes", "🎯", "Missões", info.prontasMissao ? `${info.prontasMissao} pra resgatar` : `${resgatadas(mascote, hoje).length}/${info.missoes.length} hoje`],
            ["conquistas", "🏆", "Conquistas", info.prontasConquista ? `${info.prontasConquista} pra resgatar` : `${feitasConq}/${info.conquistas.length}`],
            ["lojinha", "🛍️", "Lojinha", "Roupas e comidinhas"],
            ["juntos", "💞", "Juntos", info.temJuntos ? "Jardim da dupla" : "Convide alguém"],
          ] as [LugarMundo, string, string, string][]
        ).map(([l, emoji, titulo, sub]) => {
          const aviso = (l === "missoes" && info.prontasMissao > 0) || (l === "conquistas" && info.prontasConquista > 0);
          return (
            <button
              key={l}
              type="button"
              onClick={() => ir(l)}
              className={`relative text-left rounded-2xl border px-3 py-2.5 transition ${aviso ? "border-financa bg-financa/10" : "border-base-600 bg-base-800 hover:border-habito"}`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="block font-semibold text-sm mt-1">{titulo}</span>
              <span className={`block text-xs ${aviso ? "text-financa font-semibold" : "text-ink-400"}`}>{sub}</span>
              {aviso && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-financa animate-pulse" />}
            </button>
          );
        })}
      </div>
    </main>
  );
}
