import type { SnapshotOffline } from "@/lib/offline/snapshot";
import { habitoDevidoNoDia } from "@/lib/habitos/pausa";
import { formatarMoeda, primeiroDiaDoMes, ultimoDiaDoMes } from "@/lib/financas/formatacao";
import { calcularComparacaoSemanal } from "@/lib/financas/insights-calculo";
import { hojeISO, calcularStreak } from "@/lib/habitos/streak";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { calcularPendencias } from "@/lib/notificacoes/calculo";
import { interpretarFala } from "@/lib/financas/parseFala";
import { sugerirCategoria } from "@/lib/financas/sugestaoCategoria";
import { acharCategoria, contemParecido, gastosPorCategoria } from "@/lib/assistente/categorias";
import { assuntoDaFrase, contaDaFrase, dataDaFrase, limparDescricao, periodoDaFrase, semAcento } from "@/lib/assistente/entender";

export type RespostaAssistente =
  | { tipo: "texto"; texto: string }
  | {
      tipo: "proposta_lancamento";
      texto: string;
      dados: {
        tipo: "despesa" | "receita";
        valor: string;
        descricao: string | null;
        /** Etapa 220 — o assistente já escolhe data, conta e categoria */
        data?: string;
        contaId?: string | null;
        categoriaId?: string | null;
      };
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
  // Etapa 220 — entende data ("ontem", "dia 12"), conta ("no nubank") e
  // escolhe a categoria pelo histórico. Pergunta ("quanto...") não é lançamento.
  const ehPergunta = /\bquanto|\bquais?\b|\?/.test(texto);
  if (
    !ehPergunta &&
    (contemAlguma(texto, ["lanca", "lancar", "registra", "anota", "cadastra"]) ||
      /\d+\s*(reais|r\$)/.test(texto) ||
      contemAlguma(texto, ["gastei", "paguei", "comprei", "recebi", "ganhei"]))
  ) {
    const semDatas = textoOriginal.replace(/\bdia\s+\d{1,2}\b/gi, " ").replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g, " ");
    const resultado = interpretarFala(semDatas);
    if (resultado.valor) {
      const tipoLancamento = resultado.tipo ?? "despesa";
      const contas = (snapshot.financas.contas as any[]).filter((c) => c.tipo !== "investimento");
      const conta = contaDaFrase(textoOriginal, contas);
      const data = dataDaFrase(textoOriginal, hoje) ?? hoje;
      const descricao = limparDescricao(resultado.descricao, conta?.nome ?? null);
      const categoriaId = descricao
        ? sugerirCategoria(descricao, tipoLancamento, transacoes as any[], snapshot.financas.categorias as any[])
        : null;
      const detalhes = [
        descricao,
        categoriaId ? mapaCategorias.get(categoriaId) : null,
        conta?.nome,
        data !== hoje ? data.split("-").reverse().slice(0, 2).join("/") : null,
      ].filter(Boolean);
      return {
        tipo: "proposta_lancamento",
        texto: `Entendi: ${tipoLancamento === "receita" ? "receita" : "despesa"} de ${formatarMoeda(
          Number(resultado.valor.replace(",", "."))
        )}${detalhes.length ? ` — ${detalhes.join(" · ")}` : ""}. Confirma?`,
        dados: { tipo: tipoLancamento, valor: resultado.valor, descricao, data, contaId: conta?.id ?? null, categoriaId },
      };
    }
  }

  // --- 1b) Etapa 228: categorias — "quais minhas categorias?", "onde mais gastei mês passado?",
  //         "quanto ainda posso gastar com mercado?" ---
  const periodoFrase = periodoDaFrase(textoOriginal, hoje);
  const periodoPadrao = periodoFrase ?? { inicio: inicioMes, fim: fimMes, rotulo: "esse mês" };
  const listaRanking = (ranking: { nome: string; valor: number }[], n = 5) =>
    ranking
      .slice(0, n)
      .map((r, i) => `${i + 1}. ${r.nome}: ${formatarMoeda(r.valor)}`)
      .join("\n");

  if (/\bcategorias?\b/.test(texto) && /(quais|minhas|lista|mostra|tenho|todas)/.test(texto) && !/(mais|maior)/.test(texto)) {
    const despesas = (snapshot.financas.categorias as any[]).filter((c) => c.tipo === "despesa");
    const receitas = (snapshot.financas.categorias as any[]).filter((c) => c.tipo === "receita");
    const ranking = gastosPorCategoria(transacoes as any[], snapshot.financas.categorias as any[], inicioMes, fimMes, hoje);
    const gastoDe = (nome: string) => ranking.find((r) => semAcento(r.nome) === semAcento(nome))?.valor ?? 0;
    const unicos = (l: any[]) => [...new Map(l.map((c) => [semAcento(c.nome), c])).values()];
    const linhas = unicos(despesas).map((c) => {
      const meta = Number(c.meta_mensal) || 0;
      return `• ${c.nome}: ${formatarMoeda(gastoDe(c.nome))}${meta ? ` de ${formatarMoeda(meta)}` : ""}`;
    });
    return {
      tipo: "texto",
      texto: `Suas categorias de despesa (gasto esse mês):\n${linhas.join("\n") || "nenhuma ainda"}${
        receitas.length ? `\n\nDe receita: ${unicos(receitas).map((c) => c.nome).join(", ")}` : ""
      }`,
    };
  }

  if (/(onde|em que|com que|qual categoria|quais categorias|categoria que|mais gastei|maior gasto|maiores gastos|por categoria|ranking)/.test(texto) && /(gast|despes|categoria)/.test(texto)) {
    const ranking = gastosPorCategoria(transacoes as any[], snapshot.financas.categorias as any[], periodoPadrao.inicio, periodoPadrao.fim, hoje);
    if (!ranking.length) return { tipo: "texto", texto: `Não achei gastos ${periodoPadrao.rotulo}.` };
    const total = ranking.reduce((s, r) => s + r.valor, 0);
    const pct = Math.round((ranking[0].valor / total) * 100);
    return {
      tipo: "texto",
      texto: `Onde mais foi dinheiro ${periodoPadrao.rotulo} (total ${formatarMoeda(total)}):\n${listaRanking(ranking)}\n\n${ranking[0].nome} levou ${pct}% dos gastos.`,
    };
  }

  if (/(quanto (ainda )?(posso|da pra|consigo) gastar|quanto (me )?(falta|sobra|resta)|quanto tenho (pra|para) gastar)/.test(texto)) {
    const cat = acharCategoria(textoOriginal, snapshot.financas.categorias as any[], "despesa");
    if (cat) {
      if (!cat.meta) return { tipo: "texto", texto: `${cat.nome} não tem limite mensal. Dá pra definir em Finanças → Categorias.` };
      const gasto = (transacoes as any[])
        .filter((t) => t.tipo === "despesa" && cat.ids.includes(t.categoria_id) && t.data >= inicioMes && t.data <= fimMes && (t.data <= hoje || t.pago_em))
        .reduce((s, t) => s + Number(t.valor), 0);
      const resta = cat.meta - gasto;
      return {
        tipo: "texto",
        texto:
          resta >= 0
            ? `Em ${cat.nome} ainda dá pra gastar ${formatarMoeda(resta)} esse mês (já foi ${formatarMoeda(gasto)} de ${formatarMoeda(cat.meta)}).`
            : `${cat.nome} já passou ${formatarMoeda(-resta)} do limite (${formatarMoeda(gasto)} de ${formatarMoeda(cat.meta)}).`,
      };
    }
  }

  // --- 1c) Etapa 220/228: "quanto gastei com uber em setembro?", "quanto gastei de moradia?" ---
  if (/\bquanto\b/.test(texto) && /(gast|pagu|receb|ganh|entrou|entrada|saiu)/.test(texto)) {
    const ehReceita = /(receb|ganh|entrou|entrada)/.test(texto);
    const tipoAlvo = ehReceita ? "receita" : "despesa";
    const periodo = periodoPadrao;
    const contas = snapshot.financas.contas as any[];
    const conta = contaDaFrase(textoOriginal, contas);
    const categoria = acharCategoria(textoOriginal, snapshot.financas.categorias as any[], tipoAlvo);
    let assunto = categoria ? null : assuntoDaFrase(textoOriginal);
    if (assunto && conta && semAcento(conta.nome).includes(assunto)) assunto = null;
    const noPeriodo = (transacoes as any[]).filter((t) => {
      if (t.tipo !== tipoAlvo || t.transferencia_grupo) return false;
      if (t.data < periodo.inicio || t.data > periodo.fim) return false;
      if (conta && t.conta_id !== conta.id) return false;
      if (categoria && !categoria.ids.includes(t.categoria_id)) return false;
      if (assunto) {
        const alvo = `${t.descricao ?? ""} ${mapaCategorias.get(t.categoria_id) ?? ""} ${(t.etiquetas ?? []).join(" ")}`;
        if (!contemParecido(alvo, assunto)) return false;
      }
      return true;
    });
    const lista = noPeriodo.filter((t) => t.data <= hoje || t.pago_em);
    const agendados = noPeriodo.filter((t) => t.data > hoje && !t.pago_em);
    const total = lista.reduce((s, t) => s + Number(t.valor), 0);
    const totalAgendado = agendados.reduce((s, t) => s + Number(t.valor), 0);
    const sobre = categoria ? ` com ${categoria.nome}` : assunto ? ` com "${assunto}"` : "";
    const naConta = conta ? ` no ${conta.nome}` : "";
    const textoAgendado = agendados.length
      ? `\nAinda tem ${formatarMoeda(totalAgendado)} agendado${agendados.length > 1 ? "s" : ""} pra cair${sobre}${naConta} ${periodo.rotulo}.`
      : "";
    if (!lista.length) {
      // ajuda: mostra onde teve gasto nesse período
      const ranking = gastosPorCategoria(transacoes as any[], snapshot.financas.categorias as any[], periodo.inicio, periodo.fim, hoje, tipoAlvo);
      const dica = ranking.length
        ? `\n\n${ehReceita ? "Receitas" : "Gastos"} ${periodo.rotulo} por categoria:\n${listaRanking(ranking, 4)}`
        : "";
      return {
        tipo: "texto",
        texto: `Não achei ${ehReceita ? "receitas" : "gastos"} já lançados${sobre}${naConta} ${periodo.rotulo}.${textoAgendado}${dica}`,
      };
    }
    const maior = [...lista].sort((a, b) => Number(b.valor) - Number(a.valor))[0];
    // sem categoria nem assunto: mostra também as principais categorias
    const resumoCategorias =
      !categoria && !assunto
        ? (() => {
            const r = gastosPorCategoria(lista, snapshot.financas.categorias as any[], periodo.inicio, periodo.fim, hoje, tipoAlvo);
            return r.length > 1 ? `\n\nPor categoria:\n${listaRanking(r, 4)}` : "";
          })()
        : "";
    return {
      tipo: "texto",
      texto: `${ehReceita ? "Você recebeu" : "Você gastou"} ${formatarMoeda(total)}${sobre}${naConta} ${periodo.rotulo} (${lista.length} lançamento${
        lista.length > 1 ? "s" : ""
      }).${lista.length > 1 ? `\nO maior: ${formatarMoeda(Number(maior.valor))}${maior.descricao ? ` — ${maior.descricao}` : ""} em ${maior.data.split("-").reverse().slice(0, 2).join("/")}.` : ""}${textoAgendado}${resumoCategorias}`,
    };
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
  if (contemAlguma(texto, ["habito", "tarefa", "pendente", "hoje"]) && !contemAlguma(texto, ["gastei", "reais", "sequencia", "streak"])) {
    const { tarefasVencidas, lembretesPassados } = calcularPendencias(snapshot);
    const checkinsHoje = new Set(
      snapshot.habitoCheckins.filter((c) => c.data === hoje && c.quantidade > 0).map((c) => c.habito_id)
    );
    const habitosPendentesHoje = snapshot.habitos.filter(
      (h: any) => habitoDevidoNoDia(h, hoje) && !checkinsHoje.has(h.id)
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
  if (contemAlguma(texto, ["resumo da semana", "resumo semanal", "essa semana"]) && !contemAlguma(texto, ["habito", "sequencia"])) {
    const { gastoSemanaAtual, gastoSemanaAnterior } = calcularComparacaoSemanal(
      transacoes.filter((t: any) => t.tipo === "despesa"),
      hoje
    );
    const receitas7dias = (() => {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const inicioSemana = seteDiasAtras.toLocaleDateString("sv-SE");
      return transacoes
        .filter((t: any) => t.tipo === "receita" && t.data >= inicioSemana)
        .reduce((s: number, t: any) => s + Number(t.valor), 0);
    })();
    let comparativo = "";
    if (gastoSemanaAnterior > 0) {
      const variacao = ((gastoSemanaAtual - gastoSemanaAnterior) / gastoSemanaAnterior) * 100;
      comparativo = ` Isso é ${Math.abs(variacao).toFixed(0)}% ${variacao > 0 ? "mais" : "menos"} que os 7 dias anteriores (${formatarMoeda(gastoSemanaAnterior)}).`;
    }
    return {
      tipo: "texto",
      texto: `Nos últimos 7 dias: recebeu ${formatarMoeda(receitas7dias)} e gastou ${formatarMoeda(gastoSemanaAtual)}.${comparativo}`,
    };
  }

  // --- 7b) Previsão de gasto do mês ---
  if (contemAlguma(texto, ["previsao", "vou gastar", "vou fechar o mes", "projecao"])) {
    const diaHoje = Number(hoje.slice(8, 10));
    const diasNoMes = new Date(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)), 0).getDate();
    const totalMes = transacoesDoMes
      .filter((t: any) => t.tipo === "despesa")
      .reduce((s: number, t: any) => s + Number(t.valor), 0);
    if (totalMes === 0) return { tipo: "texto", texto: "Ainda não tem despesa lançada esse mês pra eu calcular uma previsão." };
    const projecao = (totalMes / diaHoje) * diasNoMes;
    return {
      tipo: "texto",
      texto: `No ritmo de hoje, você deve fechar o mês em ${formatarMoeda(projecao)} (já gastou ${formatarMoeda(totalMes)} até o dia ${diaHoje}).`,
    };
  }

  // --- 7c) Categoria que subiu muito ---
  if (contemAlguma(texto, ["subiu", "aumentou", "disparou", "alerta"]) && !contemAlguma(texto, ["habito", "sequencia"])) {
    const { alertasCategoria } = calcularPendencias(snapshot);
    if (alertasCategoria.length === 0) {
      return { tipo: "texto", texto: "Nenhuma categoria subiu de forma preocupante comparado ao mês passado." };
    }
    const linhas = alertasCategoria.map(
      (a) => `${a.nome}: ${formatarMoeda(a.valorAtual)} (↑ ${a.percentual.toFixed(0)}%)`
    );
    return { tipo: "texto", texto: `Subiram bastante comparado ao mês passado:\n${linhas.join("\n")}` };
  }

  // --- 7d) Melhor sequência de hábito ---
  if (contemAlguma(texto, ["melhor sequencia", "streak", "sequencia de dias", "quantos dias seguidos"])) {
    let melhor = { nome: "", dias: 0 };
    const checkinsPorHabito = new Map<string, Map<string, number>>();
    for (const c of snapshot.habitoCheckins) {
      if (!checkinsPorHabito.has(c.habito_id)) checkinsPorHabito.set(c.habito_id, new Map());
      checkinsPorHabito.get(c.habito_id)!.set(c.data, c.quantidade);
    }
    for (const h of snapshot.habitos as any[]) {
      const mapaDatas = checkinsPorHabito.get(h.id) ?? new Map();
      const meta = h.meta_diaria ?? 1;
      const datasFeitas = Array.from(mapaDatas.entries())
        .filter(([, qtd]) => (qtd as number) >= meta)
        .map(([data]) => data as string);
      const streak = calcularStreak(datasFeitas);
      if (streak > melhor.dias) melhor = { nome: h.nome, dias: streak };
    }
    if (melhor.dias === 0) return { tipo: "texto", texto: "Nenhum hábito com sequência ativa agora — comece hoje!" };
    return { tipo: "texto", texto: `Sua melhor sequência agora é "${melhor.nome}", há ${melhor.dias} ${melhor.dias === 1 ? "dia" : "dias"} seguidos. 🔥` };
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
      "Não entendi essa pergunta ainda. Exemplos do que eu entendo:\n• \"quanto gastei com mercado mês passado?\"\n• \"onde mais gastei esse mês?\"\n• \"quais minhas categorias?\"\n• \"quanto ainda posso gastar com alimentação?\"\n• \"lança 50 de gasolina ontem no nubank\"\n• previsão do fim do mês, orçamento, contas a pagar, saldo, resumo da semana, hábitos de hoje, melhor sequência.",
  };
}
