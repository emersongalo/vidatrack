"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { IconeCategoria } from "@/components/IconeCategoria";
<<<<<<< HEAD
import { calcularPeriodo, type PresetPeriodo } from "@/lib/financas/formatacao";
=======
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import {
  calcularPeriodo,
  type PresetPeriodo,
} from "@/lib/financas/formatacao";
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e
import { classeFundoSuave } from "@/lib/agenda/estilo";
import { BotaoRemoverTransacao } from "@/components/BotaoRemoverTransacao";
import { BotaoOcultarValores } from "@/components/BotaoOcultarValores";
import { ValorMonetario } from "@/components/ValorMonetario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

const PRESETS: { valor: PresetPeriodo; rotulo: string }[] = [
  { valor: "este_mes", rotulo: "Este mês" },
  { valor: "mes_passado", rotulo: "Mês passado" },
  { valor: "ultimos_30", rotulo: "Últimos 30 dias" },
  { valor: "este_ano", rotulo: "Este ano" },
  { valor: "tudo", rotulo: "Tudo" },
];

<<<<<<< HEAD
// Etapa 127: filtros viram estado local (sem navegação de URL), dados
// vêm do retrato local — os avatares de "quem lançou" (multi-usuário)
// ficam de fora por enquanto (mesma razão das outras telas: depende
// de foto resolvida no servidor).
export default function ExtratoPage() {
  const { snapshot } = useSnapshotOffline();
  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [preset, setPreset] = useState<PresetPeriodo>("este_mes");
=======
export default async function ExtratoPage({
  searchParams,
}: {
  searchParams: { tipo?: string; inicio?: string; fim?: string; preset?: string; contaId?: string };
}) {
  const supabase = createClient();
  const user = await getUsuarioAtual();
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e

  const contas = snapshot?.financas.contas ?? [];
  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  const mapaCategorias = new Map((snapshot?.financas.categorias ?? []).map((c: any) => [c.id, c]));

  const { inicio, fim } = calcularPeriodo(preset);

  const lista = useMemo(() => {
    return (snapshot?.financas.transacoes ?? []).filter((t: any) => {
      if (t.data < inicio || t.data > fim) return false;
      if (tipo !== "todos" && t.tipo !== tipo) return false;
      return true;
    });
  }, [snapshot, inicio, fim, tipo]);

  const totalReceitas = lista.filter((t: any) => t.tipo === "receita").reduce((a: number, t: any) => a + Number(t.valor), 0);
  const totalDespesas = lista.filter((t: any) => t.tipo === "despesa").reduce((a: number, t: any) => a + Number(t.valor), 0);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl lg:max-w-4xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-5">
        <h1 className="text-2xl font-display font-semibold">Extrato</h1>
        <BotaoOcultarValores />
      </div>

      <div className="flex gap-2 mb-3">
        {(["todos", "receita", "despesa"] as const).map((opcao) => (
          <button
            key={opcao}
            onClick={() => setTipo(opcao)}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              tipo === opcao ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {opcao === "todos" ? "Todos" : opcao === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {PRESETS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPreset(p.valor)}
            className={`shrink-0 text-xs rounded-full px-3 py-1.5 border transition ${
              preset === p.valor ? "bg-financa/20 border-financa text-financa" : "border-base-600 text-ink-400 hover:text-ink-100"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3">
          <p className="text-ink-400 text-xs mb-1">Receitas no período</p>
          <p className="font-mono font-medium text-habito"><ValorMonetario valor={totalReceitas} /></p>
        </div>
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-3">
          <p className="text-ink-400 text-xs mb-1">Despesas no período</p>
          <p className="font-mono font-medium text-red-400"><ValorMonetario valor={totalDespesas} /></p>
        </div>
      </div>

      {snapshot === undefined ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-base-800 border border-base-600 rounded-lg" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <p className="text-ink-400 text-sm">Nenhum lançamento nesse período.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((t: any) => {
            const catInfo = mapaCategorias.get(t.categoria_id) as any;
            return (
              <li key={t.id} className="bg-base-800 border border-base-600 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${classeFundoSuave(
                      catInfo?.cor ?? "financa"
                    )}`}
                  >
                    {catInfo?.icone ? (
                      <IconeCategoria icone={catInfo.icone} />
                    ) : t.tipo === "receita" ? (
                      <TrendingUp size={16} strokeWidth={2} />
                    ) : (
                      <TrendingDown size={16} strokeWidth={2} />
                    )}
                  </span>
                  <p className="text-sm truncate flex-1 min-w-0">{t.descricao || mapaContas.get(t.conta_id)}</p>
                  <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                    {t.tipo === "receita" ? "+" : "-"}
                    <ValorMonetario valor={t.valor} />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1.5 pl-12">
                  <p className="text-xs text-ink-400 truncate min-w-0">
                    {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")} · {mapaContas.get(t.conta_id)}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/financas/${t.id}/editar`} className="text-ink-400 hover:text-ink-100 transition text-xs shrink-0">
                      Editar
                    </Link>
                    <BotaoRemoverTransacao transacaoId={t.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {(snapshot?.financas.transacoes.length ?? 0) >= 3000 && (
        <p className="text-xs text-ink-400 mt-4">Mostrando as 3.000 transações mais recentes guardadas offline.</p>
      )}
    </main>
  );
}
