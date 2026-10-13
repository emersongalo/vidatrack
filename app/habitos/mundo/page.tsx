"use client";

// Etapa 310 — o Mundo: um mapa-ilha que junta tudo do jogo dos hábitos
// (casa, garagem, jardim, lojinha, missões, conquistas e o jardim juntos).
// Toque num lugar pra ir até ele; os selinhos avisam o que tem pra pegar.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useMascote } from "@/lib/mascote/useMascote";
import { missoesDoDia, resgatadas, semanaDoBau } from "@/lib/mascote/missoes";
import { conquistasProntas, listarConquistas } from "@/lib/mascote/conquistas";
import { jardimPessoal } from "@/lib/mascote/jardimDados";
import { progressoDoDesejo } from "@/lib/mascote/casa";
import { MundoIso, type LugarMundo, type VisitanteMundo } from "@/components/mascote/MundoIso";
import { comprarNaFeira, DESCONTO_FEIRA, ofertasDoDia } from "@/lib/mascote/feira";
import { eventoDoDia, premioResgatado, progressoDoEvento, proximoEvento, resgatarPremioEvento } from "@/lib/mascote/eventos";
import { iscasHoje } from "@/lib/mascote/pesca";
import { chuvaDeConfete } from "@/lib/app/festa";
import { faseDoMascote, ITENS, lerMascote, NOMES_SLOT } from "@/lib/mascote/mascote";
import { Mascote } from "@/components/mascote/Mascote";
import { periodoDaHora } from "@/components/mascote/Mascote";
import { ZoomPan } from "@/components/ZoomPan";
import { comprarTema, temaIlha, TEMAS_ILHA, temTema, usarTema } from "@/lib/mascote/temasIlha";
import { vibrar } from "@/lib/app/vibrar";
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
  feira: "/habitos/mundo",
  pesca: "/habitos/mundo/pesca",
};

