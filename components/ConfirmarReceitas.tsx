"use client";

// Etapa 268 — "Caiu o salário?": receitas programadas que chegaram o
// dia esperam confirmação. "Caiu" entra no saldo na hora; "Adiar" muda
// a data (amanhã, +2, +5 dias ou outra) e ela volta a perguntar no dia.
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, CalendarClock, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { receitaAguardando, somarDiasISO } from "@/lib/financas/confirmacao";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { vibrar } from "@/lib/app/vibrar";

function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export function ConfirmarReceitas({ snapshot, noInicio = false }: { snapshot: any; noInicio?: boolean }) {
  const hoje = new Date().toLocaleDateString("sv-SE");
  const [feitas, setFeitas] = useState<Record<string, "caiu" | "adiada">>({});
  const [adiando, setAdiando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const contas = new Map(((snapshot?.financas?.contas ?? []) as any[]).map((c) => [c.id, c.nome]));
  const lista = useMemo(
    () =>
      ((snapshot?.financas?.transacoes ?? []) as any[])
        .filter((t) => receitaAguardando(t, hoje))
        .sort((a, b) => a.data.localeCompare(b.data)),
    [snapshot, hoje]
  );
  const visiveis = lista.filter((t) => !feitas[t.id]);
  if (!visiveis.length && !Object.keys(feitas).length) return null;
  if (!visiveis.length) {
    return (
      <div className={`animate-surgir text-sm text-habito bg-habito/10 border border-habito/30 rounded-2xl px-4 py-3 ${noInicio ? "" : "mb-6"}`}>
        ✓ Tudo certo com as receitas de hoje.
      </div>
    );
  }

  async function salvar(id: string, mudanca: Record<string, unknown>, resultado: "caiu" | "adiada") {
    setErro(null);
    setFeitas((f) => ({ ...f, [id]: resultado }));
    setAdiando(null);
    const { error } = await createClient().from("financa_transacoes").update(mudanca).eq("id", id);
    if (error) {
      setFeitas((f) => {
        const n = { ...f };
        delete n[id];
        return n;
      });
      setErro("Não salvou — verifique a internet.");
      return;
    }
    vibrar(resultado === "caiu" ? [15, 40, 25] : 10);
    atualizarSnapshotEmTodasAsTelas();
  }

  return (
    <section className={`bg-base-800 border border-habito/40 rounded-3xl p-4 ${noInicio ? "" : "mb-6 lg:break-inside-avoid"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💰</span>
        <h2 className="text-base font-semibold flex-1">{visiveis.length === 1 ? "Essa receita caiu?" : "Essas receitas caíram?"}</h2>
      </div>
      <p className="text-xs text-ink-400 -mt-2 mb-3">Só entram no saldo quando você confirmar.</p>

      <div className="space-y-2">
        {visiveis.map((t) => (
          <div key={t.id} className="bg-base-900/60 border border-base-600 rounded-2xl p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-medium truncate">{t.descricao || "Receita"}</p>
                <p className="text-xs text-ink-400">
                  {t.data === hoje ? "Prevista pra hoje" : `Prevista pra ${ddmm(t.data)}`} · {contas.get(t.conta_id) ?? ""}
                </p>
              </div>
              <span className="font-mono font-semibold text-habito shrink-0">+{formatarMoeda(Number(t.valor))}</span>
            </div>

            {adiando === t.id ? (
              <div className="mt-3 animate-surgir">
                <p className="text-xs text-ink-400 mb-2">Pra quando?</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["Amanhã", 1],
                    ["+2 dias", 2],
                    ["+5 dias", 5],
                  ].map(([rotulo, n]) => (
                    <button
                      key={rotulo as string}
                      type="button"
                      onClick={() => salvar(t.id, { data: somarDiasISO(hoje, n as number) }, "adiada")}
                      className="text-sm px-3 py-1.5 rounded-full border border-base-600 hover:border-financa hover:text-financa transition"
                    >
                      {rotulo}
                    </button>
                  ))}
                  <input
                    type="date"
                    min={somarDiasISO(hoje, 1)}
                    onChange={(e) => e.target.value && salvar(t.id, { data: e.target.value }, "adiada")}
                    className="text-sm px-2 py-1 rounded-full border border-base-600 bg-base-800 text-ink-100"
                    aria-label="Outra data"
                  />
                  <button type="button" onClick={() => setAdiando(null)} className="text-sm px-2 text-ink-400">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => salvar(t.id, { pago_em: hoje }, "caiu")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-habito text-base-900 rounded-xl py-2.5 text-sm font-semibold active:scale-[0.98] transition"
                >
                  <Check size={16} strokeWidth={3} /> Caiu
                </button>
                <button
                  type="button"
                  onClick={() => setAdiando(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-financa/50 text-financa rounded-xl py-2.5 text-sm font-semibold"
                >
                  <CalendarClock size={16} /> Adiar
                </button>
                <Link
                  href={`/financas/${t.id}/editar`}
                  aria-label="Caiu outro valor? Editar"
                  title="Caiu outro valor? Editar"
                  className="w-10 h-10 rounded-xl border border-base-600 flex items-center justify-center text-ink-400"
                >
                  <Pencil size={15} />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
      {erro && <p className="text-xs text-red-400 mt-2">{erro}</p>}
    </section>
  );
}
