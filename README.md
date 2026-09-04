# VidaTrack — Etapa 52: Painel Principal Travado (sem rolagem)

App único de **hábitos**, **notas** e **finanças**, com telas próprias por
módulo e compartilhamento entre usuários. Stack: **Next.js** (Vercel),
**Supabase** (banco + autenticação) e **Cloudflare R2** (arquivos e fotos
das Notas).

## O que já está pronto

**Novo nesta etapa (52) — painel principal travado, sem rolar:**

O painel usava `min-h-screen` (altura MÍNIMA de uma tela) — se o
conteúdo passasse um pouco disso (ou o navegador do celular
recolhesse/expandisse a barra de endereço, mudando a altura visível
na hora), a página ficava rolável, permitindo aquele efeito de
"arrastar" que cortava o cabeçalho no seu print.

Troquei pra altura EXATA da tela (`h-[100dvh]`, que se adapta
corretamente à barra de endereço do celular, ao contrário do `vh`
comum) mais `overflow-hidden`, travando de vez a rolagem só nessa
tela específica.

**Importante: só mexi no painel principal.** Telas como Finanças,
que têm mais conteúdo do que cabe numa tela e precisam rolar de
verdade pra ver tudo, continuam rolando normalmente — isso não foi
tocado.

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (51) — bug de correção real achado ao investigar a lentidão:**

Enquanto investigava o "sinto ele meio lento", achei algo mais sério
que só devagar: as rotas de API (`/api/lembretes`, `/api/hoje`,
`/api/analytics`) passavam pela mesma regra de redirecionamento de
página do middleware. Isso é conceitualmente errado — uma API deve
responder com erro em JSON, nunca redirecionar pra uma tela HTML de
login — e o pior: **o agendador externo que dispara os lembretes
(`/api/lembretes`) não tem sessão nenhuma** (usa um segredo próprio),
então era exatamente o tipo de chamada que essa regra redirecionava
antes mesmo de chegar no código que checa o segredo. Corrigido: rotas
de API agora nunca são redirecionadas — cada uma continua responsável
por checar sua própria autorização (e já fazem isso corretamente).

**Sobre a lentidão nos cliques, de forma honesta:** o middleware
verifica sua sessão com o Supabase (uma ida-e-volta real de rede) a
cada navegação — isso é assim de propósito, é o jeito seguro
recomendado de confirmar que a sessão não expirou/foi revogada,
diferente de só ler um token guardado localmente sem confirmar com o
servidor. Não tem como zerar esse custo sem abrir mão dessa garantia
de segurança. A correção desta etapa remove pelo menos a verificação
duplicada nas chamadas de API, que ajuda uma parte real da
lentidão percebida (principalmente em telas que fazem várias chamadas
de API, como a sincronização offline).

**Testei os 7 cenários relevantes** (incluindo o do cron sem sessão)
antes de entregar — todos passaram.

**Novo nesta etapa (50) — a causa real, achada de verdade:**

Depois de descartar sobreposição visual, cache, Service Worker e
Analytics do Vercel (nenhum era a causa), a inspeção de elemento
mostrou o HTML **perfeito** — o que apontou pra outro lugar: o
`middleware.ts`.

**A causa real:** o middleware tem uma regra que redireciona quem
**já está logado** de volta pro painel, ao tentar acessar rotas como
"/login" ou "/cadastro" (faz sentido — não tem porquê ver a tela de
login de novo estando logado). O problema: na Etapa 48, quando
adicionei "/privacidade" e "/conta-excluida" na lista de "rotas
públicas" (pra reviewers do Google conseguirem ler sem estar
logados), **sem querer também apliquei essa mesma regra de
redirecionamento a elas**. Resultado: clicando em "Privacidade" já
logado, você era jogado de volta pro painel instantaneamente — rápido
demais pra notar, parecendo que "nada acontecia".

**A correção:** separei em duas listas agora — `ROTAS_PUBLICAS`
(quem pode ver sem estar logado) e `ROTAS_SO_PARA_DESLOGADO` (dessas,
quais NÃO fazem sentido pra quem já está logado). "/privacidade" e
"/conta-excluida" ficam só na primeira lista, não na segunda.

**Testei os 8 cenários que importam** antes de te entregar (logado x
deslogado, em cada rota relevante) — todos passaram, incluindo o
caso exato que estava quebrado.

**Para quem quiser aprender com esse caso:** a lição real aqui foi
process — fomos eliminando hipótese por hipótese com testes
concretos (não é ficar tentando "conserto genérico" às cegas), até
sobrar só uma explicação possível. Vale mais a pena esse caminho do
que eu ficar mandando "correções" chutadas uma atrás da outra.

**Novo nesta etapa (49) — "Privacidade" não respondia ao toque:**

Investiguei os componentes que ficam perto do rodapé do painel (banner
de instalar app, avisos de sincronização) e nenhum parecia estar
cobrindo aquele ponto no seu caso. A explicação mais provável: os
links "Apoiar o projeto" e "Privacidade" eram texto puro (`text-xs`,
12px) **sem nenhum espaçamento de toque ao redor** — num celular de
verdade, é fácil o dedo acertar 1-2mm ao lado do texto e não tocar em
nada, mesmo que pareça estar em cima olhando a tela (a orientação de
acessibilidade recomenda pelo menos ~44px de área clicável; texto puro
sem padding fica bem abaixo disso).

Aumentei a área de toque dos dois links com padding, sem mudar como
eles aparecem visualmente.

**Se mesmo assim continuar sem responder depois desse ajuste**, me
avisa — nesse caso o próximo passo seria inspecionar o HTML de
verdade no seu celular (via `chrome://inspect` conectando o celular
no computador por USB), pra ver exatamente o que está por cima
daquele ponto na tela.

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (48) — 2 exigências reais do Google Play que faltavam:**

- **Excluir conta permanentemente** (`/perfil/excluir-conta`) — o
  Google exige isso desde 2023 pra qualquer app que permite criar
  conta, sem exceção. Apaga tudo: hábitos, notas, finanças,
  compartilhamentos, foto de perfil, anexos no R2, vínculo do
  Telegram — de verdade, sem deixar lixo pra trás. Confirmação exige
  digitar "EXCLUIR" antes de habilitar o botão
- **A tabela já ajudava** — todo o banco já tinha `on delete cascade`
  em qualquer referência a `auth.users`, então apagar o usuário no
  Auth já limpa quase tudo sozinho. Só precisei limpar manualmente o
  que fica fora do banco (fotos e anexos no Cloudflare R2)
- **Bug real que achei no processo: a página `/privacidade` exigia
  login** — isso quebra o requisito do Play Store, porque os
  revisores do Google (e qualquer visitante) precisam conseguir ler
  sua política de privacidade sem estar logado. Corrigido — agora é
  pública, junto com a nova página `/conta-excluida`

**Novo nesta etapa (47) — bug corrigido:**

A seção de Hábitos tem um `layout.tsx` compartilhado (vale pra todas
as telas dali: Hoje, Lista, Planejador...) que já colocava um "←
Painel" no topo. A tela "Hoje" especificamente também tinha o próprio
botão de voltar — os dois juntos criavam a duplicação que você viu.

Corrigido: agora só existe **um** botão de voltar, no layout
compartilhado (então vale pra toda a seção de Hábitos, não só a tela
Hoje), e usando o componente `LinkVoltar` de verdade (ícone de seta +
texto, em formato de pílula) em vez do link de texto simples que
estava lá antes.

Não precisa rodar SQL — é ajuste de componente só.

**Novo nesta etapa (46) — offline sem precisar ter visitado a tela antes:**

Esse é o caminho realista que combinamos: em vez de reescrever as ~20
telas do app pra ler direto de um banco local (projeto de várias
semanas), baixamos **um retrato completo dos seus dados assim que
você entra no app**, e criamos uma tela offline esperta que usa esse
retrato — cobrindo o caso real de "abri o app sem sinal e queria ver
meus hábitos/notas/finanças", mesmo numa tela que eu nunca tinha
aberto antes.

