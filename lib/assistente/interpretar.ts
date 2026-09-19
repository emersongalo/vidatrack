import type { SnapshotOffline } from "@/lib/offline/snapshot";
import { formatarMoeda, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/financas/formatacao";
import { hojeISO } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { calcularPendencias } from "@/lib/notificacoes/calculo";
import { interpretarFala } from "@/lib/financas/parseFala";

export type RespostaAssistente =
  | { tipo: "texto"; texto: string }
  | {
      tipo: "proposta_lancamento";
      texto: string;
      dados: { tipo: "despesa" | "receita"; valor: string; descricao: string | null };
    };

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // tira acento pra comparar sem depender de "gastei" vs "gástei"
}

function contemAlguma(texto: string, palavras: string[]) {
  return palavras.some((p) => texto.includes(p));
}

/**
 * Etapa 142 — o "cérebro" do assistente de chat, 100% baseado em
 * palavras-chave e nos dados que já temos (sem IA nenhuma por trás,
 * então sem custo nenhum de API). Reconhece um conjunto de perguntas
 * comuns; qualquer coisa fora desse conjunto cai no "não entendi".
 */
export function interpretarPergunta(textoOriginal: string, snapshot: SnapshotOffline): RespostaAssistente {
  const texto = normalizar(textoOriginal);
  const hoje = hojeISO();
  const inicioMes = primeiroDiaDoMes(hoje);
  const fimMes = ultimoDiaDoMes(hoje);

  const transacoes = snapshot.financas.transacoes;
  const transacoesDoMes = transacoes.filter((t: any) => t.data >= inicioMes && t.data <= fimMes);
  const mapaCategorias = new Map(snapshot.financas.categorias.map((c: any) => [c.id, c.nome]));

  // --- 1) Pedido pra lançar algo (mesmo interpretador da voz) ---
  if (contemAlguma(texto, ["lanca", "lancar", "registra", "anota", "cadastra"]) || /\d+\s*(reais|r\$)/.test(texto) || contemAlguma(texto, ["gastei", "paguei", "comprei", "recebi", "ganhei"])) {
    const resultado = interpretarFala(textoOriginal);
    if (resultado.valor) {
      const tipoLancamento = resultado.tipo ?? "despesa";
      return {
        tipo: "proposta_lancamento",
        texto: `Entendi: ${tipoLancamento === "receita" ? "receita" : "despesa"} de ${formatarMoeda(
          Number(resultado.valor.replace(",", "."))
        )}${resultado.descricao ? ` (${resultado.descricao})` : ""}. Confirma?`,
        dados: { tipo: tipoLancamento, valor: resultado.valor, descricao: resultado.descricao },
      };
    }
  }

  // --- 2) Orçamento / estourou ---
  if (contemAlguma(texto, ["orcamento", "estourar", "estourei", "limite"])) {
    const categoriasComMeta = snapshot.financas.categorias.filter((c: any) => c.tipo === "despesa" && c.meta_mensal);
    if (categoriasComMeta.length === 0) {
      return { tipo: "texto", texto: "Você ainda não definiu limite de orçamento pra nenhuma categoria." };
    }
    const linhas = categoriasComMeta.map((c: any) => {
      const gasto = transacoesDoMes
        .filter((t: any) => t.categoria_id === c.id && t.tipo === "despesa")
        .reduce((s: number, t: any) => s + Number(t.valor), 0);
      const status = gasto > Number(c.meta_mensal) ? "🔴 estourou" : "🟢 dentro do previsto";
      return `${c.nome}: ${formatarMoeda(gasto)} de ${formatarMoeda(Number(c.meta_mensal))} — ${status}`;
    });
    return { tipo: "texto", texto: linhas.join("\n") };
  }

  // --- 3) Contas a pagar essa semana ---
  if (contemAlguma(texto, ["conta", "pagar", "vencendo", "vencer"]) && !contemAlguma(texto, ["gastei", "paguei"])) {
    const diaHoje = Number(hoje.slice(8, 10));
    const recorrenciasProximas = snapshot.financas.recorrencias.filter((r) => {
      if (!r.ativo) return false;
      const diff = r.dia_mes - diaHoje;
      return diff >= 0 && diff <= 7;
    });
    if (recorrenciasProximas.length === 0) {
      return { tipo: "texto", texto: "Nenhuma conta recorrente vencendo nos próximos 7 dias." };
    }
    const linhas = recorrenciasProximas.map(
      (r) => `${r.descricao || "Recorrência"}: ${formatarMoeda(Number(r.valor))}, todo dia ${r.dia_mes}`
    );
    return { tipo: "texto", texto: `Contas a pagar essa semana:\n${linhas.join("\n")}` };
  }

  // --- 4) Recorrentes / assinaturas ativas ---
  if (contemAlguma(texto, ["assinatura", "recorrente", "recorrencia"])) {
    const ativas = snapshot.financas.recorrencias.filter((r) => r.ativo);
    if (ativas.length === 0) return { tipo: "texto", texto: "Você não tem nenhuma recorrência ativa cadastrada." };
    const linhas = ativas.map((r) => `${r.descricao || "Recorrência"}: ${formatarMoeda(Number(r.valor))}/mês`);
    return { tipo: "texto", texto: linhas.join("\n") };
  }

  // --- 5) Hábito/tarefa pendente hoje ---
  if (contemAlguma(texto, ["habito", "tarefa", "pendente", "hoje"]) && !contemAlguma(texto, ["gastei", "reais"])) {
    const { tarefasVencidas, lembretesPassados } = calcularPendencias(snapshot);
    const checkinsHoje = new Set(
      snapshot.habitoCheckins.filter((c) => c.data === hoje && c.quantidade > 0).map((c) => c.habito_id)
    );
    const habitosPendentesHoje = snapshot.habitos.filter(
      (h: any) => diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje) && !checkinsHoje.has(h.id)
    );
    if (habitosPendentesHoje.length === 0 && tarefasVencidas.length === 0 && lembretesPassados.length === 0) {
      return { tipo: "texto", texto: "Tudo feito por hoje — nenhum hábito ou tarefa pendente! 🎉" };
    }
    const partes: string[] = [];
    if (habitosPendentesHoje.length > 0) {
      partes.push(`Hábitos ainda não feitos hoje: ${habitosPendentesHoje.map((h: any) => h.nome).join(", ")}`);
    }
    if (tarefasVencidas.length > 0) {
      partes.push(`Tarefas vencidas: ${tarefasVencidas.map((t) => t.titulo).join(", ")}`);
    }
    return { tipo: "texto", texto: partes.join("\n") };
  }

  // --- 6) Saldo ---
  if (contemAlguma(texto, ["saldo", "quanto tenho"])) {
    const saldoTotal = snapshot.financas.contas
      .filter((c: any) => c.tipo !== "investimento")
      .reduce((s: number, c: any) => s + Number(c.saldo), 0);
    return { tipo: "texto", texto: `Seu saldo em contas é ${formatarMoeda(saldoTotal)}.` };
  }

  // --- 7) Resumo da semana ---
  if (contemAlguma(texto, ["resumo da semana", "resumo semanal", "essa semana"])) {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const inicioSemana = seteDiasAtras.toLocaleDateString("sv-SE");
    const daSemana = transacoes.filter((t: any) => t.data >= inicioSemana);
    const receitas = daSemana.filter((t: any) => t.tipo === "receita").reduce((s: number, t: any) => s + Number(t.valor), 0);
    const despesas = daSemana.filter((t: any) => t.tipo === "despesa").reduce((s: number, t: any) => s + Number(t.valor), 0);
    return {
      tipo: "texto",
      texto: `Nos últimos 7 dias: recebeu ${formatarMoeda(receitas)} e gastou ${formatarMoeda(despesas)}.`,
    };
  }

  // --- 8) Gasto por categoria específica (ex: "quanto gastei em restaurantes") ---
  if (contemAlguma(texto, ["quanto gastei", "quanto gasto", "gastos com", "gastei com"])) {
    const categoriaEncontrada = snapshot.financas.categorias.find((c: any) =>
      texto.includes(normalizar(c.nome))
    );
    if (categoriaEncontrada) {
      const total = transacoesDoMes
        .filter((t: any) => t.categoria_id === categoriaEncontrada.id && t.tipo === "despesa")
        .reduce((s: number, t: any) => s + Number(t.valor), 0);
      return { tipo: "texto", texto: `Você já gastou ${formatarMoeda(total)} com ${categoriaEncontrada.nome} esse mês.` };
    }
    // Sem categoria identificada — cai pro total geral do mês.
  }

  // --- 9) Gastos do mês em geral ---
  if (contemAlguma(texto, ["gastos", "gastei", "gasto"])) {
    const totalMes = transacoesDoMes
      .filter((t: any) => t.tipo === "despesa")
      .reduce((s: number, t: any) => s + Number(t.valor), 0);
    const porCategoria = new Map<string, number>();
    for (const t of transacoesDoMes) {
      if (t.tipo !== "despesa") continue;
      const nome = (t.categoria_id && mapaCategorias.get(t.categoria_id)) || "Sem categoria";
      porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + Number(t.valor));
    }
    const top3 = Array.from(porCategoria.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, valor]) => `${nome}: ${formatarMoeda(valor)}`)
      .join(", ");
    return {
      tipo: "texto",
      texto: `Esse mês você já gastou ${formatarMoeda(totalMes)}.${top3 ? ` Principais categorias: ${top3}.` : ""}`,
    };
  }

  return {
    tipo: "texto",
    texto:
      "Não entendi essa pergunta ainda. Você pode perguntar sobre: gastos do mês (geral ou por categoria), orçamento, contas a pagar, recorrentes/assinaturas, saldo, resumo da semana, hábitos/tarefas de hoje — ou me pedir pra lançar algo (ex: \"gastei 20 reais no mercado\").",
  };
}
