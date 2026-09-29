"use client";

import { useMemo, useState, useTransition } from "react";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { assinaturasNaoCadastradas, inicioDaRecorrenciaSugerida, type AssinaturaSugerida } from "@/lib/financas/alertas";
import { criarRecorrenciaSugerida } from "@/app/financas/recorrentes/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 215 — cobranças que se repetem e ainda não estão em Recorrentes
export function SugestoesRecorrentes({ snapshot, hojeISO }: { snapshot: SnapshotOffline; hojeISO: string }) {
  const lista = useMemo(
    () => assinaturasNaoCadastradas(snapshot.financas.transacoes as any, snapshot.financas.recorrencias as any, hojeISO),
    [snapshot, hojeISO]
  );
  const [feitas, setFeitas] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const mapaContas = new Map(snapshot.financas.contas.map((c: any) => [c.id, c.nome]));

  const visiveis = lista.filter((s) => !feitas.includes(s.chave));
  if (!visiveis.length) return null;

  function cadastrar(s: AssinaturaSugerida) {
    setErro(null);
    iniciar(async () => {
      const r = await criarRecorrenciaSugerida({
        contaId: s.contaId,
        categoriaId: s.categoriaId,
        valor: s.valorMedio,
        descricao: s.descricao,
        diaMes: s.diaMes,
        dataInicio: inicioDaRecorrenciaSugerida(s, hojeISO),
      });
      if (r.erro) return setErro(r.erro);
      setFeitas((f) => [...f, s.chave]);
      atualizarSnapshotEmTodasAsTelas();
    });
  }

  return (
    <section id="sugestoes" className="mb-8 scroll-mt-6">
      <p className="text-sm text-ink-400 mb-1">🔁 Parecem contas fixas</p>
      <p className="text-xs text-ink-400 mb-3">
        Essas cobranças apareceram em {visiveis[0].meses}+ meses seguidos com valor parecido. Cadastrando, elas entram
        sozinhas todo mês e na previsão do saldo.
      </p>
      {erro && <p className="text-sm text-red-400 mb-2">{erro}</p>}
      <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {visiveis.map((s) => {
          const inicio = inicioDaRecorrenciaSugerida(s, hojeISO);
          return (
            <li key={s.chave} className="bg-base-800 border border-financa/30 rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium truncate">{s.descricao}</p>
                <p className="font-mono text-sm shrink-0">{formatarMoeda(s.valorMedio)}</p>
              </div>
              <p className="text-xs text-ink-400 mt-0.5">
                Todo dia {s.diaMes} · {mapaContas.get(s.contaId) ?? "conta"} · começa em {inicio.slice(8, 10)}/{inicio.slice(5, 7)}
              </p>
              <button
                type="button"
                disabled={pendente}
                onClick={() => cadastrar(s)}
                className="mt-2 text-xs bg-financa text-base-900 font-medium rounded-lg px-3 py-1.5 hover:opacity-90 transition disabled:opacity-50"
              >
                Cadastrar como recorrente
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