- **`/api/offline/baixar-tudo`** — devolve hábitos, tarefas, notas,
  contas, categorias e os 200 lançamentos mais recentes, tudo numa
  chamada só
- **Baixa sozinho em segundo plano** — ao abrir o app (se fizer mais
  de 6h desde a última vez) e sempre que a conexão voltar, sem travar
  a tela nem pedir nada
- **A tela `/offline` (que já existia, mas era só uma mensagem
  genérica) agora é esperta** — mostra 3 abas com dados reais: Hoje
  (hábitos/tarefas, com check-in offline), Notas (lista + abrir e
  editar, mesmo uma nota nunca aberta antes nesse aparelho), Finanças
  (saldo calculado + últimos lançamentos + lançar novo)
- Tudo que você faz nessa tela usa a **mesma fila de sincronização da
  Etapa 44** — quando a internet volta, sincroniza sozinho

**Testei o cálculo do saldo com valores vindos como texto do banco**
(é assim que o Postgres às vezes devolve números) — confirma que
formata certo mesmo assim.

**Ainda não é 100% literal, por decisão consciente que já conversamos:**
- Notas: dá pra ler e editar; criar nota nova funciona; mas o
  retrato só é atualizado a cada 6h (ou quando a internet volta) — se
  você criar uma nota em outro aparelho, pode não aparecer aqui até o
  próximo download
- Finanças: os lançamentos mostrados são só os 200 mais recentes, não
  o histórico inteiro
- Isso ainda depende do app ter sido aberto pelo menos uma vez com
  internet, alguma vez — não funciona no primeiro uso absoluto, sem
  nunca ter tido conexão

**Novo nesta etapa (44) — criar e editar offline, de verdade:**

Isso é o projeto grande que combinamos planejar com calma. Construí em
camadas: primeiro a infraestrutura reutilizável, depois apliquei ela
nos 3 módulos de uma vez, com escopo consciente em cada um (as ações
mais comuns primeiro, não 100% de cada tela).

**Infraestrutura (reutilizável, module-agnostic):**
- **Fila offline generalizada** (`lib/offline/fila.ts`) — guarda no
  navegador qualquer ação pendente, com deduplicação por id (editar a
  mesma nota 5 vezes offline vira 1 ação na fila, não 5)
- **Processador de fila** (`lib/offline/processarFila.ts`) — quando a
  internet volta, executa cada ação pendente; se uma falhar de
  verdade, não trava as outras
- **Gerenciador global** (`GerenciadorSincronizacaoOffline`, no
  layout raiz) — único responsável por sincronizar, com um avisinho
  discreto embaixo da tela ("Sincronizando...", "Tudo sincronizado")

**Bug real que evitei antes de acontecer:** várias Server Actions que
já existiam (`criarNota`, `criarTransacao`...) terminam com
`redirect()`. Chamar elas direto durante uma sincronização automática
em segundo plano jogaria você de tela sem pedir, no meio de outra
coisa que estivesse fazendo. Criei versões "silenciosas" (sem
redirect) só pra esse uso — `criarNotaSilenciosa`,
`atualizarNotaSilenciosa`, `criarTransacaoSilenciosa`,
`criarHabitoSilencioso`.

**Nos 3 módulos:**
- **Finanças** — criar lançamento offline (o formulário existente já
  detecta a falta de conexão sozinho)
- **Notas** — editar uma nota já aberta offline (autosave guarda na
  fila em vez de tentar e falhar), e criar nota nova offline (modal
  rápido de título + conteúdo)
- **Hábitos** — criar hábito novo offline (modal rápido: nome + ícone
  + cor; frequência sempre diária nesse fluxo — ajustes mais
  específicos continuam exigindo estar online, editando depois)

**Testei a lógica antes de entregar:** simulei em Node a
deduplicação da fila (múltiplas edições da mesma nota) — só a versão
mais recente sobrevive, na ordem certa.

**Escopo consciente que ficou de fora, de propósito** (próximos
incrementos naturais, usando a MESMA infraestrutura que já existe
agora):
- Excluir nota/transação/hábito enquanto offline
- Editar hábito ou transação **já existente** offline (hoje só cria
  novo; editar existente ainda exige conexão)
- Criar hábito com frequência específica (dias da semana, meta
  numérica) offline — hoje é sempre diário simples
- Ver dados que você **nunca abriu antes** enquanto offline (hoje,
  ver dados offline depende do Service Worker já ter guardado aquela
  página numa visita anterior — não é uma cópia completa do banco no
  celular)

**Limite honesto sobre armazenamento:** a fila e o cache usam
`localStorage`, que tem um limite de alguns megabytes por site. Pra
uso pessoal normal (algumas ações pendentes por vez, não centenas)
isso nunca deve ser um problema — mas não é um banco de dados local
ilimitado.

**Novo nesta etapa (42) — notificação push nativa (FCM):**

Resolve de vez a pergunta "as notificações vão funcionar no app
publicado?" — a resposta agora é **sim**, com o canal certo pra isso.

- **Tabela `fcm_tokens`** — guarda o token de cada aparelho com o app
  instalado de verdade
- **`lib/fcm/servidor.ts`** — manda a notificação via Firebase Admin
  SDK, limpando sozinho token de app desinstalado
- **`RegistradorPushNativo`** — roda em todo lugar do app, mas só faz
  alguma coisa quando detecta que está dentro do Capacitor de verdade
  (no navegador comum, não faz nada — sem risco de quebrar nada lá)
- **Lembretes de hábito/tarefa/nota** agora mandam também pelo canal
  nativo, além do Web Push e Telegram que já existiam

**Importante:** isso precisa de configuração manual fora do código —
criar um projeto Firebase (gratuito), baixar 2 arquivos, e colar uma
variável de ambiente. Passo a passo completo mais abaixo, na seção
"Configurar notificação push nativa (FCM)".

**Combinado:** offline em todo o app (não só hábitos) fica pra uma
próxima etapa, planejada com calma à parte — é grande demais pra
resolver de passagem.

**Novo nesta etapa (41) — investigação de lentidão:**

Fui direto no código da tela de Finanças (a mais pesada do app) e
achei a causa real: ela fazia **mais de 10 buscas ao banco de dados,
uma esperando a outra terminar**, antes de conseguir mostrar qualquer
coisa na tela — inclusive repetindo a mesma busca de contas duas
vezes, e verificando o usuário logado duas vezes. Cada uma dessas
buscas tem um tempo de ida-e-volta até o Supabase; encadeadas uma
atrás da outra, isso soma bastante.

**O que mudou:**
- As buscas que não dependem umas das outras agora rodam **ao mesmo
  tempo**, em vez de em fila
- Removi 3 buscas que eram cópia de outra já feita (contas, categorias)
- O gerador de lançamentos recorrentes (que rodava sozinho, na frente
  de tudo, toda vez que a tela abria) agora roda **em paralelo** com
  o resto, em vez de bloquear a tela até terminar
- Esse mesmo gerador criava um lançamento por vez, um de cada vez —
  agora cria todos numa única operação
- As fotos de perfil (que às vezes precisam de um link assinado do
  R2) agora são resolvidas todas ao mesmo tempo, não uma atrás da
  outra
- Pequena otimização também na agenda "Hoje" de Hábitos

**Testei a lógica reorganizada antes de entregar** (simulei os dados
de conta compartilhada + lançamentos de duas pessoas, pra confirmar
que os nomes e fotos continuam batendo certinho depois da mudança).

**Sendo honesto sobre limites:** não tenho acesso ao seu app rodando
de verdade em produção, então não consigo medir o "antes e depois" em
milissegundos reais — só consigo garantir que o número de idas e
vindas ao banco caiu bastante nessa tela específica. Se depois de
testar ainda sentir lentidão, me avisa qual tela especificamente que
eu continuo essa mesma investigação nela.

