"use client";

// Etapa 221 — simulador "e se eu cortar…?"
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { gastoMedioCategoria, simular, sobraMediaMensal } from "@/lib/financas/simulador";

function numero(bruto: string): number {
  const n = Number(bruto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function nomeMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function textoMeses(n: number) {
  if (n < 12) return `${n} ${n === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(n / 12);
  const resto = n % 12;
  return `${anos} ${anos === 1 ? "ano" : "anos"}${resto ? ` e ${resto} ${resto === 1 ? "mês" : "meses"}` : ""}`;
}

const CAMPO = "w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none";

export default function SimuladorPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [metaId, setMetaId] = useState<string>("");
  const [alvoLivre, setAlvoLivre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [corte, setCorte] = useState("");
  const [aporteManual, setAporteManual] = useState<string | null>(null);

  const contas = (snapshot?.financas.contas ?? []) as any[];
  const transacoes = (snapshot?.financas.transacoes ?? []) as any[];
  const metas = ((snapshot?.financas.metas ?? []) as any[]).filter((m) => !m.concluida);
  const categorias = ((snapshot?.financas.categorias ?? []) as any[]).filter((c) => c.tipo === "despesa");

  const sobraMedia = useMemo(() => sobraMediaMensal(contas, transacoes, hoje), [contas, transacoes, hoje]);
  const gastoCategoria = useMemo(
    () => (categoriaId ? gastoMedioCategoria(categoriaId, contas, transacoes, hoje) : 0),
    [categoriaId, contas, transacoes, hoje]
  );

  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;

  const meta = metas.find((m) => m.id === metaId);
  const alvo = meta ? Number(meta.valor_alvo) : numero(alvoLivre);
  const atual = meta ? Number(meta.valor_atual) : 0;
  const aporte = aporteManual !== null ? numero(aporteManual) : sobraMedia;
  const corteMensal = numero(corte);
  const sim = alvo > 0 ? simular({ alvo, atual, aporteMensal: aporte, corteMensal, hojeISO: hoje }) : null;

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/financas/mais" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-2 mb-1">E se…?</h1>
      <p className="text-sm text-ink-400 mb-5">Veja em quanto tempo você chega num objetivo — e quanto antes, cortando um gasto.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Objetivo</label>
          <select value={metaId} onChange={(e) => setMetaId(e.target.value)} className={CAMPO}>
            <option value="">Digitar um valor</option>
            {metas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} ({formatarMoeda(Number(m.valor_atual))} de {formatarMoeda(Number(m.valor_alvo))})
              </option>
            ))}
          </select>
          {!meta && (
            <input
              inputMode="decimal"
              value={alvoLivre}
              onChange={(e) => setAlvoLivre(e.target.value)}
              placeholder="Quanto quer juntar? Ex: 5.000"
              className={`${CAMPO} font-mono mt-2`}
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Quanto você guarda por mês</label>
          <input
            inputMode="decimal"
            value={aporteManual ?? String(sobraMedia).replace(".", ",")}
            onChange={(e) => setAporteManual(e.target.value)}
            className={`${CAMPO} font-mono`}
          />
          <p className="text-[11px] text-ink-400 mt-1">
            {aporteManual === null
              ? `Média do que sobrou nos últimos 3 meses: ${formatarMoeda(sobraMedia)}.`
              : "Valor que você digitou."}
          </p>
        </div>

        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Cortar de onde? (opcional)</label>
          <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={CAMPO}>
            <option value="">Nenhuma categoria específica</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {categoriaId && (
            <p className="text-[11px] text-ink-400 mt-1">Você gasta em média {formatarMoeda(gastoCategoria)}/mês aqui.</p>
          )}
          <input
            inputMode="decimal"
            value={corte}
            onChange={(e) => setCorte(e.target.value)}
            placeholder="Quanto cortar por mês? Ex: 200"
            className={`${CAMPO} font-mono mt-2`}
          />
          {categoriaId && gastoCategoria > 0 && (
            <div className="flex gap-2 mt-2">
              {[25, 50].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCorte(String(Math.round((gastoCategoria * p) / 100)))}
                  className="text-xs border border-base-600 rounded-lg px-2.5 py-1 text-ink-400 hover:text-ink-100"
                >
                  Cortar {p}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {sim && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mt-6 space-y-2">
          {sim.falta === 0 ? (
            <p className="text-sm">🎉 Você já chegou nesse objetivo!</p>
          ) : (
            <>
              <p className="text-sm">
                Faltam <span className="font-mono">{formatarMoeda(sim.falta)}</span>.
              </p>
              <p className="text-sm">
                {sim.mesesHoje === null
                  ? "Do jeito que está, sem sobrar dinheiro no mês, não dá pra chegar."
                  : `Do jeito que está: ${textoMeses(sim.mesesHoje)} (${nomeMes(sim.mesHoje!)}).`}
              </p>
              {corteMensal > 0 && sim.mesesComCorte !== null && (
                <p className="text-sm text-financa">
                  Cortando {formatarMoeda(corteMensal)}/mês: {textoMeses(sim.mesesComCorte)} ({nomeMes(sim.mesComCorte!)})
                  {sim.mesesHoje !== null && sim.mesesHoje > sim.mesesComCorte
                    ? ` — ${textoMeses(sim.mesesHoje - sim.mesesComCorte)} antes.`
                    : "."}
                </p>
              )}
              {corteMensal > 0 && (
                <p className="text-xs text-ink-400">Em 12 meses, esse corte junta {formatarMoeda(sim.ganhoEm12Meses)}.</p>
              )}
            </>
          )}
        </div>
      )}
      <p className="text-[11px] text-ink-400 mt-4">É só uma conta pra ajudar a decidir — nada é salvo nem lançado.</p>
    </main>
  );
}
