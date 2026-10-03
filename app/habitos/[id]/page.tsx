"use client";

// Etapa 227 — detalhe do hábito, no estilo da fatura de Finanças:
// topo na cor do hábito, resumo em cartão e o histórico mês a mês.
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Pencil, Share2 } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { hexDaCor } from "@/lib/agenda/estilo";
import { resumoDoHabito } from "@/lib/habitos/detalhe";
import { definirCorBarraStatus } from "@/lib/app/barraStatus";
import { IconeHabito } from "@/components/IconeHabito";
import { AnelProgresso } from "@/components/AnelProgresso";
import { CarregandoTela } from "@/components/Esqueleto";
import { CartaoParar } from "@/components/CartaoParar";
import { MelhorHorario } from "@/components/MelhorHorario";
import { Dica } from "@/components/Dica";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function ehCorClara(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

function textoFrequencia(h: any) {
  if (h.frequencia === "diaria") return "Todos os dias";
  if (h.frequencia === "semanal") return `${h.vezes_semana ?? 3}× por semana`;
  const dias = ((h.dias_semana ?? []) as number[]).map((d) => ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][d]);
  return dias.length ? dias.join(", ") : "Dias específicos";
}

export default function DetalheHabitoPage() {
  const params = useParams<{ id: string }>();
  const { snapshot } = useSnapshotOffline();
  const habito = (snapshot?.habitos as any[] | undefined)?.find((h) => h.id === params.id);
  const hex = hexDaCor(habito?.cor ?? "habito");

  useEffect(() => {
    if (habito) definirCorBarraStatus(hex);
  }, [hex, habito]);
  useEffect(() => () => definirCorBarraStatus(null), []);

  if (snapshot === undefined) return <CarregandoTela cartoes={2} linhas={3} />;
  if (!habito) {
    return (
      <main className="pagina px-6 pt-6">
        <Link href="/habitos/lista" className="text-ink-400 text-base">
          ← Hábitos
        </Link>
        <p className="text-ink-400 text-sm mt-6">Não encontrei esse hábito no que está salvo no aparelho.</p>
      </main>
    );
  }

  const hoje = hojeISO();
  const r = resumoDoHabito(habito, snapshot!.habitoCheckins, hoje);
  const texto = ehCorClara(hex) ? "text-base-900" : "text-white";

  return (
    <main className="pagina pb-10">
      <div className={`px-6 pt-5 pb-12 md:rounded-b-3xl ${texto}`} style={{ backgroundColor: hex }}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/habitos/lista" aria-label="Voltar" className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex gap-2">
            <Link href={`/habitos/${habito.id}/compartilhar`} aria-label="Compartilhar" className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center">
              <Share2 size={18} />
            </Link>
            <Link href={`/habitos/${habito.id}/editar`} aria-label="Editar" className="w-11 h-11 rounded-full bg-black/15 flex items-center justify-center">
              <Pencil size={18} />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <span className="w-14 h-14 rounded-full bg-black/15 flex items-center justify-center shrink-0">
            <IconeHabito icone={habito.icone} tamanho={26} />
          </span>
          <div className="min-w-0">
            <h1 className="text-3xl font-display font-bold truncate">{habito.nome}</h1>
            <p className="text-base opacity-80">
              {textoFrequencia(habito)}
              {habito.meta_diaria > 1 ? ` · ${habito.meta_diaria} ${habito.unidade ?? ""}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="relative -mt-6 bg-base-900 rounded-t-3xl px-6 pt-6 md:px-12">
        {/* Etapa 249 — parar de fazer algo: dias limpos + economia + marcos */}
        {habito.eh_negativo && <CartaoParar habito={habito} checkins={snapshot!.habitoCheckins as any[]} hoje={hoje} hex={hex} />}
        {habito.eh_negativo && <Dica contexto="habitoParar" />}
{!habito.eh_negativo && (
        <div className="bg-base-800 border border-base-600 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-4">
            <AnelProgresso valor={r.taxa30 ?? 0} total={100} texto={r.taxa30 === null ? "—" : `${r.taxa30}%`} />
            <div>
              <p className="text-xl font-semibold">Últimos 30 dias</p>
              <p className="text-base text-ink-400">de constância</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-base-900/60 rounded-2xl p-3">
              <p className="text-sm text-ink-400">{habito.eh_negativo ? "🛡️ Limpo" : "🔥 Agora"}</p>
              <p className="text-lg font-semibold">{r.sequencia} d</p>
            </div>
            <div className="bg-base-900/60 rounded-2xl p-3">
              <p className="text-sm text-ink-400">🏆 Recorde</p>
              <p className="text-lg font-semibold">{r.melhor} d</p>
            </div>
            <div className="bg-base-900/60 rounded-2xl p-3">
              <p className="text-sm text-ink-400">✅ Total</p>
              <p className="text-lg font-semibold">{r.totalFeitos}</p>
            </div>
          </div>
        </div>
        )}

        {/* Etapa 249 — melhor horário */}
        {!habito.eh_negativo && (
          <MelhorHorario habitoId={habito.id} checkins={snapshot!.habitoCheckins as any[]} hex={hex} lembrete={habito.horario_lembrete} />
        )}

        <h2 className="text-xl font-semibold mb-3">Histórico</h2>
        <div className="space-y-4">
          {r.meses.map((m) => {
            const offset = new Date(m.dias[0].dia + "T12:00:00").getDay();
            return (
              <section key={m.mes} className="bg-base-800 border border-base-600 rounded-2xl p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-base font-semibold">{m.rotulo}</h3>
                  <span className="text-sm text-ink-400">
                    {m.devidos > 0 ? `${m.feitos} de ${m.devidos} dias` : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {DIAS_SEMANA.map((d, i) => (
                    <span key={i} className="text-xs text-ink-400">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: offset }).map((_, i) => (
                    <span key={`v${i}`} />
                  ))}
                  {m.dias.map((d) => (
                    <span
                      key={d.dia}
                      title={d.dia.split("-").reverse().join("/")}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                        d.estado === "feito"
                          ? `${ehCorClara(hex) ? "text-base-900" : "text-white"} font-semibold`
                          : d.estado === "falhou"
                            ? "bg-red-400/15 text-red-400"
                            : d.estado === "folga"
                              ? "bg-base-700/50 text-ink-400"
                              : "text-ink-400/40"
                      } ${d.dia === hoje ? "ring-2 ring-ink-100" : ""}`}
                      style={d.estado === "feito" ? { backgroundColor: hex } : undefined}
                    >
                      {Number(d.dia.slice(8))}
                    </span>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        <p className="text-xs text-ink-400 mt-4">
          Colorido = feito · vermelho = não fez · cinza = dia de folga ou pausa.
        </p>
      </div>
    </main>
  );
}
