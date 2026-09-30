// Etapa 220 — "O que há de novo": o que mudou nas últimas versões,
// em linguagem simples. Pra anunciar uma novidade nova, acrescente um
// grupo no topo e troque VERSAO_NOVIDADES.
export const VERSAO_NOVIDADES = "235";
export const CHAVE_NOVIDADES = "vidatrack-novidades-vistas";

export type Novidade = { emoji: string; titulo: string; texto: string; href?: string };
export type GrupoNovidades = { versao: string; titulo: string; itens: Novidade[] };

export const NOVIDADES: GrupoNovidades[] = [
  {
    versao: "235",
    titulo: "Monte o seu Início",
    itens: [
      { emoji: "🧩", titulo: "Início do seu jeito", texto: "Toque em \"Personalizar Início\" e escolha: só hábitos, só finanças ou os dois. Dá pra ligar, desligar e mudar a ordem de cada bloco — vale em todos os seus aparelhos.", href: "/dashboard" },
      { emoji: "📉", titulo: "Blocos novos", texto: "Gastos da semana, medidor do teto do mês, onde foi o dinheiro, cartões, sequências, semana dos hábitos e o humor do dia." },
      { emoji: "🤝", titulo: "Compartilhar sem digitar e-mail", texto: "Quem você já compartilhou aparece pra escolher com um toque." },
    ],
  },
  {
    versao: "233",
    titulo: "Hábitos em dupla ganharam vida",
    itens: [
      { emoji: "💚", titulo: "Aviso quando seu par faz", texto: "Compartilhou um hábito? Quando a outra pessoa fizer, chega um aviso — e, com o app aberto, aparece na hora.", href: "/habitos" },
      { emoji: "😄", titulo: "Carinha do dia", texto: "Cada hábito em dupla tem uma carinha que muda: festa quando os dois fazem, esperando, preocupada à noite e triste se a sequência quebrar." },
      { emoji: "👉", titulo: "Cutucar e reagir", texto: "Cutuque quem ainda não fez (uma vez por dia) e reaja com ❤️🔥👏 quando fizer. A reação chega como uma chuva de emojis." },
      { emoji: "🙌", titulo: "Toque duplo", texto: "Quando os dois completam no mesmo dia, duas mãos batem na tela. E a sequência de vocês conta junto." },
      { emoji: "🌱", titulo: "Jardim da dupla", texto: "Uma plantinha por hábito que cresce com os dias que vocês fazem juntos — de semente até árvore. Se ninguém fizer, ela murcha um pouco.", href: "/habitos/juntos" },
    ],
  },
  {
    versao: "230",
    titulo: "Visual novo, mais rápido de usar",
    itens: [
      { emoji: "➕", titulo: "Um + pra tudo", texto: "A barra de baixo agora é uma só: Início, Hábitos, Finanças e Perfil. O + do meio lança gasto, receita, transferência, hábito ou tarefa de qualquer tela." },
      { emoji: "👉", titulo: "Arraste pra marcar", texto: "Na lista de hoje, arraste um hábito pra direita pra marcar (ou somar +1). Arraste uma tarefa pra esquerda pra passar pra amanhã.", href: "/habitos" },
      { emoji: "🟢", titulo: "Sua semana em bolinhas", texto: "Cada hábito mostra os últimos 7 dias, e as Estatísticas ganharam a semana de todos os hábitos juntos.", href: "/habitos/estatisticas" },
      { emoji: "🏆", titulo: "Dia completo!", texto: "Marcou tudo do dia? Tem comemoração." },
      { emoji: "💳", titulo: "Cartão com cara de cartão", texto: "Fatura, vencimento e quanto do limite você já usou. Informe o limite ao editar o cartão.", href: "/financas/contas" },
      { emoji: "🎯", titulo: "Metas com anel", texto: "Veja a % no anel, quanto falta e quanto guardar por mês pra chegar no prazo.", href: "/financas/metas" },
      { emoji: "🍩", titulo: "Gastos por categoria", texto: "Gráfico de rosca com o total no meio e cada categoria com sua fatia.", href: "/financas" },
      { emoji: "🔍", titulo: "Extrato mais limpo", texto: "Mês e filtros ficam presos no topo ao rolar; a busca fica na lupa.", href: "/financas/extrato" },
    ],
  },
  {
    versao: "221",
    titulo: "Envelopes, assinaturas e rotinas",
    itens: [
      { emoji: "✉️", titulo: "Envelopes", texto: "Cada categoria com limite vira um envelope. Ligue \"guardar a sobra\" e o que não gastar passa pro mês seguinte — ou mande pra uma meta.", href: "/financas/envelopes" },
      { emoji: "🔁", titulo: "Assinaturas", texto: "O app acha sozinho as cobranças que se repetem todo mês, mostra quanto somam no ano e avisa quando alguma fica mais cara.", href: "/financas/assinaturas" },
      { emoji: "🧮", titulo: "E se…?", texto: "Simule: cortando R$ 200 do delivery, em quanto tempo você bate a meta?", href: "/financas/simulador" },
      { emoji: "📥", titulo: "Importar extrato mais esperto", texto: "Já sugere a categoria de cada linha, limpa a descrição do banco e lê o CSV da fatura do Nubank.", href: "/financas/importar" },
      { emoji: "☀️", titulo: "Rotina da manhã e da noite", texto: "Junte hábitos numa rotina e faça um de cada vez, com um toque.", href: "/habitos/rotina" },
      { emoji: "📊", titulo: "Sua semana", texto: "Resumo dos últimos 7 dias pra compartilhar como imagem. O aviso de domingo abre direto nele.", href: "/habitos/semana" },
      { emoji: "🔔", titulo: "\"✓ Feito\" na notificação do navegador", texto: "Quem usa pelo navegador agora também marca o hábito direto no lembrete (no app Android isso já existia)." },
      { emoji: "🎙️", titulo: "Falar com o assistente", texto: "No navegador, toque no microfone e diga \"gastei 30 no mercado\". No app, use o microfone do teclado.", href: "/financas/assistente" },
      { emoji: "🏅", titulo: "Novas conquistas", texto: "Semana perfeita, dentro do teto, diário e mais — e um aviso no Painel quando você desbloqueia uma.", href: "/habitos/conquistas" },
      { emoji: "📱", titulo: "Dica: widget de hábitos", texto: "No Android, segure um espaço vazio da tela inicial → Widgets → VidaTrack e escolha o de hábitos. Dá pra marcar direto dele." },
    ],
  },
  {
    versao: "220",
    titulo: "Mais controle do dinheiro e um assistente mais esperto",
    itens: [
      { emoji: "💬", titulo: "Assistente entende mais", texto: "Pergunte \"quanto gastei com mercado mês passado?\" ou diga \"gastei 30 no Nubank ontem\" — ele pega a conta, a data e a categoria sozinho, e lembra a conversa.", href: "/financas/assistente" },
      { emoji: "📅", titulo: "Calendário financeiro", texto: "Veja dia a dia o que entra, o que sai e como fica o saldo, com contas fixas e faturas já previstas.", href: "/financas/calendario" },
      { emoji: "🎯", titulo: "Teto de gastos do mês", texto: "Diga quanto quer gastar no mês e acompanhe a barrinha. Avisamos aos 80% e se passar.", href: "/financas" },
      { emoji: "📊", titulo: "Seus últimos 12 meses", texto: "Um gráfico com receitas, despesas e quanto sobrou em cada mês.", href: "/financas/analise" },
      { emoji: "⏰", titulo: "Lembrete de lançar gastos", texto: "Se passar 2 dias sem lançar nada, lembramos às 21h. Dá pra desligar nos avisos.", href: "/notificacoes" },
      { emoji: "📆", titulo: "Seus padrões da semana", texto: "Descubra em que dia da semana cada hábito costuma falhar, com uma dica pra ajustar.", href: "/habitos/estatisticas" },
      { emoji: "⏭️", titulo: "Adiar tarefa num toque", texto: "Mande uma tarefa pra amanhã, sábado, segunda ou semana que vem direto da lista de hoje.", href: "/habitos" },
      { emoji: "🤝", titulo: "Desafio com amigo", texto: "Compartilhe um hábito e veja quem está com a maior sequência.", href: "/habitos/desafios" },
      { emoji: "🧩", titulo: "Painel do seu jeito", texto: "Escolha quais resumos aparecem no topo do Painel e em que ordem (botão ao lado dos cartões).", href: "/dashboard" },
    ],
  },
  {
    versao: "218",
    titulo: "Metas longas, pausas e relatório",
    itens: [
      { emoji: "🏁", titulo: "Metas de longo prazo", texto: "Ler 12 livros no ano, correr 500 km… acompanhe metas maiores ligadas aos hábitos.", href: "/habitos/metas" },
      { emoji: "🏖️", titulo: "Pausar um hábito", texto: "Vai viajar? Pause o hábito e a sequência não quebra." , href: "/habitos" },
      { emoji: "🏷️", titulo: "Etiquetas nos gastos", texto: "Marque gastos com etiquetas (#viagem, #casa) pra somar depois.", href: "/financas/etiquetas" },
      { emoji: "📄", titulo: "Relatório em PDF", texto: "Baixe um resumo do mês em PDF.", href: "/financas/relatorio" },
      { emoji: "🎁", titulo: "Convide amigos", texto: "Mande seu link de convite pra quem também quer se organizar.", href: "/convidar" },
    ],
  },
  {
    versao: "215",
    titulo: "Previsão e diário",
    itens: [
      { emoji: "📈", titulo: "Previsão do fim do mês", texto: "Quanto deve sobrar e quanto dá pra gastar por dia.", href: "/financas" },
      { emoji: "🔎", titulo: "Busca geral", texto: "Ache qualquer gasto, tarefa ou hábito pela lupa do Painel.", href: "/buscar" },
      { emoji: "🙂", titulo: "Diário do dia", texto: "Registre o humor e uma frase sobre o dia.", href: "/habitos/diario" },
    ],
  },
];

/** Mostra o aviso de novidades? Só pra quem já usa o app (tem hábito ou conta) e ainda não viu esta versão. */
export function deveMostrarNovidades(vista: string | null, jaUsa: boolean): boolean {
  if (!jaUsa) return false;
  return vista !== VERSAO_NOVIDADES;
}
