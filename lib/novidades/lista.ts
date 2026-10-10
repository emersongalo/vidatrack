// Etapa 220 — "O que há de novo": o que mudou nas últimas versões,
// em linguagem simples. Pra anunciar uma novidade nova, acrescente um
// grupo no topo e troque VERSAO_NOVIDADES.
export const VERSAO_NOVIDADES = "280";
export const CHAVE_NOVIDADES = "vidatrack-novidades-vistas";

export type Novidade = { emoji: string; titulo: string; texto: string; href?: string };
export type GrupoNovidades = { versao: string; titulo: string; itens: Novidade[] };

export const NOVIDADES: GrupoNovidades[] = [
  {
    versao: "280",
    titulo: "Mais leve",
    itens: [
      { emoji: "⚡", titulo: "Extrato mais rápido", texto: "Listas grandes (como a busca em todos os meses) abrem na hora e vão carregando o resto conforme você rola." },
    ],
  },
  {
    versao: "279",
    titulo: "Busca nova e cara nova",
    itens: [
      { emoji: "🔎", titulo: "Busca turbinada", texto: "Resultados separados por Hábitos, Tarefas, Lançamentos e Finanças, com ícones, buscas recentes e atalhos. Digitou algo que não existe? Crie como tarefa na hora.", href: "/buscar" },
      { emoji: "🌈", titulo: "Cada área com sua cor", texto: "Hábitos, Tarefas e Finanças ganharam um brilho suave da própria cor no topo." },
      { emoji: "👋", titulo: "Boas-vindas em 3 telas", texto: "Quem está chegando agora vê um tour rápido antes de montar o app." },
    ],
  },
  {
    versao: "278",
    titulo: "Mais bonito e mais rápido de usar",
    itens: [
      { emoji: "☀️", titulo: "Tema claro caprichado", texto: "Verde, lilás e dourado num tom mais forte no tema claro — tudo fica mais legível. Os vermelhos também." },
      { emoji: "➡️", titulo: "Telas que deslizam", texto: "Abrir um item desliza da direita, voltar desliza da esquerda — igual app de celular." },
      { emoji: "👆", titulo: "Arrastar nas Tarefas", texto: "Arraste uma tarefa pra direita pra concluir, ou pra esquerda pra mandar pra amanhã (com Desfazer).", href: "/tarefas" },
      { emoji: "🎯", titulo: "Metas por semana e por dia", texto: "Cada meta mostra quanto guardar por semana e por dia. Sem prazo? Simule um valor semanal e veja quando chega.", href: "/financas/metas" },
    ],
  },
  {
    versao: "277",
    titulo: "Conta compartilhada avisa",
    itens: [
      { emoji: "🔔", titulo: "Avisos de movimentação", texto: "Compartilhou uma conta? Quem participa recebe um aviso a cada gasto, receita, \"Paguei\" ou \"Caiu\" lançado nela. Dá pra desligar em Notificações.", href: "/notificacoes" },
    ],
  },
  {
    versao: "276",
    titulo: "Mais leve e mais esperto",
    itens: [
      { emoji: "📈", titulo: "Saldo dia a dia até o fim do mês", texto: "Na previsão de Finanças, uma linha mostra como o saldo vai ficar em cada dia — toque pra ver o valor e o que entra/sai.", href: "/financas" },
      { emoji: "🏃", titulo: "Aviso de ritmo", texto: "Se no ritmo de agora uma categoria vai fechar o mês bem acima da sua média, você fica sabendo antes." },
      { emoji: "🔎", titulo: "Busca em todos os meses", texto: "No Extrato, busque por texto ou valor (ex: 62,90) e toque em \"Buscar em todos os meses\".", href: "/financas/extrato" },
      { emoji: "↩️", titulo: "Desfazer", texto: "Excluiu um lançamento ou arquivou um hábito/tarefa sem querer? Toque em Desfazer nos 5 segundos seguintes." },
      { emoji: "📦", titulo: "Offline mais claro", texto: "Sem internet, o aviso mostra quantas alterações estão guardadas esperando sincronizar." },
      { emoji: "🌙", titulo: "Resumo do dia", texto: "Às 21:30 chega o resumo do seu dia (hábitos, tarefas e gastos). Também fica no Início à noite.", href: "/resumo-dia" },
      { emoji: "🛡️", titulo: "Escudo da sequência", texto: "Esqueceu de marcar ontem? Uma vez por semana dá pra usar o escudo e não perder a sequência." },
      { emoji: "✨", titulo: "Seu mês em números", texto: "Nos primeiros dias do mês, uma retrospectiva do mês que passou, comparando com o anterior.", href: "/retrospectiva/mes" },
      { emoji: "🎨", titulo: "Cores novas de presente", texto: "Convide um amigo que use o app por uma semana e libere os temas Oceano, Floresta e Ameixa.", href: "/convidar" },
    ],
  },
  {
    versao: "275",
    titulo: "Foco, revisão e níveis",
    itens: [
      { emoji: "🎯", titulo: "Modo foco nas tarefas", texto: "Abra uma tarefa e toque em \"Focar nesta tarefa\": tela só com ela, timer de 15/25/45 min, checklist à mão e o \"Concluí!\" com confete no fim.", href: "/tarefas" },
      { emoji: "🧹", titulo: "Revisão da semana", texto: "Em Tarefas, passe uma por uma as atrasadas e sem data: já fiz, hoje, amanhã, próxima semana ou não vou fazer. No fim, veja seus próximos 7 dias.", href: "/tarefas/revisao" },
      { emoji: "🌱", titulo: "Níveis nos hábitos", texto: "Cada hábito cresce de Semente até Lenda 👑 conforme os dias feitos. Veja no detalhe do hábito — e subir de nível vira festa." },
      { emoji: "✨", titulo: "Toques mais suaves", texto: "Telas que não cortam mais no celular, toque mais rápido e melhor contraste no tema claro." },
    ],
  },
  {
    versao: "273",
    titulo: "Convites e mais festa",
    itens: [
      { emoji: "📩", titulo: "Compartilhar agora é convite", texto: "Quando alguém compartilha um hábito, tarefa ou conta com você, chega uma notificação e você escolhe: aceitar ou recusar. Nada aparece sem o seu sim.", href: "/convites" },
      { emoji: "🎉", titulo: "Hábitos e tarefas mais animados", texto: "Confete ao marcar, frases de incentivo, o ✓ se desenhando, risco animado nas tarefas e chuva de confete quando o dia (ou a lista de tarefas) fecha." },
      { emoji: "😀", titulo: "Emojis nas categorias e hábitos", texto: "Além dos ícones, agora dá pra escolher emojis coloridos — e são bem mais opções." },
    ],
  },
  {
    versao: "250",
    titulo: "Mais rápido no dia a dia",
    itens: [
      { emoji: "👛", titulo: "Quanto posso gastar hoje", texto: "Opcional: ligue em Finanças → Personalizar. Um número só que já desconta contas fixas, agendados e faturas até o fim do mês (e respeita seu teto).", href: "/financas" },
      { emoji: "⚡", titulo: "Lançar em 2 toques", texto: "Opcional: ligue em Finanças → Personalizar. Seus gastos mais repetidos (padaria, gasolina…) viram botões com categoria e conta prontas — é só digitar o valor.", href: "/financas" },
      { emoji: "🟠", titulo: "Aviso antes de estourar", texto: "Teto do mês e orçamento das categorias avisam aos 80%, ainda com tempo de segurar." },
      { emoji: "🛡️", titulo: "Hábito de parar", texto: "Dias limpos num contador grande, marcos (3 dias, 1 semana, 1 mês…) e quanto você já economizou. Informe o valor por dia ao editar o hábito." },
      { emoji: "🔗", titulo: "Hábitos encadeados", texto: "\"Depois do café → ler\": marque o primeiro e o próximo sobe pro topo com \"Agora!\". Escolha em Editar hábito." },
      { emoji: "🕐", titulo: "Seu melhor horário", texto: "Cada hábito mostra em que horário você mais faz — ótimo pra acertar o lembrete." },
      { emoji: "✨", titulo: "Carregamento e telas vazias novas", texto: "Nada de tela em branco enquanto carrega, e telas vazias com ilustração e um atalho do que fazer." },
    ],
  },
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
