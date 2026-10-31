"use client";

// Etapa 368 — o mês num calendário: verde quando entrou mais que saiu,
// vermelho quando saiu mais (quanto mais forte, maior a diferença),
// contorno tracejado no dia que ainda tem conta a pagar/receber. No topo
// Entrada · Saída · Saldo previsto contando até o valor. Tocar num dia
// mostra o que teve nele.
import { useMemo, useState } from "react";
import Link from "next/link";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { useContagem } from "@/lib/app/useContagem";
import { nivelDoDia, resumoDoMes } from "@/lib/financas/calendarioMes";
import { vibrar } from "@/lib/app/vibrar";

const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const VERDE = ["", "bg-habito/25", "bg-habito/50", "bg-habito/80 text-base-900"];
const VERMELHO = ["", "bg-red-400/25", "bg-red-400/50", "bg-red-400/80 text-base-900"];

function Numero({ rotulo, valor, cor, ocultos }: { rotulo: string; valor: number; cor: string; ocultos: boolean }) {
  const animado = useContagem(valor);
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase text-ink-400">
        <span className={`w-2 h-2 rounded-full ${cor}`} />
        {rotulo}
      </span>
      <span className="block font-mono text-base font-semibold truncate">
        {ocultos ? "R$ •••" : formatarMoeda(Math.round(animado)).replace(/,00$/, "")}
      </span>
    </div>
  );
}

export function CalendarioFinancas({
  anoMesISO,
  lancamentos,
  saldoPrevisto,
  hojeISO,
  mapaContas,
}: {
  anoMesISO: string;
  lancamentos: any[];
  saldoPrevisto: number | null;
  hojeISO: string;
  mapaContas?: Map<string, any>;
}) {
  const ocultos = useValoresOcultos();
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const { dias, entrada, saida, maior } = useMemo(() => resumoDoMes(lancamentos, anoMesISO, hojeISO), [lancamentos, anoMesISO, hojeISO]);

  const [ano, mes] = anoMesISO.split("-").map(Number);
  const vazios = new Date(ano, mes - 1, 1).getDay();
  const total = new Date(ano, mes, 0).getDate();
  const diaHoje = hojeISO.startsWith(anoMesISO) ? Number(hojeISO.slice(8, 10)) : null;
  const doDia = escolhido ? dias.get(escolhido) : undefined;
  const dataEscolhida = escolhido ? `${anoMesISO}-${String(escolhido).padStart(2, "0")}` : null;

  return (
    <div className="bg-base-800 border border-base-600 rounded-3xl p-4">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Numero rotulo="Entrada" valor={entrada} cor="bg-habito" ocultos={ocultos} />
        <Numero rotulo="Saída" valor={saida} cor="bg-red-400" ocultos={ocultos} />
        <Numero rotulo="Saldo previsto" valor={saldoPrevisto ?? entrada - saida} cor="bg-financa" ocultos={ocultos} />
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
        {LETRAS.map((l, i) => (
          <span key={i} className="text-[11px] text-ink-400">
            {l}
          </span>
        ))}
      </div>
      {/* key = mês: trocar de mês faz os quadradinhos entrarem de novo */}
      <div key={anoMesISO} className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const dia = i + 1;
          const r = dias.get(dia);
          const nivel = nivelDoDia(r, maior);
          const positivo = r ? r.entrada >= r.saida : true;
          const fundo = nivel === 0 ? "bg-base-900/60" : positivo ? VERDE[nivel] : VERMELHO[nivel];
          const ehHoje = dia === diaHoje;
          const ativo = dia === escolhido;
          return (
            <button
              key={dia}
              type="button"
              onClick={() => {
                vibrar(6);
                setEscolhido(ativo ? null : dia);
              }}
              aria-label={`Dia ${dia}${r ? `: entrou ${formatarMoeda(r.entrada)}, saiu ${formatarMoeda(r.saida)}` : ""}`}
              className={`animate-surgir aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition active:scale-95 ${fundo} ${
                r?.pendente ? "border-2 border-dashed border-financa/70" : ""
              } ${ehHoje ? "ring-2 ring-ink-100" : ""} ${ativo ? "ring-2 ring-financa scale-105" : ""} ${nivel === 0 ? "text-ink-400" : ""}`}
              style={{ animationDelay: `${i * 14}ms`, animationFillMode: "both" }}
            >
              {dia}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-ink-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-habito/60" /> entrou mais
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-400/60" /> saiu mais
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-dashed border-financa/70" /> a pagar/receber
        </span>
      </div>

      {escolhido && (
        <div key={escolhido} className="animate-surgir mt-4 bg-base-900/60 border border-base-600 rounded-2xl p-3">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-semibold">
              {new Date(`${dataEscolhida}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {doDia && (
              <Link href={`/financas/extrato?dia=${dataEscolhida}`} className="text-xs text-financa shrink-0">
                Ver no extrato ›
              </Link>
            )}
          </div>
          {!doDia ? (
            <p className="text-sm text-ink-400">Nada nesse dia.</p>
          ) : (
            <ul className="divide-y divide-base-600/60">
              {doDia.itens.map((t: any) => {
                const receita = t.tipo === "receita";
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="block text-sm truncate">
                        {t.recorrencia_id && <span className="text-financa">↻ </span>}
                        {t.descricao || (receita ? "Receita" : "Despesa")}
                      </span>
                      <span className="block text-xs text-ink-400 truncate">
                        {mapaContas?.get(t.conta_id) ?? ""}
                        {t.pago_em ? " · pago" : t.prevista ? " · prevista" : t.data > hojeISO ? " · a pagar" : ""}
                      </span>
                    </span>
                    <span className={`font-mono text-sm shrink-0 ${receita ? "text-habito" : "text-red-400"}`}>
                      {receita ? "+" : "−"}
                      {ocultos ? "R$ •••" : formatarMoeda(Number(t.valor))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
