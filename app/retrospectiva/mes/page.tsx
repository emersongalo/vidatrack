"use client";

// Etapa 276 — retrospectiva do mês: aparece no Início nos primeiros dias
// do mês (sobre o mês que passou), e dá pra navegar pelos meses.
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { resumoDoPeriodo, ultimoDiaDoMes, mesAnterior } from "@/lib/geral/resumoPeriodo";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { useValoresOcultos } from "@/lib/preferencias/useValoresOcultos";
import { CarregandoTela } from "@/components/Esqueleto";
import { NumeroAnimado } from "@/components/NumeroAnimado";
import { chuvaDeConfete } from "@/lib/app/festa";
import { emojiDoHumor } from "@/lib/habitos/diario";

export default function RetrospectivaMesPage() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}

function nomeDoMes(mes: string) {
  const t = new Date(mes + "-15T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Cartao({ emoji, titulo, children, detalhe, borda }: { emoji: string; titulo: string; children: React.ReactNode; detalhe?: React.ReactNode; borda: string }) {
  return (
    <div className={`bg-base-800 border rounded-2xl p-4 ${borda}`}>
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-xs text-ink-400">{titulo}</p>
      <div className="text-xl font-display font-semibold break-words">{children}</div>
      {detalhe && <p className="text-xs text-ink-400 mt-1">{detalhe}</p>}
    </div>
  );
}

function Conteudo() {
  const params = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const ocultos = useValoresOcultos();
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  const mParam = params.get("m");
  const mes = mParam && /^\d{4}-\d{2}$/.test(mParam) && mParam <= mesAtual ? mParam : mesAnterior(mesAtual);

  const r = useMemo(() => (snapshot ? resumoDoPeriodo(snapshot, `${mes}-01`, ultimoDiaDoMes(mes), hoje) : null), [snapshot, mes, hoje]);
  const antes = useMemo(() => {
    if (!snapshot) return null;
    const ma = mesAnterior(mes);
    return resumoDoPeriodo(snapshot, `${ma}-01`, ultimoDiaDoMes(ma), hoje);
  }, [snapshot, mes, hoje]);

  const festejou = useRef("");
  useEffect(() => {
    if (r && festejou.current !== mes && (r.habitos.feitos > 0 || r.tarefas.concluidas > 0)) {
      festejou.current = mes;
      const t = setTimeout(() => chuvaDeConfete({ quantidade: 50 }), 400);
      return () => clearTimeout(t);
    }
  }, [r, mes]);

  if (snapshot === undefined) return <CarregandoTela cartoes={4} linhas={2} />;
  if (!snapshot || !r || !antes) {
    return (
      <main className="pagina px-6 pt-6">
        <p className="text-ink-400">Abra o app com internet uma vez pra montar sua retrospectiva.</p>
      </main>
    );
  }

  const dinheiro = (v: number) => (ocultos ? "R$ ••••" : formatarMoeda(v));
  const parcial = mes === mesAtual;
  const difGasto = antes.financas.despesas > 0 ? Math.round(((r.financas.despesas - antes.financas.despesas) / antes.financas.despesas) * 100) : null;
  const difHabitos = r.habitos.pct !== null && antes.habitos.pct !== null ? r.habitos.pct - antes.habitos.pct : null;
  const vazio = r.habitos.feitos === 0 && r.tarefas.concluidas === 0 && r.financas.despesas === 0 && r.financas.receitas === 0;

  return (
    <main className="pagina px-6 md:px-12 pt-4 pb-12">
      <Link href="/dashboard" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Início
      </Link>

      <div className="mt-4 rounded-3xl p-6 border border-nota/30 animate-quicar" style={{ background: "linear-gradient(135deg, rgba(156,143,217,0.25), rgba(217,162,76,0.12))" }}>
        <p className="text-sm text-ink-400">Seu mês em números{parcial ? " (até agora)" : ""}</p>
        <h1 className="text-3xl font-display font-bold mt-1">{nomeDoMes(mes)} ✨</h1>
        <div className="flex gap-2 mt-4 text-sm">
          <Link href={`/retrospectiva/mes?m=${mesAnterior(mes)}`} className="rounded-full bg-base-900/40 px-3 py-1 hover:bg-base-900/60">
            ‹ Mês anterior
          </Link>
          {mes < mesAtual && (
            <Link
              href={`/retrospectiva/mes?m=${new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 1)).toISOString().slice(0, 7)}`}
              className="rounded-full bg-base-900/40 px-3 py-1 hover:bg-base-900/60"
            >
              Próximo ›
            </Link>
          )}
        </div>
      </div>

      {vazio ? (
        <p className="text-ink-400 text-sm mt-6">Nada registrado nesse mês ainda.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5 lista-entrar">
          {r.habitos.pct !== null && (
            <Cartao
              emoji="✅"
              titulo="Constância nos hábitos"
              borda="border-habito/40"
              detalhe={
                difHabitos === null || difHabitos === 0
                  ? `${r.habitos.feitos} de ${r.habitos.devidos} dias`
                  : difHabitos > 0
                    ? `▲ ${difHabitos} pontos vs mês anterior 👏`
                    : `▼ ${Math.abs(difHabitos)} pontos vs mês anterior`
              }
            >
              <NumeroAnimado valor={r.habitos.pct} sufixo="%" />
            </Cartao>
          )}
          {r.habitos.maiorSequencia && (
            <Cartao emoji="🔥" titulo="Maior sequência" borda="border-habito/40" detalhe={r.habitos.maiorSequencia.nome}>
              <NumeroAnimado valor={r.habitos.maiorSequencia.dias} sufixo=" dias" />
            </Cartao>
          )}
          {r.habitos.maisFeito && (
            <Cartao emoji="🌟" titulo="Hábito campeão" borda="border-habito/40" detalhe={`${r.habitos.maisFeito.dias} dias feitos`}>
              {r.habitos.maisFeito.nome}
            </Cartao>
          )}
          {r.tarefas.concluidas > 0 && (
            <Cartao emoji="📋" titulo="Tarefas concluídas" borda="border-nota/40">
              <NumeroAnimado valor={r.tarefas.concluidas} />
            </Cartao>
          )}
          {(r.financas.receitas > 0 || r.financas.despesas > 0) && (
            <Cartao
              emoji={r.financas.saldo >= 0 ? "💰" : "⚠️"}
              titulo={r.financas.saldo >= 0 ? "Sobrou no mês" : "Faltou no mês"}
              borda="border-financa/40"
              detalhe={`Entrou ${dinheiro(r.financas.receitas)} · saiu ${dinheiro(r.financas.despesas)}`}
            >
              <span className={r.financas.saldo >= 0 ? "text-habito" : "text-red-400"}>{dinheiro(Math.abs(r.financas.saldo))}</span>
            </Cartao>
          )}
          {r.financas.despesas > 0 && (
            <Cartao
              emoji="💸"
              titulo="Gastos"
              borda="border-financa/40"
              detalhe={
                difGasto === null || Math.abs(difGasto) < 3
                  ? "parecido com o mês anterior"
                  : difGasto < 0
                    ? `${Math.abs(difGasto)}% menos que o mês anterior 👏`
                    : `${difGasto}% a mais que o mês anterior`
              }
            >
              {dinheiro(r.financas.despesas)}
            </Cartao>
          )}
          {r.financas.categoriaTop && (
            <Cartao emoji="🏷️" titulo="Onde mais gastou" borda="border-financa/40" detalhe={dinheiro(r.financas.categoriaTop.valor)}>
              {r.financas.categoriaTop.nome}
            </Cartao>
          )}
          {r.financas.maiorGasto && (
            <Cartao emoji="🧾" titulo="Maior gasto" borda="border-financa/40" detalhe={r.financas.maiorGasto.descricao}>
              {dinheiro(r.financas.maiorGasto.valor)}
            </Cartao>
          )}
          {r.humor.media !== null && (
            <Cartao emoji={emojiDoHumor(Math.round(r.humor.media))} titulo="Humor médio" borda="border-nota/40" detalhe={`${r.humor.dias} dias registrados`}>
              {String(r.humor.media).replace(".", ",")} / 5
            </Cartao>
          )}
        </div>
      )}

      <Link href={`/retrospectiva?ano=${mes.slice(0, 4)}`} className="block text-center text-sm text-nota mt-8 hover:underline">
        Ver a retrospectiva do ano →
      </Link>
    </main>
  );
}
