"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { gastosForaDoNormal, assinaturasNaoCadastradas } from "@/lib/financas/alertas";
import { faturasVencendo } from "@/lib/financas/previsao";
import { alertasDeLimite } from "@/lib/financas/limites80";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 215 — avisos automáticos na tela de Finanças (dá pra dispensar;
// volta no mês seguinte se continuar valendo).
const CHAVE_DISPENSADOS = "vidatrack-alertas-financas-dispensados";

type Alerta = { id: string; emoji: string; texto: string; href: string; acao: string };

function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

export function montarAlertasFinancas(snapshot: SnapshotOffline, hojeISO: string): Alerta[] {
  const { transacoes, categorias, recorrencias, contas } = snapshot.financas;
  const nomes = new Map(categorias.map((c: any) => [c.id, c.nome]));
  const mes = hojeISO.slice(0, 7);
  const alertas: Alerta[] = [];

  for (const f of faturasVencendo(contas as any, transacoes as any, somarDias(hojeISO, -1), somarDias(hojeISO, 5))) {
    const dias = Math.round((Date.parse(f.vencimento) - Date.parse(hojeISO)) / 86400000);
    alertas.push({
      id: `fatura-${f.conta.id}-${f.vencimento}`,
      emoji: "💳",
      texto: `Fatura ${f.conta.nome} de ${formatarMoeda(f.valor)} vence ${dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`}.`,
      href: `/financas/contas/${f.conta.id}/fatura`,
      acao: "Ver fatura",
    });
  }

  // Etapa 247 — avisa ANTES de estourar (aos 80%), não só depois
  for (const a of alertasDeLimite(snapshot as any, hojeISO)) alertas.push(a);

  for (const g of gastosForaDoNormal(transacoes as any, hojeISO).slice(0, 2)) {
    alertas.push({
      id: `fora-${g.categoriaId}-${mes}`,
      emoji: "📈",
      texto: `${nomes.get(g.categoriaId) ?? "Categoria"}: ${formatarMoeda(g.gastoMes)} este mês, ${g.percentualAcima}% acima da sua média (${formatarMoeda(g.media)}).`,
      href: `/financas/extrato?categoria=${g.categoriaId}&tipo=despesa&mes=${mes}`,
      acao: "Ver gastos",
    });
  }

  const assinaturas = assinaturasNaoCadastradas(transacoes as any, recorrencias as any, hojeISO);
  if (assinaturas.length) {
    const a = assinaturas[0];
    alertas.push({
      id: `assinatura-${a.chave}`,
      emoji: "🔁",
      texto:
        assinaturas.length === 1
          ? `"${a.descricao}" (${formatarMoeda(a.valorMedio)}) aparece todo mês. Quer cadastrar como recorrente?`
          : `${assinaturas.length} cobranças se repetem todo mês e não estão em Recorrentes (ex: "${a.descricao}").`,
      href: "/financas/recorrentes#sugestoes",
      acao: "Ver",
    });
  }
  return alertas;
}

export function AlertasFinancas({ snapshot, hojeISO }: { snapshot: SnapshotOffline; hojeISO: string }) {
  const [dispensados, setDispensados] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      setDispensados(JSON.parse(localStorage.getItem(CHAVE_DISPENSADOS) || "[]"));
    } catch {
      setDispensados([]);
    }
  }, []);

  const alertas = useMemo(() => montarAlertasFinancas(snapshot, hojeISO), [snapshot, hojeISO]);
  if (dispensados === null) return null;
  const visiveis = alertas.filter((a) => !dispensados.includes(a.id));
  if (!visiveis.length) return null;

  const dispensar = (id: string) => {
    const novo = [...dispensados, id].slice(-100);
    setDispensados(novo);
    try {
      localStorage.setItem(CHAVE_DISPENSADOS, JSON.stringify(novo));
    } catch {}
  };

  return (
    <div className="mb-6 space-y-2 lg:break-inside-avoid">
      {visiveis.map((a) => (
        <div key={a.id} className="flex items-start gap-3 bg-base-800 border border-financa/30 rounded-xl2 p-3">
          <span className="text-lg leading-none mt-0.5">{a.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{a.texto}</p>
            <Link href={a.href} className="text-xs text-financa hover:underline mt-1 inline-block">
              {a.acao} →
            </Link>
          </div>
          <button type="button" onClick={() => dispensar(a.id)} aria-label="Dispensar" className="text-ink-400 hover:text-ink-100 p-1 -m-1">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
