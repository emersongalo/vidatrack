// Etapa 358 — texto amigável de cada coisa que está esperando sincronizar
import type { AcaoPendente } from "@/lib/offline/fila";

type Snap = { habitos?: any[]; tarefas?: any[]; financas?: { contas?: any[]; transacoes?: any[] } } | null | undefined;

export type Descricao = { emoji: string; titulo: string; detalhe?: string; area: "habito" | "tarefa" | "financa" | "agenda" | "outro" };

const brl = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(v ?? "");
};
const dia = (iso?: string) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");

export function descreverAcao(a: AcaoPendente, snap: Snap): Descricao {
  const habito = (id: string) => (snap?.habitos ?? []).find((h) => h.id === id)?.nome ?? "hábito";
  const tarefa = (id: string) => (snap?.tarefas ?? []).find((t) => t.id === id)?.titulo ?? "tarefa";
  const conta = (id: string) => (snap?.financas?.contas ?? []).find((c) => c.id === id)?.nome;
  const x = a as any;
  switch (a.tipo) {
    case "checkin_habito":
      return { emoji: "✅", titulo: `Marcar "${habito(a.habitoId)}"`, detalhe: dia(a.data), area: "habito" };
    case "ajuste_habito":
      return { emoji: a.delta > 0 ? "➕" : "➖", titulo: `${a.delta > 0 ? "+" : ""}${a.delta} em "${habito(a.habitoId)}"`, detalhe: dia(a.data), area: "habito" };
    case "conclusao_tarefa":
      return { emoji: "☑️", titulo: `Concluir "${tarefa(a.tarefaId)}"`, detalhe: dia(a.data), area: "tarefa" };
    case "criar_transacao":
      return {
        emoji: a.dados.tipo === "receita" ? "💵" : "💸",
        titulo: `${a.dados.descricao || (a.dados.tipo === "receita" ? "Receita" : "Gasto")} · ${brl(a.dados.valor)}`,
        detalhe: [conta(a.dados.contaId), dia(a.dados.data)].filter(Boolean).join(" · "),
        area: "financa",
      };
    case "editar_transacao":
      return { emoji: "✏️", titulo: `Editar lançamento: ${a.dados.descricao || brl(a.dados.valor)}`, detalhe: dia(a.dados.data), area: "financa" };
    case "apagar_transacao": {
      const t = (snap?.financas?.transacoes ?? []).find((t) => t.id === a.transacaoId);
      return { emoji: "🗑️", titulo: `Apagar lançamento${t?.descricao ? `: ${t.descricao}` : ""}`, area: "financa" };
    }
    case "criar_habito":
      return { emoji: "🌱", titulo: `Novo hábito "${a.dados.nome}"`, area: "habito" };
    case "criar_tarefa": {
      const titulo = (a.entradas ?? []).find((e) => e[0] === "titulo")?.[1] ?? "tarefa";
      return { emoji: "📝", titulo: `Nova tarefa "${titulo}"`, area: "tarefa" };
    }
    case "criar_evento":
      return { emoji: "📅", titulo: `Novo compromisso "${x.dados?.titulo ?? ""}"`, detalhe: dia(x.dados?.data), area: "agenda" };
    case "editar_evento":
      return { emoji: "📅", titulo: `Editar compromisso "${x.dados?.titulo ?? ""}"`, detalhe: dia(x.dados?.data), area: "agenda" };
    case "apagar_evento":
      return { emoji: "🗓️", titulo: a.soODia ? "Tirar um dia de um compromisso" : "Apagar compromisso", detalhe: dia(a.soODia ?? undefined), area: "agenda" };
    case "generica": {
      const area = /Habito|Checkin|Rotina/i.test(a.acao)
        ? "habito"
        : /Tarefa|Subtarefa/i.test(a.acao)
          ? "tarefa"
          : /gravarNoBanco/.test(a.acao)
            ? "outro"
            : "financa";
      const tabela = a.acao === "gravarNoBanco" ? String((a.args?.[0] as any)?.tabela ?? "") : "";
      const nomeTabela: Record<string, string> = {
        diario_dias: "Diário do dia",
        habitos: "Hábito",
        tarefas: "Tarefa",
        financa_transacoes: "Lançamento",
        perfis: "Preferências",
        metas_longas: "Meta",
        blocos_tempo: "Planejador",
        divisoes_despesa: "Divisão",
        categorias_produtividade: "Categoria",
        financa_recorrencias: "Conta fixa",
        mensagens_suporte: "Mensagem pro suporte",
      };
      return {
        emoji: area === "habito" ? "🌱" : area === "tarefa" ? "📝" : area === "financa" ? "💰" : "💾",
        titulo: a.rotulo || nomeTabela[tabela] || "Alteração",
        area,
      };
    }
  }
  return { emoji: "💾", titulo: "Alteração", area: "outro" };
}

export function haQuanto(ms: number, agora = Date.now()) {
  const min = Math.round((agora - ms) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