**Novo nesta etapa (40):**

- **2 bugs corrigidos** do seu print: o olho de ocultar valores estava
  duplicado (sobrou um de uma etapa anterior); e o gráfico de pizza
  não escondia os valores — corrigido nos dois lugares (legenda e
  tooltip)
- **Lançar despesa por mensagem no Telegram** — manda algo tipo
  "Comprei pão por 15,00" ou "Recebi salário 3800,00" pro bot, e ele
  registra sozinho em Finanças, tentando reconhecer a categoria (por
  palavra-chave) e a conta/cartão mencionado. Confirma com uma
  mensagem mostrando o que foi registrado
- **Comando "Resumo"** — manda a palavra "Resumo" pro bot e ele te
  responde com ganhos, gastos e saldo do mês atual
- **Importante: sem IA, sem custo por mensagem** — é reconhecimento
  por palavras-chave e expressões regulares, não usa nenhuma API paga.
  Funciona bem com frases diretas ("Gastei 50 no mercado"), mas não é
  tão flexível quanto um assistente de IA de verdade — é a troca
  consciente entre "gratuito pra sempre" e "entende qualquer frase"

**Testei antes de entregar:** rodei 9 casos de teste isolados no
parser, incluindo "pegadinhas" de propósito (hora "14:30", data
"15/03", "3x" de parcela sozinho) pra confirmar que essas coisas NÃO
viram lançamento por engano — todos passaram.

**Novo nesta etapa (39):**

- **Editar conta** — antes só dava pra arquivar; agora tem "Editar" em
  cada conta, com um formulário de verdade
- **Mostra com quem a conta é compartilhada** — avatares (foto ou
  inicial) aparecem empilhados do lado do nome da conta, e também no
  topo da tela de Finanças, se alguma conta for compartilhada
- **Categoria rápida no lançamento** — botão "+ Nova categoria" dentro
  do próprio formulário de "Novo lançamento". Cria ali mesmo (nome +
  ícone), sem navegar pra outra tela e sem perder o que você já tinha
  preenchido (valor, conta, data...)
- **Botão voltar do Android** — no painel principal, apertar voltar
  uma vez mostra um aviso ("toque de novo pra sair"); só sai do app se
  apertar de novo em até ~2 segundos. Evita fechar o app sem querer
  com um toque acidental
- **Topo da tela de Finanças redesenhado**, inspirado no Mobills:
  saldo grande em destaque, Receitas e Despesas em círculos coloridos
  (verde/vermelho) lado a lado, olho de ocultar valores junto

**Sobre "layout exatamente idêntico" ao Mobills:** fiz uma aproximação
real e de propósito no topo da tela (que é a parte mais visível/hero),
usando a mesma composição (saldo grande, círculos de receita/despesa,
olho). Não copiei pixel a pixel o app de terceiros — mantive nossas
próprias cores e fontes, e não reproduzi a marca/logotipo deles. Se
quiser aprofundar em outras partes da tela também, me fala quais.

**Espaços (Pessoal/Empresa) — combinado que fica pra próxima etapa,
dedicada só a isso**, por ser uma mudança grande de arquitetura
(precisa mexer em quase toda tabela de Finanças).

## Rodar o schema desta etapa

Nenhum schema novo — tudo usa tabelas que já existiam.

**Novo nesta etapa (38) — botão de ocultar valores:**

- **Botão de olho** 👁️ no topo de Finanças e do Extrato — clica e todo
  valor em R$ na tela vira `R$ ••••••` na hora, sem recarregar a página
- Fica salvo no navegador (não precisa ficar clicando de novo toda
  vez que abrir o app) e sincroniza entre as telas — oculta numa
  tela, já abre oculto na outra
- **Cobertura:** saldo total, receitas/despesas do mês, orçamento por
  categoria, lista de lançamentos (principal e extrato), e saldo
  inicial de cada conta

**O que ainda não cobre, por enquanto:** a página de Análise (gráficos
avançados) e o gráfico de pizza da tela principal continuam mostrando
valor — são gráficos (SVG) mais trabalhosos de mascarar, e são telas
menos "de relance" que alguém veria passando do seu lado. Se isso for
importante pra você, me avisa que estendo.

Não precisa rodar SQL — é ajuste de componente só (a preferência fica
salva no navegador da pessoa, não no banco de dados).

**Novo nesta etapa (37) — bug corrigido:**

O "arrastar" pra reordenar os blocos de Finanças não funcionava no
celular — confirmado no seu teste. A causa: usava o recurso nativo de
**arrastar-e-soltar do navegador (drag-and-drop HTML5)**, que é uma
tecnologia pensada pra mouse e **não responde a gestos de toque** na
maioria dos navegadores de celular. Troquei por **botões de ↑ subir /
↓ descer** em cada bloco — funciona garantido em qualquer aparelho,
sem depender de gesto nenhum.

**Aviso importante que descobri no processo:** a reordenação de
**hábitos e tarefas** (que já existe desde etapas bem anteriores) usa
esse mesmo mecanismo de arrastar nativo — ou seja, é bem provável que
tenha o mesmo problema no celular. Não mexi nisso agora porque é uma
funcionalidade já existente e maior (não quis trocar sem confirmar
com você antes) — mas recomendo testar e, se confirmar o mesmo
problema, me avisa que aplico a mesma correção (botões ↑ ↓) lá
também.

Não precisa rodar SQL — é ajuste de componente só.

**Novo nesta etapa (36):**

- **Calendário de gastos mais claro** — antes era só um pontinho
  minúsculo embaixo do número do dia. Agora o **número do dia** em si
  fica com fundo vermelho suave (gasto), anel âmbar (conta a pagar),
  ou os dois combinados — muito mais fácil de bater o olho e entender
- **Ordem personalizável dos blocos** — em `/financas/personalizar`,
  dá pra arrastar e reorganizar como aparecem o Calendário, o Gráfico
  por categoria, os Links rápidos e os Últimos lançamentos (os blocos
  "a partir do calendário pra baixo", como você pediu — o saldo,
  resumo do mês e orçamento continuam fixos no topo, sempre visíveis
  primeiro). Salva sozinho a cada troca, sem precisar de botão "Salvar"
- Link "⠿ Personalizar ordem" aparece direto ao lado do título do
  calendário, fácil de achar

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o `supabase/schema_ordem_blocos.sql`
(depois de todos os schemas anteriores).

**Novo nesta etapa (35) — 3 correções do seu print:**

- **Nome cortado nos lançamentos, corrigido** — o selo de "quem
  lançou" competia por espaço horizontal com a descrição, cortando o
  nome (seu print mostrava "E..." em vez de "Emerson"). Movi o selo
  pra virar um probleminha no canto do ícone da categoria (como um
  "badge" de notificação), em vez de disputar espaço na linha —
  corrigido tanto na tela principal quanto no Extrato
- **Botão de voltar ficou de verdade um botão** — existia um
  componente `LinkVoltar` (ícone de seta + texto, em formato de
  pílula) já pronto no projeto, mas só estava sendo usado numa tela —
  agora está ligado nas 3 seções principais (Hábitos, Notas,
  Finanças), com visual consistente em vez de só uma seta solta
- **Cabeçalho da tela de Hábitos reorganizado** — o "← Painel"
  empilhado sozinho acima do título "Hoje" ficava com layout confuso;
  agora fica tudo numa linha só (voltar + blocos de tempo) com o
  título embaixo
- **Menu trilho** — a seta "→" que indicava "isso é clicável" só
  aparecia em hover, que **não existe em toque de celular**. Já estava
  corrigido pra aparecer sempre visível, com cards de fundo/borda em
  vez de texto solto, e resposta visual ao toque

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (34) — o painel principal virou o "trilho":**

