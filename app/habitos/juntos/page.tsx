"use client";

// Etapa 233 — "Juntos": o jardim da dupla. Cada hábito compartilhado
// vira uma plantinha que cresce com os dias em que todos fizeram, com a
// carinha do dia, a sequência juntos e os últimos recados (cutucadas e
// reações).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { infoDupla, fraseDoHumor, ESTAGIOS_PLANTA, type Parceiro } from "@/lib/habitos/dupla";
import { CarinhaDupla } from "@/components/CarinhaDupla";
import { PlantaDupla } from "@/components/PlantaDupla";
import { FaixaDupla } from "@/components/FaixaDupla";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Esqueleto } from "@/components/Esqueleto";
import { IconeHabito } from "@/components/IconeHabito";
import { createClient } from "@/lib/supabase/client";
import { rotuloDoDia } from "@/lib/financas/agruparPorDia";
import { Dica } from "@/components/Dica";

type Recado = { id: string; tipo: string; emoji: string | null; de_nome: string | null; habito_nome: string | null; de_usuario: string; criado_em: string };

const SAUDE = ["Murchinha — façam hoje pra ela se recuperar", "Precisando de água…", "Viçosa e feliz"];

export default function JuntosPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [recados, setRecados] = useState<Recado[] | null>(null);

  const duplas = useMemo(() => {
    if (!snapshot) return null;
    const porHabito = new Map<string, Parceiro[]>();
    for (const p of snapshot.parceiros ?? []) {
      const l = porHabito.get(p.habito_id) ?? [];
      l.push({ id: p.usuario_id, nome: p.nome });
      porHabito.set(p.habito_id, l);
    }
    const checkins = [...snapshot.habitoCheckins, ...(snapshot.checkinsCompartilhados ?? [])];
    const hora = new Date().getHours();
    return (snapshot.habitos as any[])
      .filter((h) => porHabito.has(h.id) && !h.eh_negativo)
      .map((h) => ({ habito: h, info: infoDupla(h, checkins, snapshot.perfil.id, porHabito.get(h.id)!, hoje, hora) }))
      .sort((a, b) => b.info.diasJuntos - a.info.diasJuntos);
  }, [snapshot, hoje]);

  useEffect(() => {
    if (!snapshot || !navigator.onLine) return;
    const supabase = createClient();
    supabase
      .from("habito_interacoes")
      .select("id, tipo, emoji, de_nome, habito_nome, de_usuario, criado_em")
      .or(`de_usuario.eq.${snapshot.perfil.id},para_usuario.eq.${snapshot.perfil.id}`)
      .order("criado_em", { ascending: false })
      .limit(15)
      .then(({ data }) => setRecados((data ?? []) as Recado[]));
  }, [snapshot]);

  // rola até o hábito tocado na faixa (#id)
  useEffect(() => {
    if (!duplas?.length) return;
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [duplas]);

  const eu = snapshot?.perfil.id;

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/habitos" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Hoje
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Juntos 🌱</h1>
      <p className="text-ink-400 text-base mb-6">
        Cada hábito que vocês fazem juntos vira uma plantinha. Ela cresce nos dias em que todos fazem — e murcha um pouco quando ninguém faz.
      </p>
      <Dica contexto="juntos" />

      {duplas === null ? (
        <Esqueleto linhas={2} />
      ) : duplas.length === 0 ? (
        <EstadoVazio
          emoji="🌱"
          tom="habito"
          titulo="Nenhum hábito em dupla ainda"
          texto="Abra um hábito e toque em Compartilhar pra convidar alguém. A plantinha de vocês nasce aqui."
          acao={{ rotulo: "Escolher um hábito", href: "/habitos/lista" }}
        />
      ) : (
        <div className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          {duplas.map(({ habito, info }) => {
            const nomes = info.parceiros.map((p) => p.nome);
            const proximo = ESTAGIOS_PLANTA[info.estagio + 1];
            return (
              <section key={habito.id} id={habito.id} className="scroll-mt-6 bg-base-800 border border-base-600 rounded-3xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center">
                      <IconeHabito icone={habito.icone} tamanho={18} />
                    </span>
                    <p className="text-lg font-semibold flex-1 min-w-0 truncate">{habito.nome}</p>
                    <span className="text-sm text-ink-400 truncate">com {nomes.join(" e ")}</span>
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="rounded-2xl bg-gradient-to-b from-sky-400/10 to-habito/10 px-3 pt-2">
                      <PlantaDupla estagio={info.estagio} saude={info.saude} tamanho={104} />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xl font-display font-bold">{ESTAGIOS_PLANTA[info.estagio].nome}</p>
                      <p className="text-sm text-ink-400">{SAUDE[info.saude]}</p>
                      {proximo && info.proximoEstagioEm !== null && (
                        <>
                          <div className="h-2 bg-base-700 rounded-full overflow-hidden mt-3">
                            <div
                              className="h-full bg-habito rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(100, ((info.diasJuntos - ESTAGIOS_PLANTA[info.estagio].minimo) / (proximo.minimo - ESTAGIOS_PLANTA[info.estagio].minimo)) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-ink-400 mt-1">
                            Mais {info.proximoEstagioEm} {info.proximoEstagioEm === 1 ? "dia" : "dias"} juntos pra virar {proximo.nome.toLowerCase()}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <div className="bg-base-900/60 rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-xl font-bold">🔥 {info.sequencia}</p>
                      <p className="text-xs text-ink-400">seguidos juntos</p>
                    </div>
                    <div className="bg-base-900/60 rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-xl font-bold">🏆 {info.recorde}</p>
                      <p className="text-xs text-ink-400">recorde</p>
                    </div>
                    <div className="bg-base-900/60 rounded-2xl px-3 py-2.5 text-center">
                      <p className="text-xl font-bold">🌱 {info.diasJuntos}</p>
                      <p className="text-xs text-ink-400">dias juntos</p>
                    </div>
                  </div>

                  {/* últimos 14 dias, lado a lado */}
                  <div className="mt-5 space-y-1.5">
                    {[
                      { rotulo: "Você", feito: (d: (typeof info.ultimos14)[number]) => d.eu },
                      { rotulo: nomes.length === 1 ? nomes[0] : "Eles", feito: (d: (typeof info.ultimos14)[number]) => d.parceiros },
                    ].map((linha) => (
                      <div key={linha.rotulo} className="flex items-center gap-2">
                        <span className="w-14 text-xs text-ink-400 truncate">{linha.rotulo}</span>
                        <div className="flex-1 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
                          {info.ultimos14.map((d) => (
                            <span
                              key={d.dia}
                              title={d.dia.split("-").reverse().slice(0, 2).join("/")}
                              className={`aspect-square rounded-md ${
                                linha.feito(d) ? (d.eu && d.parceiros ? "bg-habito" : "bg-habito/45") : d.valia ? "bg-base-700" : "bg-base-900/60"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-base-600 px-5 py-3 bg-base-900/30">
                  <CarinhaDupla humor={info.humor} tamanho={44} />
                  <p className="text-base font-medium">{fraseDoHumor(info.humor, nomes)}</p>
                </div>
                <FaixaDupla habitoId={habito.id} dupla={info} dataISO={hoje} ehHoje />
              </section>
            );
          })}
        </div>
      )}

      {recados && recados.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Recados recentes</h2>
          <ul className="bg-base-800 border border-base-600 rounded-3xl divide-y divide-base-600">
            {recados.map((r) => {
              const deMim = r.de_usuario === eu;
              const quem = deMim ? "Você" : r.de_nome ?? "Seu par";
              const texto =
                r.tipo === "cutucar"
                  ? `${quem} cutucou pra fazer ${r.habito_nome}`
                  : r.tipo === "reacao"
                    ? `${quem} reagiu ${r.emoji ?? ""} a ${r.habito_nome}`
                    : r.tipo === "dupla"
                      ? `Toque duplo em ${r.habito_nome} 🙌`
                      : `${quem} fez ${r.habito_nome}`;
              const icone = r.tipo === "cutucar" ? "👉" : r.tipo === "reacao" ? r.emoji ?? "❤️" : r.tipo === "dupla" ? "🙌" : "💚";
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-2xl w-8 text-center">{icone}</span>
                  <span className="flex-1 min-w-0 text-base truncate">{texto}</span>
                  <span className="text-xs text-ink-400 shrink-0">{rotuloDoDia(new Date(r.criado_em).toLocaleDateString("sv-SE"), hoje)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
