"use client";

// Etapa 221 — assinaturas que o app achou sozinho nos lançamentos.
import Link from "next/link";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { detectarAssinaturas } from "@/lib/financas/assinaturas";

export default function AssinaturasPage() {
  const { snapshot } = useSnapshotOffline();
  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;

  const lista = detectarAssinaturas(snapshot.financas.transacoes as any, snapshot.financas.recorrencias as any, hojeISO());
  const mensal = lista.reduce((s, a) => s + a.valorAtual, 0);
  const aumentos = lista.filter((a) => a.aumento);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas/mais" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-2 mb-1">Assinaturas</h1>
      <p className="text-sm text-ink-400 mb-5">
        Gastos que se repetem todo mês com valor parecido — achados nos seus lançamentos dos últimos meses.
      </p>

      {lista.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 text-sm text-ink-400">
          Não achei nenhuma assinatura ainda. Elas aparecem aqui depois de 3 meses cobrando com a mesma descrição.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <p className="text-xs text-ink-400">Por mês</p>
              <p className="text-lg font-mono font-semibold">{formatarMoeda(mensal)}</p>
            </div>
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
              <p className="text-xs text-ink-400">Por ano</p>
              <p className="text-lg font-mono font-semibold">{formatarMoeda(mensal * 12)}</p>
            </div>
          </div>

          {aumentos.length > 0 && (
            <div className="text-sm bg-amber-400/10 border border-amber-400/40 rounded-xl2 p-3 mb-4">
              ⚠️ {aumentos.length === 1 ? "Uma assinatura ficou mais cara" : `${aumentos.length} assinaturas ficaram mais caras`}:{" "}
              {aumentos.map((a) => `${a.descricao} (+${a.aumento!.pct}%)`).join(", ")}
            </div>
          )}

          <ul className="space-y-2">
            {lista.map((a) => (
              <li key={a.chave} className="bg-base-800 border border-base-600 rounded-xl2 p-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.descricao}</p>
                  <p className="text-xs text-ink-400">
                    Por volta do dia {a.diaTipico} · {a.meses} meses seguidos · {formatarMoeda(a.valorAnual)}/ano
                  </p>
                  {a.aumento && (
                    <p className="text-xs text-amber-400">
                      Subiu de {formatarMoeda(a.aumento.de)} pra {formatarMoeda(a.aumento.para)}
                    </p>
                  )}
                  {a.jaEhContaFixa && <p className="text-[11px] text-ink-400">Já está nas contas fixas</p>}
                </div>
                <span className="font-mono text-sm shrink-0">{formatarMoeda(a.valorAtual)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-400 mt-4">
            Quer que o app lance sozinho todo mês?{" "}
            <Link href="/financas/recorrentes" className="text-financa">
              Cadastre como conta fixa →
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