- **Menu animado** — reaproveitei o visual do trilho que já existia na
  tela de login (linha colorida + 3 pontos) e transformei no menu
  principal de verdade. A linha "desenha" de cima pra baixo, e os 3
  módulos (Hábitos, Notas, Finanças) aparecem em sequência, um depois
  do outro. Clicando em qualquer um, entra na seção — e voltar pro
  painel faz a animação tocar de novo (é só o componente sendo
  montado de novo, nada de truque)
- **Clima e calendário genérico removidos** do painel — como
  combinado, "o tempo" não fazia falta ali
- **Resumos movidos pra dentro de cada seção**, em vez de ficarem
  no painel: o resumo de hábitos/tarefas de hoje já é a própria tela
  `/habitos` (que agora tem link "← Painel" também, único lugar que
  ainda não tinha)
- **Calendário de gastos** — novo, dentro de Finanças. Mostra um
  calendário do mês com um pontinho vermelho nos dias que teve gasto,
  e um pontinho âmbar nos dias que tem conta recorrente pra vencer.
  Navega entre meses pelas setinhas
- Respeita "menos animação" (`prefers-reduced-motion`) — quem tem essa
  preferência ativada no aparelho não vê a animação, só o menu já
  pronto

**O que ainda não entrou, de propósito — preciso de mais clareza sua:**
- **"Notas a vencer"** — hoje as Notas não têm nenhum campo de data de
  vencimento (só data de criação/edição). Pra isso aparecer num
  calendário, precisaria adicionar essa funcionalidade nova nas Notas
  primeiro. Não inventei isso sem confirmar com você
- **Um calendário único cruzando hábitos + finanças + notas** — o que
  construí é o calendário de gastos, dentro de Finanças. Se a ideia
  era um calendário central mostrando tudo junto (tipo um "hoje" só
  que em formato de mês, cruzando os 3 módulos), isso é outra etapa —
  me confirma se é isso que você quer antes de eu partir pra isso

**Novo nesta etapa (33) — bug visual corrigido:**

O gráfico de pizza "Despesas por categoria" (e mais 4 gráficos que usam
o mesmo padrão) tinha o tooltip configurado com fundo escuro mas
**sem cor de texto definida** — o Recharts caía num tom padrão que
ficava quase invisível em cima do fundo escuro do app, exatamente o
"tudo preto" que você viu no clique da pizza.

Corrigido nos 5 gráficos do app que usam tooltip:
`GraficoDespesasCategoria`, `GraficoConsistencia`, `RadarOrcamento`,
`TreemapGastos` e `GraficoAcumulado` — os 2 primeiros eram os únicos
que realmente tinham o bug (os outros 3 já tinham sido corrigidos
numa etapa anterior); apliquei a mesma correção reforçada nos 5 pra
garantir que nenhum volte a ter esse problema no futuro.

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (32):**

- **Badge de "quem lançou" corrigido** — virou um círculo pequeno com
  a inicial (com o nome completo aparecendo ao passar o mouse/segurar),
  em vez de quebrar linha embaixo do lançamento como no seu print.
  Corrigido tanto na tela principal de Finanças quanto no Extrato
- **Paleta de cores expandida** — de 4 pra 8 cores. Antes cada hábito
  só podia usar a cor "genérica" do módulo (sempre a mesma para
  todos); agora tem rosa, azul, roxo, verde, laranja e ciano também,
  então cada hábito pode ter sua própria identidade visual — é o que
  dá aquele efeito "vivo" do HabitNow, em vez de tudo com a cara igual
- **Mais ícones pra escolher** — de 16 pra 32 (incluindo ❤️ 🎓 🚴 📚
  entre outros, pra cobrir mais tipos de hábito)
- **Etiqueta "Hábito"/"Tarefa"** na agenda "Hoje" agora usa a cor
  própria de cada item, em vez de uma cor fixa igual pra todos
- Ícones maiores e mais arredondados na lista da agenda (mais parecido
  com o visual do HabitNow)

**Importante ser honesto sobre o escopo:** isso é um passo real na
direção do visual do HabitNow (cores individuais por hábito, ícones
maiores, etiquetas coloridas), mas não é uma cópia pixel a pixel — a
tira de dias e a estrutura geral da tela já eram parecidas antes desta
etapa. Se quiser ir mais fundo (o cabeçalho com busca/calendário, as
"listas" customizáveis tipo o HabitNow tem), me avisa que fazemos numa
próxima leva dedicada a isso.

**Não precisa rodar nenhum SQL nesta etapa** — as cores novas são só
código, os hábitos que você já tem continuam funcionando (as cores
antigas — sálvia/lavanda/âmbar — continuam existindo, só ganharam
companhia).

**Novo nesta etapa (31):**

- **Bug corrigido: nome sumia pra quem entrava com Google** — o
  gatilho que cria o perfil só lia o campo `'nome'` (só existe no
  cadastro por e-mail); Google manda `'full_name'`. Corrigido, **com
  correção retroativa** pra quem já tinha se cadastrado antes disso —
  não precisa recriar conta nem nada, o nome já aparece certo depois
  de rodar o SQL desta etapa
- **Tela `/perfil`** — editar nome e trocar foto (upload de verdade
  pro Cloudflare R2). A foto do Google também é aproveitada
  automaticamente no cadastro, sem precisar fazer nada
- **Ícones de banco** — Nubank, Inter, Itaú, Bradesco, Santander, C6,
  Caixa, Banco do Brasil, PicPay e Mercado Pago, cada um com a cor da
  marca (sem reproduzir nenhum logotipo — é só um círculo colorido com
  o ícone de banco). Escolhido num seletor ao criar a conta, não por
  adivinhação do nome digitado

**O que ainda falta (conversamos sobre isso separadamente):** o
redesenho visual do dashboard de Finanças estilo Mobills (card de
saldo, lista de lançamentos agrupada por data, etc.) — é grande o
bastante pra ser a próxima etapa dedicada.

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o `supabase/schema_perfil_google.sql`
(depois de todos os schemas anteriores) — ele inclui a correção
retroativa do nome/foto de quem já tinha conta, e a coluna de banco
nas contas financeiras.

**Novo nesta etapa (30) — tela de Extrato:**

- **Cards de Receitas/Despesas agora são clicáveis** na tela principal
  de Finanças — levam direto pro extrato já filtrado (receita ou
  despesa, mês atual)
- **Nova tela `/financas/extrato`** com filtros de verdade:
  - Tipo: Todos / Receitas / Despesas
  - Atalhos de período: Este mês, Mês passado, Últimos 30 dias, Este
    ano, Tudo
  - Período customizado (escolher data de início e fim manualmente)
  - Mostra o total de receitas e despesas do período filtrado, além
    da lista completa de lançamentos (a lista da tela principal
    sempre mostrou só os 10 últimos)
- Link "Extrato" adicionado nos atalhos rápidos da tela de Finanças

**Novo nesta etapa (29):**

- **Categorias padrão com ícone certo** — as 8 categorias que vêm
  prontas pra quem se cadastra (Salário, Alimentação, Moradia etc.)
  estavam nascendo todas com o mesmo ícone genérico 💰. Agora cada
  uma tem o ícone certo (🍔 Alimentação, 🏠 Moradia, 🚗 Transporte...).
  **E o mais importante: isso corrige retroativamente quem já tinha
  essas categorias criadas antes** — o SQL atualiza o ícone de quem
  ainda está com o valor genérico, sem mexer em nada que você já
  personalizou à mão
- **Recorrência "até uma data"** — igual a maioria dos apps de
  finanças (Mobills, Organizze etc.), agora dá pra escolher entre
  "Para sempre" ou "Até uma data" ao marcar "Repetir todo mês". Antes
  só existia "pra sempre", sem controle
- Mesmas melhorias aplicadas nos dois lugares: dentro do formulário de
  novo lançamento **e** na tela separada `/financas/recorrentes`

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o
`supabase/schema_categorias_padrao_v2.sql` (depois de todos os schemas
anteriores) — ele já inclui a correção retroativa dos ícones, não
precisa fazer nada manual.

