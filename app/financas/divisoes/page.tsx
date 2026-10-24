"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { marcarDivisaoComoPaga, excluirDivisao } from "./actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { Check, Trash2, Plus } from "lucide-react";
import { gravar } from "@/lib/local/gravar";
import { lerCacheLista, salvarCacheLista, sobreporEscritas } from "@/lib/local/cacheLista";
import { pendentesDivisao } from "@/lib/local/divisoes";

// Etapa 129 — dinheiro entre pessoas diferentes merece vir sempre
// fresco do servidor, então busca direto (não entra no retrato).
export default function DivisoesPage() {
  const [devemPraMim, setDevemPraMim] = useState<any[] | null>(null);
  const [euDevo, setEuDevo] = useState<any[] | null>(null);
  const [, iniciarTransicao] = useTransition();

  const buscar = useCallback(async () => {
    // Etapa 354 — mostra a última cópia (com o que está na fila por cima) e
    // atualiza do banco quando tem internet
    const mostrar = (a: any[], b: any[]) => {
      setDevemPraMim([...pendentesDivisao(), ...sobreporEscritas(a, "divisoes_despesa")]);
      setEuDevo(sobreporEscritas(b, "divisoes_despesa"));
    };
    const cache = lerCacheLista<{ a: any[]; b: any[] }>("divisoes");
    if (cache) mostrar(cache.a, cache.b);
    else if (navigator.onLine === false) mostrar([], []);
    if (navigator.onLine === false) return;
    const supabase = createClient();
    const user = (await supabase.auth.getSession()).data.session?.user;
    if (!user) return;

    const [{ data: a }, { data: b }] = await Promise.all([
      supabase
        .from("divisoes_despesa")
        .select("id, participante_email, valor, pago, financa_transacoes(descricao, data)")
        .eq("dono_id", user.id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("divisoes_despesa")
        .select("id, valor, pago, dono_id, financa_transacoes(descricao, data)")
        .eq("participante_id", user.id)
        .order("criado_em", { ascending: false }),
    ]);
    if (!a || !b) return; // falhou: fica com a cópia
    salvarCacheLista("divisoes", { a, b });
    mostrar(a, b);
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  function marcarPago(id: string) {
    iniciarTransicao(async () => {
      // Etapa 354 — sem internet também
      if (navigator.onLine === false) await gravar({ tabela: "divisoes_despesa", op: "update", id, valores: { pago: true } });
      else await marcarDivisaoComoPaga(id);
      buscar();
    });
  }

  const totalDevemPraMim = (devemPraMim ?? []).filter((d) => !d.pago).reduce((s, d) => s + Number(d.valor), 0);
  const totalEuDevo = (euDevo ?? []).filter((d) => !d.pago).reduce((s, d) => s + Number(d.valor), 0);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-3xl font-display font-bold">Divisões</h1>
        <Link
          href="/financas/dividir"
          className="flex items-center gap-1.5 bg-financa text-base-900 text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition"
        >
          <Plus size={16} strokeWidth={2.5} /> Dividir
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-xs text-ink-400 mb-1">Devem pra você</p>
          <p className="text-xl font-mono font-semibold text-habito">{formatarMoeda(totalDevemPraMim)}</p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-xs text-ink-400 mb-1">Você deve</p>
          <p className="text-xl font-mono font-semibold text-red-400">{formatarMoeda(totalEuDevo)}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Devem pra você</h2>
      <ul className="space-y-2 mb-8">
        {(devemPraMim ?? []).map((d) => (
          <li
            key={d.id}
            className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4 ${d.pago ? "opacity-50" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{d.participante_email}</p>
              <p className="text-xs text-ink-400 truncate">
                {d.financa_transacoes?.descricao || "Despesa"} ·{" "}
                {d.financa_transacoes?.data ? new Date(d.financa_transacoes.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}
              </p>
            </div>
            <span className="font-mono text-sm shrink-0">{formatarMoeda(d.valor)}</span>
            {!d.pago && (
              <button onClick={() => marcarPago(d.id)} aria-label="Marcar como pago" className="text-ink-400 hover:text-habito transition">
                <Check size={16} strokeWidth={2.5} />
              </button>
            )}
            <BotaoComConfirmacao
              acao={async () => {
                if (navigator.onLine === false) await gravar({ tabela: "divisoes_despesa", op: "delete", id: d.id });
                else await excluirDivisao(d.id);
              }}
              textoBotao={<Trash2 size={14} strokeWidth={2} />}
              textoConfirmacao="Excluir essa divisão?"
              classeBotao="text-ink-400 hover:text-red-400 transition"
              aoConcluir={buscar}
            />
          </li>
        ))}
        {devemPraMim !== null && devemPraMim.length === 0 && (
          <p className="text-sm text-ink-400">🤝 Ninguém te deve nada por enquanto.</p>
        )}
      </ul>

      <h2 className="text-lg font-semibold mb-3">Você deve</h2>
      <ul className="space-y-2">
        {(euDevo ?? []).map((d) => (
          <li key={d.id} className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4 ${d.pago ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {d.financa_transacoes?.descricao || "Despesa"} ·{" "}
                {d.financa_transacoes?.data ? new Date(d.financa_transacoes.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}
              </p>
              <p className="text-xs text-ink-400">{d.pago ? "Já pago" : "Pendente"}</p>
            </div>
            <span className="font-mono text-sm shrink-0">{formatarMoeda(d.valor)}</span>
          </li>
        ))}
        {euDevo !== null && euDevo.length === 0 && <p className="text-sm text-ink-400">🤝 Você não deve nada por enquanto.</p>}
      </ul>
    </main>
  );
}
