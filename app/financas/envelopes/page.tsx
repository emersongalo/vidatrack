"use client";

// Etapa 221 — envelopes: limite de cada categoria, com a opção de a
// sobra passar pro mês seguinte ou ir pra uma meta.
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { alteracaoAposEnviarSobra, calcularEnvelopes, type Envelope } from "@/lib/financas/envelopes";
import { adicionarProgressoMeta } from "@/app/financas/metas/actions";

export default function EnvelopesPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;

  const meuId = snapshot.perfil.id;
  const categorias = snapshot.financas.categorias as any[];
  const envelopes = calcularEnvelopes(categorias, snapshot.financas.contas as any, snapshot.financas.transacoes as any, hoje);
  const metas = (snapshot.financas.metas as any[]).filter((m) => !m.concluida);
  const ehMinha = (id: string) => categorias.find((c) => c.id === id)?.dono_id === meuId;

  async function alterarCategoria(id: string, valores: Record<string, unknown>) {
    const { error } = await createClient().from("financa_categorias").update(valores).eq("id", id);
    if (error) {
      setErro("Não consegui salvar. Verifique a internet.");
      return false;
    }
    atualizarSnapshotEmTodasAsTelas();
    return true;
  }

  async function alternarAcumulo(env: Envelope) {
    setErro(null);
    setOcupado(env.categoriaId);
    await alterarCategoria(env.categoriaId, { envelope_desde: env.acumula ? null : hoje.slice(0, 7) + "-01" });
    setOcupado(null);
  }

  async function enviarParaMeta(env: Envelope, metaId: string) {
    setErro(null);
    setOcupado(env.categoriaId);
    const fd = new FormData();
    fd.set("valorAdicionar", env.sobraParaMeta.toFixed(2).replace(".", ","));
    const r = await adicionarProgressoMeta(metaId, fd);
    if (r?.erro) setErro(r.erro);
    else await alterarCategoria(env.categoriaId, alteracaoAposEnviarSobra(env, hoje));
    setOcupado(null);
    setEnviando(null);
  }

  const totalDisponivel = envelopes.reduce((s, e) => s + e.disponivel, 0);
  const totalGasto = envelopes.reduce((s, e) => s + e.gasto, 0);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas/mais" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-2 mb-1">Envelopes</h1>
      <p className="text-sm text-ink-400 mb-5">
        Cada categoria com limite vira um envelope. Ligue “guardar a sobra” pra o que não gastar passar pro mês seguinte.
      </p>

      {erro && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-4">{erro}</p>}

      {envelopes.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 text-sm text-ink-400">
          Nenhuma categoria tem limite mensal ainda.{" "}
          <Link href="/financas/categorias" className="text-financa">
            Defina um limite numa categoria →
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-4 flex justify-between text-sm">
            <span className="text-ink-400">Gasto nos envelopes</span>
            <span className="font-mono">
              {formatarMoeda(totalGasto)} <span className="text-ink-400">de {formatarMoeda(totalDisponivel)}</span>
            </span>
          </div>
          <ul className="space-y-3">
            {envelopes.map((e) => {
              const estourou = e.restante < 0;
              return (
                <li key={e.categoriaId} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium truncate">{e.nome}</p>
                    <p className={`font-mono text-sm shrink-0 ${estourou ? "text-red-400" : ""}`}>
                      {estourou ? `-${formatarMoeda(-e.restante)}` : formatarMoeda(e.restante)}
                    </p>
                  </div>
                  <div className="h-2 bg-base-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${estourou ? "bg-red-400" : e.pct >= 80 ? "bg-amber-400" : "bg-financa"}`}
                      style={{ width: `${Math.min(100, e.pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-400 mt-1.5">
                    Gastou {formatarMoeda(e.gasto)} de {formatarMoeda(e.disponivel)}
                    {e.acumula && e.trazido !== 0 && (
                      <> ({e.trazido > 0 ? "+" : "−"}{formatarMoeda(Math.abs(e.trazido))} {e.trazido > 0 ? "de sobra" : "de estouro"} dos meses anteriores)</>
                    )}
                  </p>

                  {ehMinha(e.categoriaId) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={e.acumula}
                          disabled={ocupado === e.categoriaId}
                          onChange={() => alternarAcumulo(e)}
                        />
                        Guardar a sobra pro mês seguinte
                      </label>
                      {e.sobraParaMeta > 0 && metas.length > 0 && enviando !== e.categoriaId && (
                        <button
                          onClick={() => setEnviando(e.categoriaId)}
                          className="ml-auto text-xs text-financa border border-financa/40 rounded-lg px-2.5 py-1"
                        >
                          Mandar {formatarMoeda(e.sobraParaMeta)} pra uma meta
                        </button>
                      )}
                    </div>
                  )}

                  {enviando === e.categoriaId && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <p className="text-xs text-ink-400">
                        {e.acumula ? "A sobra acumulada" : "A sobra do mês passado"} vai pra qual meta?
                      </p>
                      {metas.map((m) => (
                        <button
                          key={m.id}
                          disabled={ocupado === e.categoriaId}
                          onClick={() => enviarParaMeta(e, m.id)}
                          className="text-left text-sm bg-base-900 border border-base-600 rounded-lg px-3 py-2 hover:border-financa disabled:opacity-50"
                        >
                          {m.nome}
                        </button>
                      ))}
                      <button onClick={() => setEnviando(null)} className="text-xs text-ink-400 self-start mt-1">
                        Cancelar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-ink-400 mt-4">
            Mandar pra meta só soma o valor na meta — não mexe no saldo das contas.
          </p>
        </>
      )}
    </main>
  );
}