**Novo nesta etapa (27):**

- **Popup de confirmação corrigido** — o "Tem certeza? Sim/Não" que
  aparecia sobrepondo outros textos (como no seu print) virou um popup
  de verdade, centralizado na tela. Isso corrige o bug em **todo o
  app de uma vez**, porque é um componente reutilizado em várias telas
  (hábitos, tarefas, notas, finanças, categorias)
- **Recorrência dentro do formulário de lançamento** — em vez de ser
  uma tela separada, agora tem um checkbox "🔁 Repetir todo mês"
  direto em "Novo lançamento". Marcando, já cria o lançamento de hoje
  e configura a recorrência pros próximos meses
- **Botão "+ Lançamento" mais evidente** — cor de destaque (âmbar,
  cor de Finanças no app), sombra e leve efeito ao passar o mouse
- ~~Assistente de IA nas Finanças~~ — removido na Etapa 28 (veja acima)

**Novo nesta etapa (28) — assistente de IA removido:**

Removido por decisão consciente: era o único recurso do app que teria
custo recorrente de verdade (créditos de API por pergunta), o que ia
contra o objetivo do VidaTrack de ser 100% gratuito. Removidos: a rota
`/api/assistente`, a página `/financas/assistente`, o componente de
chat, a função de montar contexto, o link na tela de Finanças, e a
variável `ANTHROPIC_API_KEY` (não precisa mais dela em lugar nenhum).

Tudo o mais desta etapa (popup de excluir corrigido, recorrência
dentro do formulário, botão de lançamento mais evidente) continua
valendo — só o assistente de IA saiu.

**Novo nesta etapa (26) — pensado pra casal/família:**

- **Hábitos em conjunto** — quando um hábito é compartilhado (ex: "ler
  a Bíblia juntos"), a agenda "Hoje" agora mostra o status de **cada
  pessoa** lado a lado (✓ Você · ○ Fulano), não só o seu. Cada um
  continua marcando seu próprio check-in — o streak de cada pessoa
  continua individual, só o *visual* virou conjunto, pra vocês se
  motivarem vendo o progresso um do outro. Hábitos particulares (sem
  ninguém convidado) continuam exatamente como sempre foram, sem esse
  visual extra
- **"Quem lançou" nas finanças** — quando uma conta é compartilhada,
  cada lançamento agora mostra uma etiqueta discreta com o nome de quem
  adicionou ("Você" ou o nome da outra pessoa)
- **Correção de RLS necessária pra isso funcionar de verdade:** a
  política de perfis só deixava cada um ver o próprio nome — sem
  ajustar isso, os dois recursos acima sempre mostrariam "Alguém" em
  vez do nome real. Adicionei uma política que permite ver o nome de
  quem compartilha algo com você (só isso, não expõe nome de gente
  aleatória)

**Nota sobre nomes com login Google:** se a pessoa entrou com Google
(em vez de e-mail/senha), o nome pode aparecer como "Alguém" em vez do
nome de verdade — isso acontece porque hoje só capturamos o campo
"nome" no cadastro por e-mail. Funciona (mostra o fallback), mas não é
o ideal; se isso incomodar, dá pra corrigir numa próxima etapa.

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o `supabase/schema_casal.sql`
(depois de todos os schemas anteriores).

**Novo nesta etapa (25) — localização simplificada:**

Tirei a opção de digitar o nome da cidade — agora é só um botão
"📍 Permitir localização" que usa o GPS/localização do navegador
direto. Mais simples, menos campo pra preencher, e ainda com um
detalhe de conveniência: se a pessoa já tinha aceitado a permissão
antes, o clima carrega sozinho na próxima vez, sem precisar clicar de
novo.

Removi também a função `buscarCidadesPorNome` do
`lib/clima/consulta.ts`, que não tinha mais nenhum lugar chamando ela
depois dessa simplificação — código morto igual ao caso do Firebase lá
na Etapa 19, agora prevenido de propósito.

**Novo nesta etapa (24) — a página parava de "dançar" pros lados:**

Isso não era o zoom (já corrigido na Etapa 23) — era um **vazamento de
largura de verdade**: a tira de dias do widget de clima tentava caber 7
dias numa faixa mais estreita que isso, e em telas pequenas empurrava a
página inteira pro lado em vez de só rolar por dentro dela mesma.
Reproduzi o bug de propósito numa página de teste isolada antes de
corrigir, pra confirmar a causa exata em vez de adivinhar.

Duas correções, uma em cima da outra:
1. **Causa raiz corrigida** no `WidgetClima` — a tira de dias agora
   respeita a largura do cartão e rola só por dentro dele
2. **Rede de segurança global** — adicionei uma regra no CSS que
   impede QUALQUER elemento, em qualquer tela do app, de fazer a
   página inteira ficar rolável pros lados. Mesmo que outro componente
   tenha o mesmo tipo de bug no futuro, a página em si nunca mais vai
   "dançar" — só aquele componente específico ficaria com comportamento
   errado, sem afetar o resto da tela.

**Novo nesta etapa (23):**

- **Zoom acidental travado** — o "pinça pra dar zoom" estava
  desalinhando o layout quando encostava sem querer na tela (era o que
  causava aquele efeito de conteúdo cortado/gigante no seu print). Uma
  configuração de `viewport` trava isso agora.

  **Nota de acessibilidade honesta:** travar o zoom é ótimo pra sensação
  de "app de verdade", mas tira a opção de quem precisa dar zoom por
  dificuldade de visão. Pra a maioria das pessoas não faz diferença —
  se algum dia isso incomodar algum usuário, dá pra reverter fácil (é
  só tirar `maximumScale` e `userScalable` do `app/layout.tsx`).

- **Ícone do "Sair" corrigido** — o símbolo `⏻` que usei não existe na
  fonte de emoji de vários Androids, aparecendo como aquele quadrado
  vazio ("tofu box"). Troquei por um SVG desenhado na hora, que
  funciona igual em qualquer aparelho, sem depender de fonte do
  sistema.

**Novo nesta etapa (22) — correção do painel principal no mobile:**

Dois problemas reais do print que você mandou:

- **Cabeçalho "vazando" pra fora da tela** — "Notificações" e "Sair"
  em texto não cabiam ao lado do nome no celular. Virou 3 botões
  redondos só de ícone (🔔 notificações, ☀︎/☾ tema, ⏻ sair) — cabe
  fácil em qualquer largura de tela
- **Cards com tamanhos brigando entre si** — "Hábitos" e "Finanças"
  apareciam duas vezes (como resumo com número grande, e de novo como
  card de módulo simples), com dois estilos visuais diferentes um do
  lado do outro. Removi a duplicação: agora só tem os 2 cards de
  resumo (Hoje + Finanças, com ícone e informação de verdade) e um
  "Acesso rápido" compacto embaixo com 3 blocos quadrados do mesmo
  tamanho, mesmo estilo

**Novo nesta etapa (21):**

- **Ícone/logo novo do VidaTrack** — um "V" em gradiente com as 3 cores
  da marca (sálvia → lavanda → âmbar), substituindo as bolinhas
  provisórias da Etapa 1.5. Gerado em todos os tamanhos necessários:
  ícone do PWA (192px, 512px), ícone "maskable" pro Android, ícone da
  Apple (180px) e favicon
- **"Instalar como app" sempre visível** — antes só aparecia como um
  banner condicional; agora tem um botão fixo na tela de login (mobile)
  que tenta o prompt nativo do navegador, e mostra o passo a passo
  manual se o navegador ainda não liberou o prompt automático
- **Layout mobile do login corrigido** — antes tinha bastante espaço
  vazio antes do conteúdo aparecer (o formulário ficava centralizado no
  meio da tela); agora o conteúdo começa mais perto do topo, com um
  cabeçalho compacto (ícone + nome) que só aparece no celular

**Sobre "instalar automaticamente ao abrir o link":** isso não é
tecnicamente possível — os navegadores bloqueiam de propósito qualquer
instalação sem uma ação explícita da pessoa, senão qualquer site
poderia instalar coisas no celular de alguém sem permissão. O que deu
pra fazer foi deixar o convite de instalar o mais visível e imediato
possível, em vez de escondido atrás de critérios do navegador.

**Novo nesta etapa (20) — Finanças mais visuais:**

- **Ícone e cor por categoria** — escolhe entre 12 ícones de despesa
  (🍔🏠🚗💊🎬📚📱🛍️✈️🐾🎁💡) ou 6 de receita (💼💰📈🏦🎯✨), mais uma
  das 4 cores do app
- **Editar e excluir categoria** — antes só dava pra criar. Excluir uma
  categoria não apaga os lançamentos que a usavam, eles só ficam "sem
  categoria" (já era assim desde a Etapa 4, agora só ficou acessível
  pela interface)
