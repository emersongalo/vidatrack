"use client";

// Etapa 292 — Tempo de tela (opcional, só no app Android). Mostra quanto
// tempo você passou em cada tipo de app e, se quiser, cria um hábito
// ("Redes sociais até 1h") que o app confere e marca sozinho.
// Os dados de uso ficam só no celular — nada disso vai pro servidor.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, RefreshCw } from "lucide-react";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";
import { estadoTela, abrirPermissaoTela, lerUsoPorDia, type EstadoTela } from "@/lib/tela/nativo";
import { CATEGORIAS_TELA, formatarMinutos, minutosNasCategorias, resumirDia, type CategoriaTela, type DiaUso } from "@/lib/tela/categorias";
import { gravarConfigTela, lerConfigTela, nomeDoHabitoTela, type ConfigHabitoTela } from "@/lib/tela/habitoTela";
import { conferirHabitoTela } from "@/components/SincronizadorTela";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { useContagem } from "@/components/NumeroAnimado";
import { vibrar } from "@/lib/app/vibrar";

const LIMITES = [30, 60, 90, 120, 180];
const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];

function Barra({ pct, cor }: { pct: number; cor: string }) {
  const v = useContagem(Math.min(100, Math.max(0, pct)), 800);
  return (
    <div className="h-2 rounded-full bg-base-700 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${v}%`, background: cor }} />
    </div>
  );
}

