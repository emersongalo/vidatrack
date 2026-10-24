// Etapa 220 — "O que há de novo": o que mudou nas últimas versões,
// em linguagem simples. Pra anunciar uma novidade nova, acrescente um
// grupo no topo e troque VERSAO_NOVIDADES.
export const VERSAO_NOVIDADES = "357";
export const CHAVE_NOVIDADES = "vidatrack-novidades-vistas";

export type Novidade = { emoji: string; titulo: string; texto: string; href?: string };
export type GrupoNovidades = { versao: string; titulo: string; itens: Novidade[] };

export const NOVIDADES: GrupoNovidades[] = [
  {
    versao: "357",
    titulo: "Agenda de cara nova",
    itens: [
      { emoji: "🗺️", titulo: "Local no mapa", texto: "Coloque o endereço e veja o mapinha no compromisso, com botões de Rota, Google Maps e Waze.", href: "/tarefas/agenda" },
      { emoji: "👀", titulo: "Convidado vê tudo", texto: "Quem foi convidado abre o card completo — horário, local, anotações e quem vai — só não consegue editar.", href: "/tarefas/agenda" },
      { emoji: "🎨", titulo: "Cor de cada pessoa", texto: "Cada um tem sua cor na agenda; toque em \"Cor\" pra pintar os compromissos pela cor de quem criou.", href: "/tarefas/agenda" },
      { emoji: "😀", titulo: "Emojis e animações", texto: "Escolha um emoji pro compromisso (ou deixe o app sugerir: \"dentista\" vira 🦷). Tela mais enxuta e com animações.", href: "/tarefas/agenda" },
    ],
  },
  {
    versao: "355",
    titulo: "Sem internet, sem limite",
    itens: [
      { emoji: "📔", titulo: "Do dia a dia, tudo offline", texto: "Diário, \"Paguei\", confirmar receitas, adiar e revisar tarefas, pausar hábito, escudo, mascote, metas e rotina — salvam no celular e sobem sozinhos." },
      { emoji: "🗓️", titulo: "Planejador e divisões offline", texto: "Crie e mova blocos de tempo, marque divisões como pagas e guarde em investimento mesmo sem sinal." },
      { emoji: "🔁", titulo: "Contas fixas do mês", texto: "Sem internet, as contas fixas do mês já aparecem \"a pagar\" — sem duplicar quando a conexão volta.", href: "/financas" },
      { emoji: "📴", titulo: "Aviso claro", texto: "Telas que precisam mesmo de internet (assistente, importar, convites) avisam logo no topo." },
    ],
  },
  {
    versao: "352",
    titulo: "Agora quase tudo funciona sem internet",
    itens: [
      { emoji: "✏️", titulo: "Editar e arquivar sem sinal", texto: "Hábitos e tarefas: criar com todas as opções, editar, arquivar, checklist e notas — tudo no celular, sobe sozinho depois." },
      { emoji: "💳", titulo: "Parcelado, conta fixa e fatura offline", texto: "Compra parcelada, repetir todo mês, editar parcela, transferência e pagar fatura funcionam sem internet.", href: "/financas" },
      { emoji: "🏦", titulo: "Contas, categorias, metas e desafios", texto: "Criar e editar contas e cartões, categorias, metas, envelopes, desafios e contas fixas — também sem internet." },
    ],
  },
  {
    versao: "349",
    titulo: "Tudo salvo no celular primeiro",
    itens: [
      { emoji: "⚡", titulo: "Lançamentos instantâneos", texto: "Gastos e receitas aparecem na hora, com ou sem internet, e vão pro banco logo em seguida. Dá pra editar e apagar mesmo antes de sincronizar.", href: "/financas" },
      { emoji: "✅", titulo: "Tarefas e hábitos sem esperar", texto: "Criar tarefa, concluir e marcar hábito não travam mais se a rede oscilar — fica salvo no aparelho e sobe sozinho.", href: "/tarefas" },
      { emoji: "🗓️", titulo: "Agenda offline completa", texto: "Criar, editar e apagar compromissos funciona sem internet. O ⏳ mostra o que ainda vai sincronizar.", href: "/tarefas/agenda" },
      { emoji: "📴", titulo: "Abre tudo sem internet", texto: "Todas as telas ficam guardadas no celular — extrato, cartões, metas, estatísticas, detalhes de cada hábito, tarefa e lançamento. Sem sinal, o app abre e mostra tudo." },
      { emoji: "🔄", titulo: "Dados em dia sem abrir o app", texto: "O celular atualiza seus dados sozinho de tempos em tempos e a cada notificação. Ficou dias sem abrir e está sem internet? O app mostra os dados de poucas horas atrás." },
    ],
  },
  {
    versao: "342",
    titulo: "Funciona sem internet",
    itens: [
      { emoji: "📴", titulo: "VidaTrack offline", texto: "Sem sinal ou com o servidor fora do ar, o app abre a tela offline: marque hábitos, conclua tarefas, veja a agenda de hoje e amanhã e lance gastos. Tudo vai pro app sozinho quando a internet voltar." },
      { emoji: "⚡", titulo: "Telas guardadas no aparelho", texto: "Início, Hábitos, Tarefas, Finanças e Agenda ficam salvas no celular pra abrir mesmo sem conexão." },
      { emoji: "📝", titulo: "Criar sem internet", texto: "Tarefas novas, compromissos da Agenda e lançamentos podem ser criados offline — aparecem na hora com ⏳ e sobem sozinhos quando a conexão volta." },
    ],
  },
  {
    versao: "341",
    titulo: "Agenda chegou!",
    itens: [
      { emoji: "🗓️", titulo: "Agenda dentro de Tarefas", texto: "Compromissos com hora ou dia todo, local, cor e visão de dia (linha do tempo), semana e mês.", href: "/tarefas/agenda" },
      { emoji: "✨", titulo: "Criar falando do seu jeito", texto: "Escreva \"jantar sexta 20h\", \"dentista amanhã 14:30\" ou \"aniversário da Su 12/03\" e a agenda entende sozinha.", href: "/tarefas/agenda" },
      { emoji: "👫", titulo: "Agenda a dois", texto: "Chame quem você já divide algo no app: a pessoa recebe o convite e responde Vou, Talvez ou Não vou — e você fica sabendo.", href: "/tarefas/agenda" },
      { emoji: "🔔", titulo: "Lembretes e repetição", texto: "Até 3 avisos por compromisso (na hora, 30 min, 1 dia antes...), repetir toda semana, mês ou ano, e contagem regressiva de aniversários.", href: "/tarefas/agenda" },
    ],
  },
  {
    versao: "334",
    titulo: "App mais suave",
    itens: [
      { emoji: "🫧", titulo: "Transições macias", texto: "As telas entram com um leve desfoque e os blocos aparecem em cascata. As abas deslizam até onde você tocou e os botões dão uma afundadinha no toque." },
    ],
  },
  {
    versao: "331",
    titulo: "Mundo mais cheio e mascote com trejeitos",
    itens: [
      { emoji: "🏦", titulo: "Aba Cartões e saldo por conta", texto: "Quem tem cartão ganha a aba Cartões (fatura, limite, parcelamentos). Com 2 ou mais contas, o saldo de cada uma aparece separado. E o número de parcelas agora dá pra digitar livre (ex: 18x).", href: "/financas/cartoes" },
      { emoji: "🗼", titulo: "Mais coisas no Mundo", texto: "Farol com luz girando de noite, balão no céu, patinhos nadando, uma baleia soltando água, varal, poço, piquenique, banquinho e caixa de correio.", href: "/habitos/mundo" },
      { emoji: "👋", titulo: "Mascote com trejeitos", texto: "De vez em quando ele acena, dá pulinhos, olha pros lados e solta coraçõezinhos ou notinhas — e reage quando você toca nele. Na lojinha: chapéu de cowboy, tiara, orelhas de coelho, crachá, câmera, pincel, cofrinho, gatinho e coelhinho.", href: "/habitos/mascote" },
    ],
  },
  {
    versao: "329",
    titulo: "Mascote mais real e mundo mais vivo",
    itens: [
      { emoji: "😺", titulo: "Seu mascote ganhou detalhes", texto: "Olhos com íris e brilho, narizinho, bigodinhos, pelinho, topetinho, dedinhos e um rabinho que balança.", href: "/habitos/mascote" },
      { emoji: "⛵", titulo: "O Mundo está vivo", texto: "Barquinho navegando, peixe pulando, passarinhos, moinho girando, fumaça na chaminé, árvores, flores, cogumelos e lampiões que acendem de noite (com vaga-lumes!).", href: "/habitos/mundo" },
    ],
  },
  {
    versao: "326",
    titulo: "Mascote mais bonito",
    itens: [
      { emoji: "✨", titulo: "Mascote caprichado", texto: "Olhões brilhantes, sorriso com linguinha, cores mais vivas e contorno — ele aparece melhor em qualquer fundo.", href: "/habitos/mascote" },
    ],
  },
  {
    versao: "317",
    titulo: "Início do seu jeito",
    itens: [
      { emoji: "💸", titulo: "Entradas e saídas no Início", texto: "Tudo que vai entrar e sair de dinheiro (vencidos, agendados, contas fixas e faturas), quanto fica de saldo depois e os botões Paguei e Recebi ali mesmo. Ligue em Personalizar Início → Finanças." },
      { emoji: "📝", titulo: "Tarefas de hoje no Início", texto: "As de hoje e as atrasadas, com a bolinha pra concluir sem sair da tela." },
      { emoji: "🧩", titulo: "Personalizar separado por área", texto: "Hábitos, Tarefas, Finanças e Geral, cada bloco com sua chavinha liga/desliga, e a ordem numa lista à parte." },
      { emoji: "🗓️", titulo: "Próximos dias → calendário geral", texto: "O \"Calendário\" do card Próximos dias agora abre o calendário com hábitos, tarefas e dinheiro juntos." },
    ],
  },
  {
    versao: "316",
    titulo: "Pescaria e eventos na ilha",
    itens: [
      { emoji: "🎣", titulo: "Pescaria no píer", texto: "Cada hábito feito vale uma isca (até 5 por dia). Lance, espere o ❗ e puxe na hora certa! São 14 achados pra colecionar — de bota velha a peixe dourado — e os repetidos viram moedas.", href: "/habitos/mundo/pesca" },
      { emoji: "🎃", titulo: "Halloween na ilha (20/10 a 2/11)", texto: "Abóboras e morcegos na ilha, chapéu de bruxa, gravata de morcego e vassoura na lojinha. Faça 25 hábitos no evento e ganhe a Abóbora-lanterna, que só sai como prêmio.", href: "/habitos/mundo" },
      { emoji: "🎄", titulo: "E no fim do ano, Natal (10/12 a 6/1)", texto: "Pinheiros com luzinhas, neve, gorro de Natal e a Renazinha de prêmio." },
    ],
  },
  {
    versao: "315",
    titulo: "Mundo mais vivo e hora de dormir",
    itens: [
      { emoji: "😴", titulo: "De madrugada ele dorme em todo lugar", texto: "Das 23h às 6h o mascote dorme com touquinha: na casa ele deita na cama (se tiver uma no cômodo), no jardim e no Mundo para de passear." },
      { emoji: "🛒", titulo: "Feirinha do dia", texto: "Um vendedor aparece na ilha com 3 itens pro mascote com 30% de desconto. Dá pra provar antes de comprar, e amanhã ele traz outros.", href: "/habitos/mundo" },
      { emoji: "💞", titulo: "Visitas na ilha", texto: "Os mascotes de quem divide hábito com você passeiam pela sua ilha, com o nome em cima.", href: "/habitos/mundo" },
      { emoji: "🌧️", titulo: "O tempo da ilha segue o humor", texto: "Dia tristinho tem chuvinha e nuvens passando; dia bom fica limpo. Toque no mascote no Mundo e ele fala com você." },
    ],
  },
  {
    versao: "314",
    titulo: "Desafios no dia, relatório do mês e semana flexível",
    itens: [
      { emoji: "🥇", titulo: "Desafios na aba Hábitos", texto: "Os desafios de 7, 21 e 30 dias aparecem direto no dia (\"Ler: 5 de 7\") e a medalha sai dali mesmo. Dá pra mudar de lugar em ⚙️ Personalizar." },
      { emoji: "📅", titulo: "Relatório do mês", texto: "Quanto foi cumprido, dias perfeitos, melhor sequência, o dia da semana mais forte e o mais difícil, o hábito destaque, o que caiu e dicas de ajuste. No dia 1 chega um aviso com o resumo.", href: "/habitos/relatorio" },
      { emoji: "⏳", titulo: "Hábitos \"X vezes por semana\" mais espertos", texto: "Se a semana estiver acabando e a meta apertar, às 18h chega um aviso: \"faltam 2 de 3 e restam 2 dias\"." },
    ],
  },
  {
    versao: "313",
    titulo: "Bichinhos soltos e roupas novas",
    itens: [
      { emoji: "🐶", titulo: "Os bichinhos passeiam pela casa", texto: "Cachorro, gatinho e coelho agora saem andando pelos cômodos de dia (e voltam pra casinha à noite). Toque neles pra fazer carinho ❤️.", href: "/habitos/mascote/casa" },
      { emoji: "🧢", titulo: "17 itens novos pro mascote", texto: "Capacete viking, sombrero, orelhinhas de gato, óculos nerd, visor neon, gravata social, correntinha de ouro, pipoca, microfone, raquete… e amigos novos: joaninha, abelhinha, fantasminha e um dragãozinho.", href: "/habitos/mascote" },
    ],
  },
  {
    versao: "312",
    titulo: "Trilhas, desafios e mais pra comprar",
    itens: [
      { emoji: "🧭", titulo: "Trilhas de hábitos prontos", texto: "Corpo em dia, mente tranquila, aprender, casa organizada, dinheiro sob controle e largar um hábito: adicione com um toque.", href: "/habitos/trilhas" },
      { emoji: "🥇", titulo: "Desafios de 7, 21 e 30 dias", texto: "Desafie qualquer hábito (tem folga pra algum dia corrido). Cumpriu? Medalha de bronze, prata ou ouro e moedas.", href: "/habitos/trilhas" },
      { emoji: "🎨", titulo: "Temas da ilha", texto: "Outono com folhas caindo, inverno com neve, cerejeira com pétalas, deserto e até uma ilha vulcânica.", href: "/habitos/mundo" },
      { emoji: "🏖️", titulo: "Área de lazer na casa", texto: "Piscina grande, guarda-sol, espreguiçadeira, churrasqueira, escorregador, fogueira, deck e areia de praia.", href: "/habitos/mascote/casa" },
      { emoji: "🔔", titulo: "Avisos do jeito que você usa", texto: "Quem usa só Finanças recebe só avisos de Finanças (e o resumo abre direto lá). Quem não lança gastos não recebe o \"gastou algo hoje?\"." },
    ],
  },
  {
    versao: "311",
    titulo: "Ilha maior, zoom e família",
    itens: [
      { emoji: "🔍", titulo: "Zoom no Mundo", texto: "Pinça com dois dedos, toque duas vezes ou use os botões + e − pra chegar pertinho. Com zoom, é só arrastar pra passear pela ilha.", href: "/habitos/mundo" },
      { emoji: "🏝️", titulo: "Monumentos das conquistas", texto: "A ilha cresceu: cada conquista resgatada põe algo nela — fogueira, moinho, fonte, vulcão, estátua dourada, castelo e até um navio pirata.", href: "/habitos/mundo" },
      { emoji: "🐣", titulo: "Mascote mais limpo", texto: "O palco da aba Hábitos ficou mais enxuto: a comidinha abre no botão 🍎 Comer e as missões ficam recolhidas numa linha (toque pra abrir)." },
      { emoji: "👨‍👩‍👧", titulo: "Hábitos em família", texto: "Dá pra dividir um hábito com até 6 pessoas. Em grupo, a planta cresce quando metade ou mais faz no dia (em dupla continuam os dois)." },
    ],
  },
  {
    versao: "310",
    titulo: "Mundo e conquistas",
    itens: [
      { emoji: "🗺️", titulo: "O Mundo do seu mascote", texto: "Uma ilha que junta tudo: casa, garagem, jardim, lojinha, missões, conquistas e o jardim juntos. Toque num lugar pra ir até ele.", href: "/habitos/mundo" },
      { emoji: "🏆", titulo: "Conquistas", texto: "20 metas de longo prazo (100 dias de sequência, mascote lendário, primeiro carro, 50 missões…). Cada uma dá moedas de prêmio pra resgatar.", href: "/habitos/mascote/conquistas" },
    ],
  },
  {
    versao: "309",
    titulo: "Missões do dia e baú da semana",
    itens: [
      { emoji: "🎯", titulo: "3 missões por dia", texto: "Todo dia saem missões novas pensadas nos seus hábitos (fazer 3 hábitos, voltar a fazer um esquecido, não quebrar a sequência, fazer um em dupla…). Cumpriu, toque pra resgatar moedas extras." },
      { emoji: "🎁", titulo: "Baú da semana", texto: "Feche as 3 missões em 5 dias da semana e abra o baú: moedas, uma cesta de comidinhas ou um móvel surpresa pra casa." },
    ],
  },
  {
    versao: "308",
    titulo: "Garagem, carros e sonhos",
    itens: [
      { emoji: "🚗", titulo: "Garagem e veículos", texto: "Libere a garagem e junte moedas pra skate, bicicleta, moto, kart, carro, jipe, esportivo… e até um foguete 🚀.", href: "/habitos/mascote/casa" },
      { emoji: "⭐", titulo: "Seu sonho", texto: "Na loja da casa, toque em \"Quero esse\" e uma barrinha aparece no palco da aba Hábitos mostrando quantos hábitos faltam pra conquistar.", href: "/habitos/mascote/casa" },
      { emoji: "🐶", titulo: "Lazer e bichinhos", texto: "Piano, fliperama, sinuca, cama elástica, telescópio, estátua dourada, cachorro, gatinho, coelho e passarinho.", href: "/habitos/mascote/casa" },
      { emoji: "🌳", titulo: "Jardim na aba Hábitos", texto: "Marcou um hábito, a planta dele é regada na hora. Dá pra esconder ou mudar de lugar em ⚙️ Personalizar." },
    ],
  },
  {
    versao: "307",
    titulo: "Seu jardim em 3D",
    itens: [
      { emoji: "🌳", titulo: "Jardim pessoal isométrico", texto: "Em Hábitos → Jardim, cada hábito seu é um canteiro com plaquinha. A planta cresce com o nível (Semente → Lenda dourada), murcha se ficar dias sem regar e o seu mascote passeia por lá.", href: "/habitos/jardim" },
    ],
  },
  {
    versao: "306",
    titulo: "Jardim de vocês em 3D",
    itens: [
      { emoji: "🌳", titulo: "Jardim isométrico", texto: "O jardim dos hábitos em dupla ficou no mesmo estilo da casa: cada hábito é um canteiro com plaquinha, os mascotes de vocês passeiam entre as plantas e quem fez hoje aparece regando.", href: "/habitos/juntos" },
      { emoji: "🍓", titulo: "Frutos na planta", texto: "Os frutos maduros aparecem pendurados — toque na planta pra colher. À noite o jardim escurece e surgem vaga-lumes." },
    ],
  },
  {
    versao: "305",
    titulo: "A casa do mascote",
    itens: [
      { emoji: "🏠", titulo: "Monte a casa dele", texto: "Quarto, sala, cozinha e quintal em 3D (visão de cima, estilo joguinho). Libere cômodos e compre mais de 30 móveis com as moedas dos hábitos — coloque em qualquer quadradinho, gire e guarde.", href: "/habitos/mascote/casa" },
      { emoji: "🎨", titulo: "Piso e parede", texto: "Madeira, xadrez, azulejo, tijolinho, listrada… e à noite a casa escurece e as luminárias acendem.", href: "/habitos/mascote/casa" },
      { emoji: "👀", titulo: "Visite seu par", texto: "Em Juntos, toque em \"Visitar a casa\" pra ver como a pessoa decorou.", href: "/habitos/juntos" },
    ],
  },
  {
    versao: "304",
    titulo: "Mascote com cara de 3D",
    itens: [
      { emoji: "✨", titulo: "Volume e luz de verdade", texto: "Seu bichinho ganhou sombreado redondo, brilho, olhos com reflexo e luz que muda com a hora — dourada de manhã, alaranjada no pôr do sol e azulada à noite.", href: "/habitos/mascote" },
      { emoji: "🌄", titulo: "Lugares com profundidade", texto: "Neblina no horizonte, raios de sol, luz no chão onde ele pisa e o cenário acompanhando o giro." },
    ],
  },
  {
    versao: "303",
    titulo: "Mascote no Início e compartilhar mais fácil",
    itens: [
      { emoji: "🐣", titulo: "Mascote no Início", texto: "Dá pra colocar seu bichinho no Início: toque em Organizar e ligue \"Seu mascote\"." },
      { emoji: "🌱", titulo: "Juntos com os mascotes", texto: "O cartão Juntos do Início agora mostra o seu mascote e o do seu par cuidando das plantas — quem já fez aparece regando.", href: "/habitos/juntos" },
      { emoji: "🤝", titulo: "Compartilhar ao criar", texto: "Ao criar um hábito ou uma tarefa, escolha se quer compartilhar e com quem — é opcional. O convite sai junto." },
      { emoji: "💔", titulo: "Descompartilhar", texto: "Em Juntos dá pra descompartilhar um hábito (com confirmação). Cada um fica com o seu hábito e o próprio histórico, e o outro recebe um aviso.", href: "/habitos/juntos" },
    ],
  },
  {
    versao: "302",
    titulo: "Mascote de verdade e jardim da dupla",
    itens: [
      { emoji: "🍗", titulo: "Ele sente fome", texto: "Seu mascote agora tem barriga e saúde. Cada hábito feito alimenta; dias sem hábitos deixam ele com fome e, depois, dodói (ele nunca morre — melhora com hábitos e remédio).", href: "/habitos/mascote" },
      { emoji: "🍎", titulo: "Comidinhas e farmácia", texto: "Use as moedas pra comprar maçã, sanduíche, sopinha, bolo, vitamina e remédio. Dê direto no palco da aba Hábitos.", href: "/habitos/mascote?aba=comidas" },
      { emoji: "🌳", titulo: "Jardim da dupla com mascotes", texto: "Nos hábitos em dupla, os mascotes de vocês cuidam da planta: quem fez o hábito aparece regando. A partir da flor ela dá frutos — colha e alimente seu bichinho. Adubo faz crescer mais rápido.", href: "/habitos/juntos" },
      { emoji: "🌅", titulo: "Lugares vivos", texto: "O cenário virou a casa dele: muda com a hora (manhã, tarde, pôr do sol, noite) e o tempo segue o humor — sol, nuvens, chuva. Quem não comprou nenhum mora na casinha." },
    ],
  },
  {
    versao: "301",
    titulo: "Armário do mascote e itens novos",
    itens: [
      { emoji: "🎒", titulo: "Armário", texto: "Tudo que você compra fica guardado no Armário: veja o que está vestindo, tire tudo de uma vez e salve até 4 looks pra trocar com um toque.", href: "/habitos/mascote" },
      { emoji: "👀", titulo: "Prove antes de comprar", texto: "Toque num item da lojinha e ele aparece no seu bichinho. Gostou? Compra ali mesmo.", href: "/habitos/mascote" },
      { emoji: "🐾", titulo: "25 itens novos", texto: "Chapéu de mago, pirata, chef, fones, monóculo, máscara de mergulho, violão, varinha, sorvete, cenários de montanha, neve, cidade e arco-íris — e amiguinhos: passarinho, borboleta, patinho, caracol e estrelinha.", href: "/habitos/mascote" },
    ],
  },
  {
    versao: "300",
    titulo: "Mascote na aba Hábitos",
    itens: [
      { emoji: "🔄", titulo: "Gire seu bichinho", texto: "O mascote agora mora no topo da aba Hábitos: arraste pro lado pra girar e ver as costas, toque pra ele pular. Cada hábito marcado ele comemora e mostra +10 🪙." },
      { emoji: "🌦️", titulo: "O palco muda com seu dia", texto: "Dia completo tem sol, dia parado tem chuvinha e à noite ele dorme sob as estrelas. Dá pra mudar de lugar ou esconder em ⚙️ Personalizar." },
    ],
  },
  {
    versao: "298",
    titulo: "Seu mascote dos hábitos",
    itens: [
      { emoji: "🐣", titulo: "Um bichinho que cresce com você", texto: "Choque seu ovinho e dê um nome. A cada hábito feito ele evolui: Filhote, Pequeno, Crescido, Campeão e Lendário — e muda de humor conforme o seu dia.", href: "/habitos/mascote" },
      { emoji: "🪙", titulo: "Moedas e lojinha", texto: "Cada hábito feito vale 10 moedas. Troque por chapéus, óculos, roupinhas, cenários e cores novas.", href: "/habitos/mascote" },
    ],
  },
  {
    versao: "295",
    titulo: "Mais hábitos de tela",
    itens: [
      { emoji: "📵", titulo: "Vários hábitos de tela", texto: "Agora dá pra ter mais de um: por tipo (redes, vídeos, jogos), por apps que você escolhe (ex: Instagram até 30 min) ou o celular todo. Tem ideias prontas de um toque.", href: "/habitos/tela" },
      { emoji: "📲", titulo: "Aviso de app novo", texto: "Quando sair versão nova do app na Play Store, o VidaTrack avisa e leva direto pra atualizar." },
    ],
  },
  {
    versao: "292",
    titulo: "Tempo de tela (Android)",
    itens: [
      { emoji: "📱", titulo: "Pra onde vai seu tempo", texto: "No app Android: tempo por app e por tipo (redes, vídeo, jogos), comparação com ontem e com a semana. Os dados ficam só no celular.", href: "/habitos/tela" },
      { emoji: "📵", titulo: "Hábito que se marca sozinho", texto: "Opcional: crie \"Redes sociais até 1h\" e o app confere cada dia que termina e marca pra você quando ficou no limite.", href: "/habitos/tela" },
    ],
  },
  {
    versao: "289",
    titulo: "Extrato na ordem do banco",
    itens: [
      { emoji: "🏦", titulo: "Hoje sempre em cima", texto: "Extrato e lançamentos do mês agora seguem a ordem do app do banco: hoje, ontem e os dias anteriores. Os agendados ficam num grupo à parte, fechado.", href: "/financas/extrato" },
    ],
  },
  {
    versao: "288",
    titulo: "Você escolhe o topo",
    itens: [
      { emoji: "⚙️", titulo: "O que mostrar no Bom dia", texto: "No cartão do topo do Início, toque em \"O que mostrar aqui\" e escolha: Hábitos, Tarefas, Saiu hoje — os três, só um ou nenhum." },
    ],
  },
  {
    versao: "287",
    titulo: "Início de cara nova",
    itens: [
      { emoji: "🌅", titulo: "Bom dia de verdade", texto: "O topo do Início muda com a hora do dia e mostra uma frase sobre como vai seu dia." },
      { emoji: "🎯", titulo: "Hoje num olhar", texto: "Hábitos, tarefas e quanto saiu hoje em três quadrinhos — toque pra ir direto." },
      { emoji: "👉", titulo: "Destaques de deslizar", texto: "Mês em números, resumo do dia e retrospectiva agora ficam num carrossel." },
    ],
  },
  {
    versao: "286",
    titulo: "Mais vivo e mais bonito",
    itens: [
      { emoji: "💰", titulo: "Cartão do mês em Finanças", texto: "Saldo que conta até o valor, anel de quanto já saiu, Entrou/Saiu/Sobra e um brilho dourado. Trocar de mês desliza a tela.", href: "/financas" },
      { emoji: "🧾", titulo: "Carimbo de PAGO", texto: "Marcou que pagou? Aparece o carimbo. Lançamento novo entra no topo com um pulinho." },
      { emoji: "🫙", titulo: "Pote das metas", texto: "As metas viraram potes que enchem — e caem moedas quando você guarda.", href: "/financas/metas" },
      { emoji: "🌅", titulo: "Hábitos com o céu do dia", texto: "O topo muda de cor de manhã, à tarde e à noite. A chama cresce com a sequência e fica dourada com 30 dias." },
      { emoji: "🌱", titulo: "Plantinha em cada hábito", texto: "Cada hábito mostra a plantinha do nível dele — e ela brota quando sobe. Fechou o dia? Chovem folhinhas." },
    ],
  },
  {
    versao: "285",
    titulo: "Hábitos e Tarefas mais leves",
    itens: [
      { emoji: "🌱", titulo: "Aba Hábitos só com hábitos", texto: "Contas e tarefas saíram de lá — cada coisa na sua aba. O topo virou um cartão só, com anel, sequência e semana." },
      { emoji: "✨", titulo: "Lista que desliza", texto: "Marcou um hábito? Ele mostra o ✓ e desce suave pro grupo Feitos (dá pra recolher)." },
      { emoji: "📝", titulo: "Ler a nota e concluir", texto: "Tarefa com anotação ou subtarefas abre ali mesmo na lista: leia, marque as subtarefas e toque em Li e concluí.", href: "/tarefas" },
    ],
  },
  {
    versao: "281",
    titulo: "Cara nova e atalhos",
    itens: [
      { emoji: "➕", titulo: "Leque no +", texto: "O botão + abre bolhas: Gasto, Tarefa, Hábito e Mais — tudo a um toque." },
      { emoji: "🌓", titulo: "Tema automático e preto total", texto: "Siga o tema do celular, troque sozinho pelo horário (claro de dia, escuro à noite) ou use a paleta Preto, ótima pra telas OLED.", href: "/perfil" },
      { emoji: "📅", titulo: "Calendário único", texto: "Hábitos, tarefas e dinheiro no mesmo mês. Toque num dia e veja tudo dele.", href: "/calendario" },
      { emoji: "🌳", titulo: "Jardim dos hábitos", texto: "Cada hábito é uma planta que cresce com os dias feitos. Feito hoje = planta regada.", href: "/habitos/jardim" },
      { emoji: "⚡", titulo: "Modo rápido", texto: "Hábitos de hoje em quadrados grandes, tarefas com 1 toque e o gasto rápido — numa tela só.", href: "/rapido" },
      { emoji: "⏱️", titulo: "Timer no hábito", texto: "Hábito em minutos (ex: Ler 20 min) ganhou o ▶: cronometre e os minutos entram sozinhos." },
    ],
  },
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