- **Ícones aparecem** na lista de lançamentos e no seletor de categoria
  do formulário de novo lançamento
- **Indicador de saldo animado** — em vez de só um número, agora tem
  um emoji que reage: 🎉 pulsando suave com partículas subindo quando
  positivo, 📉 "tremendo" discretamente quando negativo. Tudo em CSS
  puro (sem depender de GIF de terceiro — mais rápido de carregar,
  sem risco de direito autoral, e funciona igual em qualquer conexão)

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o
`supabase/schema_categorias_visuais.sql` (depois de todos os schemas
anteriores).

**Novo nesta etapa (19) — privacidade e auditoria:**

Resposta prática pra pergunta "os dados dos usuários estão seguros e
eu não vejo as finanças deles?":

- **RLS já garante isso entre usuários** (desde a Etapa 1, reforçado na
  auditoria da Etapa 11) — ninguém vê dados de outra conta pelo app
- **O que RLS não resolve:** quem administra o projeto Supabase tem
  acesso técnico ao banco por padrão — isso é assim em praticamente
  todo app (não é uma falha nossa). A solução pra isso é **política**,
  não só tecnologia
- **Nova página `/privacidade`** — explica isso de forma honesta, sem
  fingir uma garantia técnica que não existe, e documenta o compromisso
- **Log de auditoria** (`acessos_administrativos`) — toda vez que o
  código usa a chave que ignora RLS, fica registrado o motivo. Hoje só
  2 usos legítimos existem no código (cron de lembretes e busca de
  e-mail no convite), e agora os dois ficam rastreados
- O log **não guarda o e-mail buscado nem nenhum dado pessoal** — só o
  motivo genérico do acesso, pra não virar ele mesmo um problema de
  privacidade

**Isso não é criptografia de ponta a ponta** — se um dia você quiser
esse nível (nem o dono do banco consegue ler, tecnicamente impossível),
me avisa; é um projeto bem maior, que exigiria abrir mão de recursos
como os gráficos e lembretes automáticos calculados no servidor.

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o `supabase/schema_auditoria.sql`
(depois de todos os schemas anteriores).

**Da etapa 1:**
- Estrutura do projeto Next.js (App Router + TypeScript + Tailwind)
- Login e cadastro por e-mail/senha usando Supabase Auth
- Middleware que protege as rotas privadas
- Dashboard com os 3 módulos (Hábitos, Notas, Finanças) — telas placeholder
- Schema inicial do banco (perfis de usuário + tabela de compartilhamento)
- Identidade visual: cada módulo tem uma cor própria, unidas pelo "trilho"
  na tela de login

**Da etapa 6:**
- Módulo de Hábitos reformulado no estilo HabitNow, com 5 abas: Hoje
  (agenda do dia), Hábitos, Tarefas, Categorias e Timer

**Da etapa 7:**
- Hábitos com meta numérica, editar tarefa, busca/fixar notas, gráfico
  de despesas por categoria

**Da etapa 8:**
- Lançamentos recorrentes, exportar CSV, estatísticas de hábitos,
  arrastar para reordenar

**Da etapa 9:**
- Notificações push, testes automatizados, analytics anônimo,
  preparação Android, página de doação

**Da etapa 16:**
- Análise financeira avançada (treemap, radar, dicas automáticas)

**Novo nesta etapa (17):**

- **Validação séria com Zod** em todas as ações de Finanças (criar/editar
  conta, categoria, lançamento e recorrência) — valores negativos, datas
  malformadas, IDs inválidos e campos vazios são barrados com mensagem
  clara, em vez de passar batido ou gerar erro genérico do banco
- **Editar lançamento financeiro** — antes só dava pra criar ou excluir;
  agora tem um link "Editar" em cada lançamento na tela de Finanças
- **Correção de segurança:** a tabela de lançamentos nunca teve uma
  política de UPDATE no banco (a Etapa 11 já tinha identificado isso
  como pendência, documentado pra quando a edição fosse implementada).
  Agora tem, seguindo o mesmo padrão de segurança das outras tabelas
  (só dono ou convidado com permissão de edição, e o campo de dono
  travado contra troca)

**Documentação também atualizada:** a seção de Android (Capacitor) no
README e no `capacitor.config.ts` estava desatualizada — dizia
"notificações nativas" e "não funciona offline", o que não reflete
mais a realidade do projeto. Corrigido com uma explicação honesta:
notificação push dentro do APK não tem garantia de funcionar (o
Telegram continua sendo o canal mais confiável nesse caso), e o modo
offline deve funcionar mas ainda não foi testado dentro de um `.apk`
de verdade.

## Rodar o schema desta etapa

No SQL Editor do Supabase, rode também o
`supabase/schema_editar_transacao.sql` (depois de todos os schemas
anteriores) — sem isso, editar um lançamento vai parecer que funcionou
mas não vai salvar nada (a política de UPDATE é obrigatória).

## Rodar `npm install` de novo

Essa etapa adiciona o `zod` como dependência nova — rode `npm install`
antes de `npm run dev`.

## Configurar o Telegram (herdado da Etapa 13)

### 1. Criar o bot

1. Abra o Telegram e procure por **@BotFather** (o bot oficial de
   criação de bots)
2. Envie `/newbot` e siga as instruções (escolha um nome e um
   `username` terminado em `bot`, ex: `vidatrack_seunome_bot`)
3. O BotFather te devolve um **token** parecido com
   `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Configurar no app

Coloque esse token em `TELEGRAM_BOT_TOKEN` no `.env.local` (e depois
nas variáveis de ambiente do Vercel, quando publicar). Essa integração
usa o **mesmo agendador externo** que você já configurou na Etapa 9
pras notificações push — não precisa configurar nada novo de
infraestrutura.

### 3. Conectar sua conta

1. No app, vá em `/notificacoes` e clique em **"Conectar ao Telegram"**
2. Aparece um código de 6 caracteres
3. Abra o Telegram, procure pelo `username` do bot que você criou, e
   envie esse código como mensagem
4. Em até alguns minutos, o bot confirma e a tela do app mostra
   "Conectado" (recarregue a página)

## Configurar notificações push (herdado da Etapa 9)

### 1. Gerar as chaves VAPID

```bash
npm run gerar-chaves-vapid
```

Isso imprime uma chave pública e uma privada. Coloque no `.env.local`:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → a pública
- `VAPID_PRIVATE_KEY` → a privada (nunca exponha essa)

### 2. Pegar a chave de serviço do Supabase

Em **Project Settings > API > service_role**, clique em "Reveal" e copie
para `SUPABASE_SERVICE_ROLE_KEY`. **Essa chave ignora todas as regras de
segurança do banco — nunca a exponha no navegador ou suba pro GitHub.**

### 3. Criar um segredo pro cron

Invente uma string aleatória longa (ex: gere uma senha forte em
qualquer gerenciador de senhas) e coloque em `CRON_SECRET`, tanto no seu
`.env.local` quanto depois nas variáveis de ambiente do Vercel.

### 4. Configurar o agendador externo

**Por que um agendador externo?** O plano gratuito (Hobby) do Vercel só
permite cron job **1 vez por dia** — não dá pra checar lembretes a cada
5 minutos só com isso. O `vercel.json` já vem com um cron diário (meio-
dia UTC) como uma rede de segurança mínima, mas pra lembretes que batem
na hora certa, configure um dos dois abaixo (ambos gratuitos):

**Opção A — cron-job.org (mais simples):**
1. Crie uma conta gratuita em [cron-job.org](https://cron-job.org)
2. Crie um novo cronjob apontando para
   `https://SEU-PROJETO.vercel.app/api/lembretes`
