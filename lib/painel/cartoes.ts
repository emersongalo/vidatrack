// Etapa 220 — painel inicial personalizável: cada pessoa escolhe quais
// resumos aparecem no topo do Painel e em que ordem. A escolha fica só
// no aparelho (localStorage), nada vai pro banco.
import { calcularStreak } from "@/lib/habitos/streak";
import { habitoDevidoNoDia, pausasDe } from "@/lib/habitos/pausa";
import { ehContaComum, preverFimDoMes } from "@/lib/financas/previsao";
import { eventosFinanceiros } from "@/lib/financas/calendario";
import { gastoDoMes, situacaoTeto } from "@/lib/financas/teto";

export const CHAVE_PAINEL = "vidatrack-painel-cartoes";

export type IdCartao =
  | "habitos"
  | "saldo"
  | "previsao"
  | "proxima_conta"
  | "teto"
  | "sequencia"
  | "humor"
  | "metas";

export const CARTOES: { id: IdCartao; nome: string; emoji: string }[] = [
  { id: "habitos", nome: "Hábitos de hoje", emoji: "✅" },
  { id: "saldo", nome: "Saldo em contas", emoji: "💰" },
  { id: "previsao", nome: "Previsão do fim do mês", emoji: "📈" },
  { id: "proxima_conta", nome: "Próxima conta a pagar", emoji: "🧾" },
  { id: "teto", nome: "Teto de gastos", emoji: "🎯" },
  { id: "sequencia", nome: "Maior sequência", emoji: "🔥" },
  { id: "humor", nome: "Humor de hoje", emoji: "🙂" },
  { id: "metas", nome: "Metas", emoji: "🏁" },
];

// Etapa 224 — hábitos de hoje ganhou um cartão próprio no topo do Painel
export const PADRAO_PAINEL: IdCartao[] = ["saldo", "previsao", "proxima_conta", "sequencia"];

const VALIDOS = new Set<string>(CARTOES.map((c) => c.id));

/** Lê o que foi salvo; qualquer coisa estranha volta pro padrão. Lista vazia é válida (pessoa escondeu tudo). */
export function lerPreferenciaPainel(bruto: string | null | undefined): IdCartao[] {
  if (!bruto) return [...PADRAO_PAINEL];
  try {
    const v = JSON.parse(bruto);
    if (!Array.isArray(v)) return [...PADRAO_PAINEL];
    const vistos = new Set<string>();
    const lista: IdCartao[] = [];
    for (const id of v) {
      if (typeof id === "string" && VALIDOS.has(id) && !vistos.has(id)) {
        vistos.add(id);
        lista.push(id as IdCartao);
      }
    }
    return lista;
  } catch {
    return [...PADRAO_PAINEL];
  }
}

export function alternarCartao(lista: IdCartao[], id: IdCartao): IdCartao[] {
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}