export default function MundoPage() {
  const router = useRouter();
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const { mascote, feitos, fase, moedas, humor, dia, salvar, salvando } = useMascote(snapshot, hoje);
  const evento = eventoDoDia(hoje);
  const [feira, setFeira] = useState(false);
  const [provando, setProvando] = useState<string | null>(null);
  const [erroFeira, setErroFeira] = useState<string | null>(null);
  const [temas, setTemas] = useState(false);
  const [erroTema, setErroTema] = useState<string | null>(null);
  const tema = temaIlha(mascote?.temaIlha);
  const periodo = periodoDaHora(new Date().getHours());

  const info = useMemo(() => {
    if (!snapshot) return null;
    const missoes = missoesDoDia(snapshot, hoje, mascote);
    const ja = resgatadas(mascote, hoje);
    const prontasMissao = missoes.filter((x) => x.feita && !ja.includes(x.id)).length + (semanaDoBau(mascote, hoje).disponivel ? 1 : 0);
    const conquistas = listarConquistas(snapshot, mascote, feitos);
    const plantas = jardimPessoal(snapshot, hoje);
    const temJuntos = ((snapshot.parceiros ?? []) as any[]).length > 0;
    const desafios = (mascote?.desafios ?? []).filter((d) => !d.resultado).length;
    // Etapa 315 — os mascotes de quem divide hábito comigo visitam a ilha
    const nomes = new Map(((snapshot.parceiros ?? []) as any[]).map((p) => [p.usuario_id as string, String(p.nome ?? "").split(" ")[0].split("@")[0]]));
    const visitantes: VisitanteMundo[] = ((snapshot.parceirosMascote ?? []) as any[])
      .map((p) => {
        const m = lerMascote(p.mascote);
        if (!m) return null;
        return { chave: p.usuario_id as string, nome: nomes.get(p.usuario_id) || m.nome, cor: m.cor, fase: faseDoMascote(p.feitos ?? 0).nivel, equipados: m.equipados };
      })
      .filter((x): x is VisitanteMundo => x !== null)
      .slice(0, 5);
    return { visitantes, desafios, missoes, prontasMissao, conquistas, prontasConquista: conquistasProntas(conquistas), plantas, temJuntos };
  }, [snapshot, hoje, mascote, feitos]);

  if (snapshot === undefined || !info) return <CarregandoTela cartoes={2} linhas={3} />;

  const garagem = !!mascote?.casa?.comodos?.garagem;
  const sonho = progressoDoDesejo(mascote?.casa, moedas);
  const feitasConq = info.conquistas.filter((c) => c.resgatada).length;
  const ir = (l: LugarMundo) => {
    if (l === "feira") return setFeira(true);
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
        <div style={{ background: tema.particula === "brasas" ? "linear-gradient(180deg, #431407, #7C2D12)" : CEU[periodo] }}>
        <MundoIso
          periodo={periodo}
          mascote={mascote ? { cor: mascote.cor, fase: fase.nivel, equipados: mascote.equipados, nome: mascote.nome } : null}
          garagem={garagem}
          plantas={info.plantas.length}
          selos={{ missoes: info.prontasMissao, conquistas: info.prontasConquista }}
          aoTocar={ir}
          monumentos={estadosDosMonumentos(info.conquistas)}
          tema={tema}
          humor={humor}
          visitantes={info.visitantes}
          evento={evento?.id ?? null}
        />
        </div>
      </ZoomPan>
      <p className="text-xs text-ink-400 mb-4 text-center">
        🏝️ {feitasConq} de {info.conquistas.length} monumentos na ilha
        {info.prontasConquista > 0 && <span className="text-financa font-semibold"> · {info.prontasConquista} 🎁 esperando</span>}
      </p>

      {/* Etapa 316 — evento da estação */}
      {evento
        ? (() => {
            const feitosEv = progressoDoEvento(snapshot, evento, hoje);
            const ja = premioResgatado(mascote, evento);
            const premio = ITENS.find((i) => i.id === evento.premio)!;
            const pronto = feitosEv >= evento.meta && !ja;
            return (
              <div className={`rounded-2xl border px-4 py-3 mb-4 ${pronto ? "border-financa bg-financa/10" : "border-orange-400/40 bg-orange-400/10"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{evento.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {evento.nome} <span className="text-ink-400 font-normal">· {evento.diasRestantes === 0 ? "último dia!" : `faltam ${evento.diasRestantes} dias`}</span>
                    </p>
                    <p className="text-[11px] text-ink-400">{evento.texto}</p>
                  </div>
                </div>
                {ja ? (
                  <p className="text-xs text-habito font-semibold mt-2">
                    ✓ {premio.emoji} {premio.nome} é sua! Equipe na lojinha do mascote.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span>
                        Faça {evento.meta} hábitos durante o evento e ganhe {premio.emoji} <b>{premio.nome}</b>
                      </span>
                      <span className="font-semibold shrink-0 ml-2">
                        {Math.min(feitosEv, evento.meta)}/{evento.meta}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-base-700 overflow-hidden mt-1.5">
                      <div className="h-full rounded-full bg-orange-400 transition-all duration-700" style={{ width: `${Math.min(100, Math.round((feitosEv / evento.meta) * 100))}%` }} />
                    </div>
                    {pronto && mascote && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={async () => {
                          const novo = resgatarPremioEvento(mascote, evento, feitosEv);
                          if (!novo) return;
                          vibrar([20, 50, 30]);
                          chuvaDeConfete({ quantidade: 80 });
                          await salvar({ ...novo, equipados: { ...novo.equipados, [premio.slot]: premio.id } });
                        }}
                        className="mt-2 w-full rounded-xl py-2 text-sm font-bold bg-financa text-base-900"
                      >
                        Pegar {premio.emoji} {premio.nome}
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()
        : (() => {
            const prox = proximoEvento(hoje);
            if (!prox || prox.faltam > 15) return null;
            return (
              <p className="text-xs text-ink-400 text-center mb-4">
                {prox.evento.emoji} Em breve: {prox.evento.nome} (em {prox.faltam} {prox.faltam === 1 ? "dia" : "dias"})
              </p>
            );
          })()}

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
            ["feira", "🛒", "Feirinha", "Itens com 30% off hoje"],
            ["pesca", "🎣", "Pescaria", (() => { const n = iscasHoje(mascote, dia?.habitos.feitos ?? 0, hoje); return n ? `${n} ${n === 1 ? "isca" : "iscas"} pra usar` : "1 isca por hábito feito"; })()],
            ["trilhas", "🧭", "Trilhas", info.desafios ? `${info.desafios} ${info.desafios === 1 ? "desafio" : "desafios"} em andamento` : "Hábitos prontos e desafios"],
            ["temas", "🎨", "Temas da ilha", "Inverno, outono, cerejeira…"],
          ] as [LugarMundo | "trilhas" | "temas", string, string, string][]
        ).map(([l, emoji, titulo, sub]) => {
          const aviso = (l === "missoes" && info.prontasMissao > 0) || (l === "conquistas" && info.prontasConquista > 0);
          return (
            <button
              key={l}
              type="button"
              onClick={() => (l === "trilhas" ? router.push("/habitos/trilhas") : l === "temas" ? setTemas(true) : ir(l))}
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
      {/* Etapa 315 — feirinha do dia */}
      {feira &&
        (() => {
          const ofertas = ofertasDoDia(mascote, feitos, hoje, snapshot?.perfil?.id ?? "");
          const provado = ofertas.find((o) => o.item.id === provando)?.item;
          return (
            <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60" onClick={() => setFeira(false)}>
              <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-base-800 border border-base-600 p-5 animate-entrar" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-display font-bold text-lg">🛒 Feirinha do dia</p>
                  <span className="text-sm font-semibold text-financa">🪙 {moedas}</span>
                </div>
                <p className="text-xs text-ink-400 mb-3">{Math.round(DESCONTO_FEIRA * 100)}% de desconto · amanhã o vendedor traz outras coisas</p>
                {mascote && (
                  <div className="flex justify-center mb-3">
                    <Mascote
                      cor={mascote.cor}
                      fase={Math.max(1, fase.nivel)}
                      humor="feliz"
                      equipados={provado ? { ...mascote.equipados, [provado.slot]: provado.id } : mascote.equipados}
                      tamanho={110}
                      volume={false}
                    />
                  </div>
                )}
                {!mascote && <p className="text-sm text-ink-400 mb-3">Choque seu mascote pra comprar na feira 🐣</p>}
                {erroFeira && <p className="text-sm text-red-400 mb-2">{erroFeira}</p>}
                {ofertas.length === 0 ? (
                  <p className="text-sm text-ink-400 py-4 text-center">Você já tem tudo que ele vende! Volte amanhã 😄</p>
                ) : (
                  <ul className="space-y-2">
                    {ofertas.map((o) => (
                      <li key={o.item.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${provando === o.item.id ? "border-habito bg-habito/10" : "border-base-600 bg-base-900/40"}`}>
                        <button type="button" onClick={() => setProvando(provando === o.item.id ? null : o.item.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <span className="text-2xl">{o.item.emoji}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold truncate">{o.item.nome}</span>
                            <span className="block text-[11px] text-ink-400">
                              {NOMES_SLOT[o.item.slot]} · <s>{o.item.preco}</s> · toque pra provar
                            </span>
                          </span>
                        </button>
                        {o.comprado ? (
                          <span className="text-xs text-habito font-semibold shrink-0">Seu ✓</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!mascote || salvando}
                            onClick={async () => {
                              if (!mascote) return;
                              setErroFeira(null);
                              const r = comprarNaFeira(mascote, feitos, o.item.id, hoje, snapshot?.perfil?.id ?? "");
                              if (!r.ok) return setErroFeira(r.motivo);
                              vibrar([15, 40, 20]);
                              await salvar(r.mascote);
                            }}
                            className={`shrink-0 text-xs font-bold rounded-full px-3 py-1.5 disabled:opacity-50 ${moedas >= o.preco ? "bg-financa text-base-900" : "bg-base-700 text-ink-400"}`}
                          >
                            {o.preco} 🪙
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => setFeira(false)} className="mt-4 w-full rounded-2xl bg-base-700 py-3 text-sm font-semibold">
                  Fechar
                </button>
              </div>
            </div>
          );
        })()}

      {/* Etapa 312 — temas da ilha */}
      {temas && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60" onClick={() => setTemas(false)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-base-800 border border-base-600 p-5 animate-entrar" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-lg">🎨 Temas da ilha</p>
              <span className="text-sm font-semibold text-financa">🪙 {moedas}</span>
            </div>
            {!mascote && <p className="text-sm text-ink-400 mb-3">Choque seu mascote pra comprar temas 🐣</p>}
            {erroTema && <p className="text-sm text-red-400 mb-2">{erroTema}</p>}
            <div className="grid grid-cols-2 gap-2">
              {TEMAS_ILHA.map((t) => {
                const meu = temTema(mascote, t.id);
                const usando = tema.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!mascote || salvando || usando}
                    onClick={async () => {
                      if (!mascote) return;
                      setErroTema(null);
                      if (meu) {
                        const novo = usarTema(mascote, t.id);
                        if (novo) await salvar(novo);
                        return;
                      }
                      const r = comprarTema(mascote, t.id, moedas);
                      if ("erro" in r) return setErroTema(r.erro);
                      vibrar([15, 40, 20]);
                      await salvar(r.mascote);
                    }}
                    className={`rounded-2xl border p-2 text-left transition ${usando ? "border-habito bg-habito/10" : "border-base-600 bg-base-900/40 hover:border-habito"}`}
                  >
                    <span className="block h-12 rounded-xl relative overflow-hidden" style={{ background: t.agua }}>
                      <span className="absolute inset-x-3 inset-y-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.grama[0]} 50%, ${t.caminho[0]} 50%)` }} />
                      <span className="absolute right-4 top-1 w-4 h-4 rounded-full" style={{ background: t.copa[0] }} />
                    </span>
                    <span className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-semibold">
                        {t.emoji} {t.nome}
                      </span>
                    </span>
                    <span className={`block text-[11px] ${usando ? "text-habito font-semibold" : meu ? "text-ink-300" : moedas >= t.preco ? "text-financa" : "text-ink-500"}`}>
                      {usando ? "Em uso ✓" : meu ? "Usar" : `${t.preco} 🪙`}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setTemas(false)} className="mt-4 w-full rounded-2xl bg-base-700 py-3 text-sm font-semibold">
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