3. Em "Advanced > Custom headers", adicione:
   `Authorization: Bearer SEU_CRON_SECRET`
4. Configure para rodar a cada 5 minutos

**Opção B — GitHub Actions (se seu código já está no GitHub):**
Crie `.github/workflows/lembretes.yml` no repositório:
```yaml
name: Lembretes
on:
  schedule:
    - cron: "*/5 * * * *"
jobs:
  chamar:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X GET https://SEU-PROJETO.vercel.app/api/lembretes \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```
E cadastre `CRON_SECRET` em Settings > Secrets do repositório.

### 5. Ativar no app

Acesse `/notificacoes` (logado) e clique em "Ativar notificações". O
navegador vai pedir permissão — aceite. Depois, defina um horário de
lembrete em qualquer hábito ou tarefa e aguarde o horário chegar.

## Rodar os testes

```bash
npm test
```

## Configurar notificação push nativa (FCM) — pro app publicado

Essa etapa resolve de vez a limitação documentada desde a Etapa 17:
Web Push sozinho não funciona com o app fechado dentro do WebView do
Capacitor. Agora tem também notificação nativa de verdade, via
Firebase Cloud Messaging — **gratuito, sem limite prático de uso**.

### 1. Criar o projeto no Firebase

1. Entra em [console.firebase.google.com](https://console.firebase.google.com)
   e clica em **Adicionar projeto**
2. Dá um nome (ex: "VidaTrack") e segue o assistente — pode desativar
   o Google Analytics, não precisa dele pra isso
3. Esse é um projeto **separado do Supabase** — só serve pra essa
   função de notificação

### 2. Adicionar o app Android ao projeto Firebase

1. Na página inicial do projeto, clica no ícone do Android
2. **Nome do pacote Android**: exatamente `com.vidatrack.app` (o
   mesmo `appId` que já está no `capacitor.config.ts`) — se não bater
   certinho, a notificação não chega
3. Baixa o arquivo `google-services.json` que ele oferece
4. Depois de rodar `npx cap add android` no seu projeto (veja a
   seção "Preparar para Android" abaixo), coloca esse arquivo dentro
   da pasta `android/app/` do projeto

### 3. Gerar a chave de conta de serviço (pro servidor mandar notificação)

1. No Firebase, vai em **Configurações do projeto** (ícone de
   engrenagem) **> Contas de serviço**
2. Clica em **Gerar nova chave privada** — baixa um arquivo `.json`
3. Esse arquivo é sensível (dá controle total do projeto Firebase) —
   nunca sobe pro Git nem compartilha ele

### 4. Configurar no VidaTrack

O arquivo baixado é um JSON — precisa converter pra uma linha só em
base64 antes de colar como variável de ambiente:

```bash
# No Mac/Linux:
base64 -i caminho/para/o-arquivo-baixado.json | tr -d '\n'

# No Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho\para\o-arquivo-baixado.json"))
```

Copia o resultado (uma linha longa de texto) e cola em
`FIREBASE_SERVICE_ACCOUNT_BASE64` no `.env.local` e nas variáveis de
ambiente do Vercel (tipo **Secret**, não Config).

### 5. Sincronizar o projeto Android

```bash
npm install
npx cap sync
```

Isso instala o `@capacitor/push-notifications` de verdade no projeto
Android e aplica a configuração do `capacitor.config.ts`.

### Como funciona na prática

- Quando alguém abre o app **instalado de verdade** (não pelo
  navegador), o VidaTrack pede permissão de notificação e guarda um
  "token" desse aparelho no banco
- Os lembretes de hábito/tarefa/nota (Etapa 9) agora mandam pra esse
  token também, além do Web Push e do Telegram — quem tiver os três
  configurados recebe pelos três (não tem problema, é redundância boa)
- Se o app for desinstalado, o token para de funcionar — o sistema
  detecta isso sozinho e limpa o token velho automaticamente, sem
  precisar de manutenção manual

**Escopo desta etapa:** o resumo diário (Telegram) continua só por
Telegram por enquanto — estender ele pra notificação nativa também é
uma extensão pequena, se fizer falta depois.

## Preparar para Android (Capacitor)

Como o VidaTrack usa Server Actions e renderização no servidor, **não
dá pra virar um app 100% estático** dentro do pacote Android. A
abordagem usada aqui é a mesma de muitos apps híbridos: o Capacitor cria
uma "casca" nativa (ícone, splash screen) que carrega o site já
publicado no Vercel dentro de uma **WebView do Android**.

### Notificações push no APK — leia antes de assumir que funciona

O sistema de notificação push que o app usa (Etapas 9/13) é a **Web
Push API do navegador**. Ela funciona muito bem no Chrome e quando o
app está instalado como PWA — mas dentro da WebView usada pelo
Capacitor, **não há garantia de que o app consiga receber push com o
app fechado**, porque isso depende de um serviço nativo do Android (o
Firebase Cloud Messaging) que a WebView sozinha não mantém ativo.

**Isso não foi implementado nem testado nesta etapa.** Se no futuro
quiser notificações push confiáveis dentro do APK de verdade, o
caminho é adicionar o plugin `@capacitor/push-notifications` +
Firebase Cloud Messaging (gratuito, sem cartão) — é um pedaço de
trabalho à parte, com mudanças no app e no servidor.

**Solução que já funciona sem nenhum trabalho extra: o Telegram.**
Como é outro aplicativo cuidando da notificação (não depende do
WebView do VidaTrack pra nada), os lembretes e o resumo diário por
Telegram chegam normalmente, seja no navegador, no PWA ou dentro do
APK. Se notificação é importante pra você, recomendo divulgar o
Telegram como o canal principal pros usuários do Android.

### Offline no APK

O modo offline básico (Etapa 10/11 — marcar hábito/tarefa sem
internet na agenda "Hoje") usa Service Worker, que a WebView moderna
do Android (a maioria dos aparelhos de 2021 em diante) sabe rodar.
Ele **deveria funcionar** dentro do APK do mesmo jeito que funciona no
Chrome do celular, mas isso ainda não foi testado de verdade dentro de
um `.apk` gerado — vale testar assim que tiver o primeiro build.

### Gerando o APK

Isso exige o Android Studio instalado na sua máquina (não dá pra gerar
o `.apk` sem ele), então os passos abaixo são pra rodar localmente,
fora deste ambiente:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init # se pedir, use os valores já preenchidos em capacitor.config.ts
npx cap add android
```

Antes de rodar, edite `capacitor.config.ts` e troque a URL de exemplo
pela URL real do seu projeto publicado no Vercel. Depois:

```bash
npx cap sync
npx cap open android
```

Isso abre o projeto no Android Studio, de onde dá pra rodar num
emulador/celular ou gerar o `.apk`/`.aab` pra publicar na Play Store.

## Configurar a doação

Abra `app/doacao/page.tsx` e troque `CHAVE_PIX` pela sua chave real
antes de publicar.

## Sobre o analytics

Os eventos ficam na tabela `analytics_eventos` do Supabase. Não existe
uma tela de gráficos dentro do app (ficaria complexo garantir que só
você veja isso com segurança) — pra consultar, use o **Table Editor**
do Supabase ou rode algo como:

```sql
select pagina, count(*) from analytics_eventos
where criado_em > now() - interval '7 days'
group by pagina order by count(*) desc;
```

## Como funciona na prática

- **Hábitos:** cada hábito na lista tem um link "Compartilhar" que leva
  a uma tela de convite. A pessoa convidada marca seu próprio check-in
  (streaks continuam individuais).
- **Notas:** o painel de compartilhamento já aparece dentro da própria
  nota, embaixo dos anexos.
- **Finanças:** o compartilhamento é por **conta** (ex: "Nubank
  conjunto"), não por lançamento — quem tem acesso enxerga e lança
  transações naquela conta; categorias continuam pessoais de cada um.

Em todos os casos, só o **dono** do item pode convidar ou remover
acesso — quem tem permissão de "editar" não pode compartilhar com mais
gente.

## Configurar o Cloudflare R2 (para os anexos das notas)

O upload passa pelo servidor (Server Actions), usando um token de API do
R2 — o app nunca expõe suas credenciais no navegador, e as URLs dos
arquivos são geradas na hora, válidas por 1 hora, então o bucket pode
ficar privado.

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com/), crie uma
   conta (ou entre na sua) e clique em **R2 Object Storage** no menu
   lateral.
2. Pode ser que peça para cadastrar um cartão para "ativar" o R2 — isso é
   normal e não significa que você vai ser cobrado: o plano gratuito
   inclui 10GB de armazenamento e milhões de operações por mês, e você só
   paga se ultrapassar isso (bem difícil para um app pessoal/familiar).
3. Clique em **Create bucket**, dê um nome (ex: `vidatrack-anexos`) e
   mantenha as opções padrão. Esse nome vai em `R2_BUCKET_NAME`.
4. No menu R2, vá em **Manage R2 API Tokens > Create API Token**.
   Escolha permissão **Object Read & Write**, e (opcional) restrinja ao
   bucket que você criou.
5. Copie os 3 valores gerados:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
   - O **Account ID** aparece no canto direito da página do R2, ou na URL
     do painel → `R2_ACCOUNT_ID`

No Vercel, adicione essas mesmas 4 variáveis em **Settings > Environment
Variables** do projeto.

**Nota:** a ideia inicial era usar o Firebase Storage, mas desde
fevereiro de 2026 o Google passou a exigir cartão cadastrado (plano
Blaze) só para manter o Storage ativo, mesmo dentro da faixa gratuita —
então trocamos pelo R2 da Cloudflare, que também é gratuito na prática
para o volume de uso deste app.



## Configuração extra (herdada da Etapa 1.5)

### Ativar login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   projeto (ou use um existente) e vá em **APIs e Serviços > Credenciais**.
2. Crie uma credencial do tipo **ID do cliente OAuth**, tipo "Aplicativo da Web".
3. Em **Authorized redirect URIs**, adicione a URL de callback do Supabase.
   Você encontra o formato exato dela em **Supabase > Authentication >
   Providers > Google** (algo como
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`).
4. Copie o **Client ID** e o **Client Secret** gerados.
5. No painel do Supabase, vá em **Authentication > Providers**, ative o
   **Google** e cole essas duas informações.