export function moverCartao(lista: IdCartao[], id: IdCartao, direcao: -1 | 1): IdCartao[] {
  const i = lista.indexOf(id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

export type ValorCartao = { titulo: string; valor: string; detalhe?: string; href: string; alerta?: boolean };

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function ddmm(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}

const HUMORES = ["", "😞", "🙁", "😐", "🙂", "😄"];

/** Calcula o conteúdo de um cartão a partir do retrato local. Nunca lança erro: sem dados, mostra um convite. */
export function valorDoCartao(id: IdCartao, s: any, hoje: string): ValorCartao {
  const nome = CARTOES.find((c) => c.id === id)!.nome;
  try {
    const contas: any[] = s?.financas?.contas ?? [];
    const transacoes: any[] = s?.financas?.transacoes ?? [];
    const recorrencias: any[] = s?.financas?.recorrencias ?? [];
    const habitos: any[] = s?.habitos ?? [];
    const checkins: any[] = s?.habitoCheckins ?? [];

    switch (id) {
      case "habitos": {
        const devidos = habitos.filter((h) => !h.eh_negativo && habitoDevidoNoDia(h, hoje));
        if (devidos.length === 0) return { titulo: nome, valor: habitos.length ? "Folga 🎉" : "—", detalhe: habitos.length ? "Nada pra hoje" : "Crie seu primeiro", href: "/habitos" };
        const feitos = devidos.filter((h) => {
          const qtd = checkins.filter((c) => c.habito_id === h.id && c.data === hoje).reduce((t, c) => t + Number(c.quantidade || 1), 0);
          return qtd >= Math.max(1, Number(h.meta_diaria) || 1);
        }).length;
        return { titulo: nome, valor: `${feitos}/${devidos.length}`, detalhe: feitos === devidos.length ? "Tudo feito!" : `Faltam ${devidos.length - feitos}`, href: "/habitos" };
      }
      case "saldo": {
        if (!contas.length) return { titulo: nome, valor: "—", detalhe: "Adicione um banco", href: "/financas" };
        const saldo = contas.filter(ehContaComum).reduce((t, c) => t + Number(c.saldo || 0), 0);
        return { titulo: nome, valor: moeda(saldo), href: "/financas", alerta: saldo < 0 };
      }
      case "previsao": {
        if (!contas.length) return { titulo: nome, valor: "—", detalhe: "Adicione um banco", href: "/financas" };
        const p = preverFimDoMes({ contas, transacoes, recorrencias, hojeISO: hoje });
        return {
          titulo: "Fim do mês",
          valor: moeda(p.sobra),
          detalhe: p.porDia != null ? `${moeda(p.porDia)}/dia livre` : p.diaNegativo ? `Negativo em ${ddmm(p.diaNegativo)}` : undefined,
          href: "/financas/calendario",
          alerta: p.sobra < 0,
        };
      }
      case "proxima_conta": {
        const ev = eventosFinanceiros({ contas, transacoes, recorrencias, hojeISO: hoje }, somarDias(hoje, 1), somarDias(hoje, 45)).find(
          (e) => e.tipo === "despesa" && e.afetaSaldo
        );
        if (!ev) return { titulo: nome, valor: "Nenhuma", detalhe: "nos próximos 45 dias", href: "/financas/calendario" };
        return { titulo: nome, valor: moeda(ev.valor), detalhe: `${ev.descricao} · ${ddmm(ev.data)}`, href: `/financas/calendario` };
      }
      case "teto": {
        const teto = Number(s?.perfil?.teto_mensal) || 0;
        if (!teto) return { titulo: nome, valor: "Definir", detalhe: "Quanto quer gastar no mês", href: "/financas" };
        const gasto = gastoDoMes(contas, transacoes, hoje);
        const st = situacaoTeto(gasto, teto, hoje);
        return {
          titulo: nome,
          valor: `${st.pct}%`,
          detalhe: st.estourou ? `Passou ${moeda(-st.restante)}` : `Restam ${moeda(st.restante)}`,
          href: "/financas",
          alerta: st.estourou || st.acimaDoRitmo,
        };
      }
      case "sequencia": {
        let melhor = 0;
        let qual = "";
        for (const h of habitos) {
          if (h.eh_negativo) continue;
          const datas = checkins.filter((c) => c.habito_id === h.id).map((c) => c.data);
          const n = calcularStreak(datas, pausasDe(h), hoje);
          if (n > melhor) {
            melhor = n;
            qual = h.nome;
          }
        }
        return { titulo: nome, valor: melhor ? `${melhor} dia${melhor > 1 ? "s" : ""}` : "—", detalhe: qual || "Marque um hábito hoje", href: "/habitos/estatisticas" };
      }
      case "humor": {
        const d = (s?.diario ?? []).find((x: any) => x.data === hoje);
        if (!d) return { titulo: nome, valor: "Como foi?", detalhe: "Registre seu dia", href: "/habitos/diario" };
        return { titulo: nome, valor: HUMORES[d.humor] || "🙂", detalhe: d.texto ? String(d.texto).slice(0, 40) : undefined, href: "/habitos/diario" };
      }
      case "metas": {
        const longas: any[] = (s?.metasLongas ?? []).filter((m: any) => m.data_fim >= hoje);
        const fin: any[] = (s?.financas?.metas ?? []).filter((m: any) => !m.concluida);
        const lista = [
          ...longas.map((m) => ({ nome: `${m.emoji ?? ""} ${m.nome}`.trim(), pct: m.alvo > 0 ? (Number(m.progresso) / Number(m.alvo)) * 100 : 0, href: "/habitos/metas" })),
          ...fin.map((m) => ({ nome: m.nome ?? "Meta", pct: Number(m.valor_alvo) > 0 ? (Number(m.valor_atual || 0) / Number(m.valor_alvo)) * 100 : 0, href: "/financas/metas" })),
        ].filter((m) => m.pct < 100);
        if (!lista.length) return { titulo: nome, valor: "—", detalhe: "Nenhuma em andamento", href: "/habitos/metas" };
        lista.sort((a, b) => b.pct - a.pct);
        return { titulo: nome, valor: `${Math.round(lista[0].pct)}%`, detalhe: lista[0].nome, href: lista[0].href };
      }
    }
  } catch {
    /* dado estranho no retrato: mostra vazio em vez de quebrar o Painel */
  }
  return { titulo: nome, valor: "—", href: "/dashboard" };
}