export default function TempoDeTelaPage() {
  const [estado, setEstado] = useState<EstadoTela | null>(null);
  const [dias, setDias] = useState<DiaUso[] | null>(null);
  const [config, setConfig] = useState<ConfigHabitoTela | null>(null);
  const [escolhidas, setEscolhidas] = useState<CategoriaTela[]>(["redes"]);
  const [limite, setLimite] = useState(60);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const hoje = hojeISO();

  const carregar = useCallback(async () => {
    const e = await estadoTela();
    setEstado(e);
    if (e === "ok") setDias(await lerUsoPorDia(7));
  }, []);

  useEffect(() => {
    setConfig(lerConfigTela());
    void carregar();
    // voltou das configurações do Android → confere de novo
    const aoVoltar = () => document.visibilityState === "visible" && void carregar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [carregar]);

  const diaHoje = dias?.find((d) => d.dia === hoje) ?? null;
  const diaOntem = dias && dias.length >= 2 ? dias[dias.length - 2] : null;
  const resumo = useMemo(() => (diaHoje ? resumirDia(diaHoje.apps) : null), [diaHoje]);
  const totalOntem = diaOntem ? resumirDia(diaOntem.apps).total : null;
  const totais = (dias ?? []).map((d) => ({ dia: d.dia, total: resumirDia(d.apps).total }));
  const maxTotal = Math.max(1, ...totais.map((t) => t.total));
  const media = totais.length ? Math.round(totais.reduce((s, t) => s + t.total, 0) / totais.length) : 0;
  const totalAnimado = useContagem(resumo?.total ?? 0, 900);

  async function criarHabito() {
    if (!escolhidas.length || salvando) return;
    setSalvando(true);
    setAviso(null);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("sem sessão");
      const { count } = await supabase.from("habitos").select("id", { count: "exact", head: true }).eq("dono_id", u.user.id);
      const { data, error } = await supabase
        .from("habitos")
        .insert({
          dono_id: u.user.id,
          nome: nomeDoHabitoTela(escolhidas, limite),
          cor: "nota",
          icone: "📵",
          frequencia: "diaria",
          dias_semana: [],
          meta_diaria: 1,
          ordem: count ?? 0,
        })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("não criou");
      const nova: ConfigHabitoTela = { habitoId: data.id, limiteMin: limite, categorias: escolhidas, desde: hoje, conferidos: [] };
      gravarConfigTela(nova);
      setConfig(nova);
      vibrar([15, 40, 25]);
      setAviso("Hábito criado! A partir de amanhã o app confere sozinho como foi o dia.");
      await atualizarSnapshotEmTodasAsTelas();
    } catch {
      setAviso("Não consegui criar agora — confira a internet e tente de novo.");
    }
    setSalvando(false);
  }

  async function conferirAgora() {
    setAviso(null);
    const n = await conferirHabitoTela();
    setConfig(lerConfigTela());
    setAviso(n ? `Pronto! ${n} ${n === 1 ? "dia marcado" : "dias marcados"} no hábito. 🎉` : "Tudo conferido — nenhum dia novo pra marcar.");
  }

  function desligar() {
    gravarConfigTela(null);
    setConfig(null);
    setAviso("O app parou de conferir. O hábito continua na sua lista — dá pra arquivar se quiser.");
  }

  const usadoHojeNoHabito = config && diaHoje ? minutosNasCategorias(diaHoje.apps, config.categorias) : 0;

  return (
    <main className="pagina px-6 md:px-12 pt-4 pb-12">
      <CabecalhoPagina
        voltarHref="/habitos/estatisticas"
        voltarTexto="Estatísticas"
        emoji="📱"
        titulo="Tempo de tela"
        subtitulo="Quanto do seu dia vai pro celular — e um hábito pra usar menos, se você quiser."
      />

      {estado === null && <p className="text-ink-400">Carregando…</p>}

      {estado === "indisponivel" && (
        <div className="rounded-3xl border border-base-600 bg-base-800 p-6 text-center">
          <Smartphone size={36} className="mx-auto text-ink-400 mb-3" />
          <p className="text-lg font-semibold">Só no app Android</p>
          <p className="text-sm text-ink-400 mt-1 max-w-sm mx-auto">
            O tempo de tela vem do próprio Android. Abra o VidaTrack pelo app (versão mais nova da Play Store) pra usar.
          </p>
        </div>
      )}

      {estado === "sem_permissao" && (
        <div className="rounded-3xl border border-nota/30 p-6" style={{ background: "linear-gradient(135deg, rgb(var(--c-nota) / 0.18), rgb(var(--c-nota) / 0.04))" }}>
          <p className="text-4xl mb-2">📱</p>
          <p className="text-xl font-semibold">Veja pra onde vai seu tempo</p>
          <ul className="text-sm text-ink-400 mt-3 space-y-1.5">
            <li>• Tempo por app e por tipo (redes, vídeo, jogos…)</li>
            <li>• Comparação com ontem e com a semana</li>
            <li>• Hábito opcional que se marca sozinho (ex: redes até 1h)</li>
          </ul>
          <p className="flex items-start gap-2 text-xs text-ink-400 mt-4 bg-base-900/40 rounded-xl p-3">
            <ShieldCheck size={16} className="text-habito shrink-0 mt-0.5" />
            Os dados de uso ficam só no seu celular. O VidaTrack não envia a lista de apps pra lugar nenhum.
          </p>
          <button
            type="button"
            onClick={() => void abrirPermissaoTela()}
            className="w-full mt-5 bg-nota text-base-900 font-semibold rounded-2xl py-3.5"
          >
            Permitir acesso ao uso
          </button>
          <p className="text-xs text-ink-400 mt-2 text-center">Na tela que abrir, procure VidaTrack e ative. Depois é só voltar.</p>
        </div>
      )}

      {estado === "ok" && (
        <>
          {/* hoje */}
          <section className="rounded-3xl border border-nota/30 p-5 mb-4" style={{ background: "linear-gradient(135deg, rgb(var(--c-nota) / 0.20), rgb(var(--c-nota) / 0.04))" }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink-400">Hoje no celular</p>
              <button type="button" onClick={() => void carregar()} aria-label="Atualizar" className="text-ink-400 hover:text-ink-100 p-1 -m-1">
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="text-4xl font-display font-bold font-mono">{formatarMinutos(totalAnimado)}</p>
            {totalOntem !== null && resumo && (
              <p className={`text-sm mt-1 ${resumo.total <= totalOntem ? "text-habito" : "text-red-400"}`}>
                {resumo.total <= totalOntem ? "▼" : "▲"} {formatarMinutos(Math.abs(resumo.total - totalOntem))} {resumo.total <= totalOntem ? "a menos" : "a mais"} que ontem (até agora)
              </p>
            )}
            {resumo && resumo.porCategoria.length > 0 && (
              <div className="space-y-2.5 mt-4">
                {resumo.porCategoria.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span>
                        {c.emoji} {c.nome}
                      </span>
                      <span className="font-mono text-ink-400">{formatarMinutos(c.minutos)}</span>
                    </div>
                    <Barra pct={(c.minutos / Math.max(1, resumo.total)) * 100} cor={c.cor} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* semana */}
          {totais.length > 1 && (
            <section className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-4">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-base font-semibold">Últimos 7 dias</h2>
                <span className="text-xs text-ink-400">média {formatarMinutos(media)}/dia</span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {totais.map((t, i) => (
                  <div key={t.dia} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-ink-400 font-mono">{t.total >= 60 ? `${Math.round(t.total / 6) / 10}h` : `${t.total}m`}</span>
                    <div
                      className="w-full rounded-t-lg animate-entrar"
                      style={{
                        height: `${Math.max(4, (t.total / maxTotal) * 100)}%`,
                        background: t.dia === hoje ? "rgb(var(--c-nota))" : "rgb(var(--c-nota) / 0.4)",
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                    <span className={`text-xs ${t.dia === hoje ? "text-ink-100 font-semibold" : "text-ink-400"}`}>
                      {LETRAS[new Date(t.dia + "T12:00:00").getDay()]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* hábito de tela (opcional) */}
          <section className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-4">
            <h2 className="text-base font-semibold mb-1">📵 Hábito de tela (opcional)</h2>
            {config ? (
              <>
                <p className="text-sm text-ink-400 mb-3">
                  O app confere sozinho cada dia que termina e marca o hábito quando você fica dentro do limite.
                </p>
                <div className="rounded-2xl bg-base-900/50 p-4">
                  <p className="text-sm font-medium">{nomeDoHabitoTela(config.categorias, config.limiteMin)}</p>
                  <div className="flex items-baseline justify-between text-sm mt-2 mb-1">
                    <span className="text-ink-400">Hoje até agora</span>
                    <span className={`font-mono ${usadoHojeNoHabito > config.limiteMin ? "text-red-400" : "text-habito"}`}>
                      {formatarMinutos(usadoHojeNoHabito)} de {formatarMinutos(config.limiteMin)}
                    </span>
                  </div>
                  <Barra
                    pct={(usadoHojeNoHabito / config.limiteMin) * 100}
                    cor={usadoHojeNoHabito > config.limiteMin ? "#F87171" : usadoHojeNoHabito > config.limiteMin * 0.8 ? "#FBBF24" : "rgb(var(--c-habito))"}
                  />
                  <p className="text-xs text-ink-400 mt-2">
                    {usadoHojeNoHabito > config.limiteMin
                      ? "Passou do limite hoje — amanhã é um novo dia. 💪"
                      : `Ainda cabem ${formatarMinutos(config.limiteMin - usadoHojeNoHabito)} hoje.`}
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => void conferirAgora()} className="flex-1 rounded-xl border border-base-600 py-2.5 text-sm hover:border-ink-400">
                    Conferir agora
                  </button>
                  <button type="button" onClick={desligar} className="rounded-xl border border-base-600 px-4 py-2.5 text-sm text-ink-400 hover:text-red-400">
                    Desligar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-400 mb-3">Escolha o que quer usar menos e o limite por dia. O hábito entra na sua lista e se marca sozinho.</p>
                <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">O que contar</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CATEGORIAS_TELA.filter((c) => c.id !== "outros").map((c) => {
                    const ativo = escolhidas.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEscolhidas((l) => (ativo ? l.filter((x) => x !== c.id) : [...l, c.id]))}
                        aria-pressed={ativo}
                        className={`text-sm rounded-full px-3 py-1.5 border transition ${ativo ? "bg-ink-100 text-base-900 border-ink-100 font-medium" : "border-base-600 text-ink-400"}`}
                      >
                        {c.emoji} {c.nome}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs uppercase tracking-wide text-ink-400 mb-2">Limite por dia</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {LIMITES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLimite(l)}
                      aria-pressed={limite === l}
                      className={`text-sm rounded-full px-3 py-1.5 border transition ${limite === l ? "bg-nota text-base-900 border-nota font-medium" : "border-base-600 text-ink-400"}`}
                    >
                      {formatarMinutos(l)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void criarHabito()}
                  disabled={!escolhidas.length || salvando}
                  className="w-full bg-nota text-base-900 font-semibold rounded-2xl py-3 disabled:opacity-40"
                >
                  {salvando ? "Criando…" : `Criar “${nomeDoHabitoTela(escolhidas.length ? escolhidas : ["redes"], limite)}”`}
                </button>
              </>
            )}
            {aviso && <p className="text-sm text-ink-100 mt-3">{aviso}</p>}
          </section>

          {/* apps de hoje */}
          {resumo && resumo.topApps.length > 0 && (
            <section className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-4">
              <h2 className="text-base font-semibold mb-3">Apps de hoje</h2>
              <ul className="space-y-3">
                {resumo.topApps.slice(0, 12).map((a) => {
                  const cat = CATEGORIAS_TELA.find((c) => c.id === a.cat)!;
                  return (
                    <li key={a.pacote}>
                      <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                        <span className="min-w-0 break-words">
                          <span className="mr-1.5">{cat.emoji}</span>
                          {a.nome}
                        </span>
                        <span className="font-mono text-ink-400 shrink-0">{formatarMinutos(a.minutos)}</span>
                      </div>
                      <Barra pct={(a.minutos / Math.max(1, resumo.topApps[0].minutos)) * 100} cor={cat.cor} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="flex items-start gap-2 text-xs text-ink-400 mt-2">
            <ShieldCheck size={15} className="text-habito shrink-0" />
            Os dados de uso ficam só neste celular. Pra parar de ler, desative o VidaTrack em Configurações → Acesso ao uso.
          </p>
        </>
      )}

      <Link href="/habitos/estatisticas" className="block text-center text-sm text-ink-400 mt-8 hover:text-ink-100">
        Ver estatísticas dos hábitos →
      </Link>
    </main>
  );
}