### Configurar a URL do site

No `.env.local` (e depois nas variáveis de ambiente do Vercel), defina
`NEXT_PUBLIC_SITE_URL`:
- localmente: `http://localhost:3000`
- em produção: a URL do seu domínio no Vercel

Essa variável é usada para o app saber para onde te trazer de volta depois
do login com Google e depois de clicar no link de redefinição de senha.

### Testar o PWA

Depois de rodar (local ou já publicado), abra pelo navegador do celular e
procure a opção **"Adicionar à tela inicial"** (Android/Chrome) ou
**"Instalar app"** (desktop/Chrome). O ícone e o nome já estão configurados.

## Passo a passo para rodar

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (é gratuito).
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Vá em **Project Settings > API** e copie a **URL** e a **anon public key**.

### 2. Configurar as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
(Os campos do Cloudflare R2 só são necessários se você for usar a
funcionalidade de anexos nas Notas.)

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` — você será redirecionado para `/login`.

### 4. Publicar no Vercel

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e
   importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do seu
   `.env.local`.
4. Clique em **Deploy**.

O site já funciona bem em desktop e mobile (é responsivo por padrão). A
versão Android via Capacitor está descrita na seção específica acima.

## Todas as etapas até aqui

1. Fundação + login (e-mail/senha)
2. Google OAuth, esqueci senha, PWA, tema claro/escuro
3. Módulo de Hábitos (streaks, check-in)
4. Módulo de Notas (editor, anexos)
5. Módulo de Finanças (contas, categorias, lançamentos, orçamento)
6. Interface de compartilhamento (convite por e-mail)
7. Hábitos redesenhados (agenda "Hoje", Tarefas, Categorias, Timer)
8. Metas numéricas, editar tarefa, busca/fixar notas, gráfico de gastos
9. Recorrência, exportar CSV, estatísticas, arrastar para reordenar
10. Notificações push, testes, analytics, Android, doação
11. Modo offline básico (agenda "Hoje")
12. Auditoria de segurança (RLS)
13. Planejador de blocos de tempo
14. Integração com Telegram
15. Tela inicial rica (clima, calendário, resumos)
16. Confirmação de exclusão + Lixeira
17. Análise financeira avançada (treemap, radar, dicas)
18. Validação com Zod + Editar lançamento financeiro
19. Deploy no Vercel + Instalar como app
20. Privacidade e auditoria de acesso
21. Finanças com ícones, cores e saldo animado
22. Ícone/logo novo + mobile melhorado
23. Painel principal redesenhado (mobile)
24. Trava de zoom + ícone corrigido
25. Correção de overflow horizontal
26. Localização simplificada (só permissão)
27. Compartilhamento entre casal/família
28. Popup de excluir + recorrência no formulário + Assistente de IA
29. Assistente de IA removido
30. Ícones nas categorias padrão + fim de recorrência
31. Extrato com filtros de período
32. Nome/foto do Google + ícones de banco
33. Hábitos estilo HabitNow + correção visual em Finanças
34. Contraste dos tooltips dos gráficos
35. Menu trilho animado + calendário de gastos
36. Correção de layout no extrato + botão de voltar
37. Calendário em destaque + ordem personalizável
38. Reordenar blocos corrigido pra celular
39. Ocultar valores
40. Contas, categoria rápida, sair do app e visual Mobills
41. Lançamento por mensagem no Telegram + correções
42. Deixando o app mais rápido
43. Notificação push nativa (FCM)
44. Criar e editar offline (Hábitos, Notas, Finanças)
45. Correção de segurança no Git (google-services.json)
46. Offline "baixa tudo no login"
47. Botão de voltar duplicado em Hábitos
48. Excluir conta + privacidade pública
49. Área de toque maior nos links do rodapé
50. Bug de redirecionamento no middleware (causa real)
51. Rotas de API livres do redirecionamento de login
52. Painel principal travado (sem rolagem) — **você está aqui**

**Importante:** a partir da Etapa 11, convidar alguém pra compartilhar
um item exige que `SUPABASE_SERVICE_ROLE_KEY` esteja configurada no
`.env.local` (já era pedida desde a Etapa 9 para as notificações push —
se você já configurou aquilo, não precisa fazer nada a mais).

## Backlog (fica para quando fizer sentido)

- Rate limiting no login — depende mais de configuração de infraestrutura
  (ex: proteção do Supabase/Cloudflare) do que de código do app em si
- Cache offline de verdade no service worker (hoje ele só habilita a
  instalação do PWA e as notificações push)
- Tela de gráficos do analytics dentro do próprio app, se um dia isso
  fizer falta (hoje é só consultar direto no Supabase)
- Analytics simples e anônimo de uso
- Testes automatizados, conforme os módulos forem crescendo
