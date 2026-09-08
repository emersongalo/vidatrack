# VidaTrack — Etapa 98: Sequência Visível + Conquistas + Nota Rápida (Hábitos)

App único de **hábitos** e **finanças**, com telas próprias por
módulo e compartilhamento entre usuários. Stack: **Next.js** (Vercel),
**Supabase** (banco + autenticação) e **Cloudflare R2** (fotos de
perfil).

## O que já está pronto

**Novo nesta etapa (98) — as 3 primeiras das 6 melhorias em Hábitos
que você escolheu:**

**1. Sequência (streak) visível em cada hábito** — na tela de Lista
de Hábitos, cada um agora mostra a sequência atual (🔥) e o recorde,
sem precisar abrir Estatísticas.

**2. Conquistas com celebração** — ao marcar um hábito e a sequência
bater 7, 30, 100 ou 365 dias, aparece uma tela de celebração na hora.

**3. Nota rápida ao marcar** — depois de marcar um hábito (não ao
desmarcar), aparece um convite opcional pra anotar algo sobre aquele
dia. Pular não custa nada, é só clicar "Pular".

**Testei antes de construir a tela:** a lógica de "maior sequência
já alcançada" (recorde) — 7 cenários, incluindo datas fora de ordem,
duplicadas e virada de mês.

Não precisa rodar SQL — já apliquei a coluna nova
(`observacao` em `habito_checkins`) direto no banco.

## As 3 melhorias que faltam em Hábitos

- Calendário tipo "mapa de contribuições" (o ano inteiro)
- Hábitos negativos (parar de fazer algo)
- Histórico/insight comparando hábitos entre si

## E os 3 pedidos de desktop, ainda pendentes

- Hoje em 2 colunas
- Atalhos de teclado
- Resumo maior no Painel

**Novo nesta etapa (97) — melhoria #6 das 6, e a última:
patrimônio líquido.**

Nova tela em Finanças → Mais → "Patrimônio líquido": gráfico de
linha mostrando a evolução de **tudo que você tem** (todas as contas
+ investido, somados) mês a mês, nos últimos 12 meses. Mostra também
o valor atual e a variação total desse período.

**Testei antes de construir a tela:** simulei um cenário de 3 meses
com movimentações em cada um, conferindo que o valor de cada mês
bate exatamente com a soma esperada (saldo inicial + tudo que
aconteceu até o fim daquele mês).

Não precisa rodar SQL — é ajuste de código só.

## 🎉 As 6 melhorias significativas em Finanças, completas

1. Metas de economia (Etapa 93)
2. Aviso de orçamento estourado (Etapa 93)
3. Fatura de cartão de crédito de verdade (Etapa 94)
4. Importar extrato do banco — OFX/CSV (Etapa 95)
5. Dividir despesa entre pessoas (Etapa 96)
6. Patrimônio líquido ao longo do tempo (Etapa 97) — **você está aqui**

**Novo nesta etapa (96) — melhoria #5 das 6: dividir despesa entre
pessoas.**

Nova seção em Finanças → Mais → "Dividir despesas":
- Escolhe um lançamento já existente, informa o e-mail da pessoa e
  quanto ela deve pagar
- Tela de resumo mostra **"Devem pra você"** e **"Você deve"**,
  separados, com total de cada
- Marca como pago com um toque
- Se a pessoa já tem conta no VidaTrack (reconhecida por já ter
  aceitado um compartilhamento com você antes), a divisão fica
  vinculada ao usuário dela de verdade; se não, fica só com o e-mail
  registrado

**Bug real que corrigi durante a construção:** comecei escrevendo a
ação de criar divisão esperando que a despesa já viesse escolhida de
antemão, mas a tela real deixa a pessoa **escolher a despesa dentro
do próprio formulário** — troquei a estrutura pra ler isso do
formulário certinho antes de finalizar.

Não precisa rodar SQL — já apliquei a tabela nova
(`divisoes_despesa`, com permissões de segurança) direto no banco.

## A última melhoria que falta

6. Patrimônio líquido ao longo do tempo

**Novo nesta etapa (95) — melhoria #4 das 6: importar extrato do
banco.**

Nova tela em Finanças → Mais → "Importar extrato":
1. Escolhe a conta de destino
2. Sobe um arquivo **OFX** (o formato padrão que a maioria dos bancos
   brasileiros exporta) ou **CSV** (com colunas Data, Descrição e
   Valor)
3. Confere a prévia — cada lançamento vem com checkbox, dá pra
   desmarcar o que não quiser importar
4. Confirma, e pronto

**Proteção contra duplicata:** se você importar o mesmo extrato duas
vezes (ou um período que já tinha lançamentos manuais), o sistema
reconhece pela combinação de data + valor + descrição e **pula
automaticamente** o que já existe — te avisa quantos foram
ignorados assim.

**Testei antes de construir a tela:** os dois parsers (OFX no
formato antigo sem tags de fechamento, OFX no formato XML mais novo,
e CSV com vírgula decimal brasileira) — todos com dados de exemplo
realistas, conferindo cada campo extraído.

Não precisa rodar SQL — é ajuste de código só.

## As 2 melhorias que faltam

5. Dividir despesa entre pessoas
6. Patrimônio líquido ao longo do tempo

**Novo nesta etapa (94) — melhoria #3 das 6: fatura de cartão de
verdade.**

Achei uma coisa importante: parte dessa funcionalidade **já tinha
sido construída antes** nesta conversa (formulário já pedia dia de
fechamento/vencimento, e a lógica de cálculo de período já existia)
— mas achei um bug real: **as telas de criar/editar conta pediam
esses campos, mas as actions de salvar não os capturavam nem
salvavam** — ficavam perdidos silenciosamente. Corrigido.

**O que constrói de novo:**
- Tela de **Fatura** pra cada cartão configurado (ícone de recibo
  aparece na lista de Contas, só pra cartões com fechamento
  cadastrado)
- Mostra a fatura **fechada** (a que está vencendo) por padrão, com
  total e data de vencimento
- Navegação entre faturas anteriores/seguintes
- Lista de lançamentos de cada fatura

**Testei antes de construir a tela:** rodei 7 cenários na lógica de
cálculo já existente (período normal, antes/depois do fechamento,
vencimento no mês seguinte, virada de ano, navegação entre
períodos) — todos corretos, então usei ela como está.

## Rodar o schema desta etapa

Já apliquei direto no seu banco (2 colunas novas em `financa_contas`)
— não precisa rodar nada.

## As 3 melhorias que faltam

4. Importar extrato do banco (CSV/OFX)
5. Dividir despesa entre pessoas
6. Patrimônio líquido ao longo do tempo

**Novo nesta etapa (93) — as 2 primeiras das 6 melhorias
significativas em Finanças que você pediu:**

**1. Aviso automático de orçamento estourado** — todo dia (mesmo
horário que já checamos contas a pagar), o sistema confere se algum
gasto do mês passou da meta de alguma categoria, e manda notificação
push (mesmo sistema de sempre) — só uma vez por categoria por mês,
não fica repetindo.

**2. Metas de economia** — nova tela em Finanças → Mais → "Metas de
economia". Cria uma meta com nome e valor alvo (e data alvo
opcional), vai "guardando" aos poucos com um campo de +valor, e
acompanha o progresso numa barra visual. Quando bate o valor, marca
como concluída sozinha. Separado do "Investido" de propósito — uma
meta pode ser guardada em qualquer lugar (até debaixo do colchão),
não precisa ser uma conta de investimento de verdade.

**Testei antes de entregar:** a lógica de cálculo do primeiro
dia do mês e do mês seguinte (incluindo virada de ano), isoladamente.

## Rodar o schema desta etapa

Já apliquei tudo direto no seu banco durante a conversa (tabela nova
de metas + ajuste na tabela de controle de notificação) — não
precisa rodar nada.

## As 4 melhorias que faltam (próximas etapas)

3. Fatura de cartão de crédito de verdade
4. Importar extrato do banco (CSV/OFX)
5. Dividir despesa entre pessoas
6. Patrimônio líquido ao longo do tempo

**Confirmado: notificação funcionando de ponta a ponta no domínio
novo** — depois de descobrir que o navegador guardava a inscrição
antiga localmente (mesmo com o banco limpo), desativar e ativar de
novo resolveu. Chegou certinho.

**Novo nesta etapa (92) — campo de Observações nas tarefas:**

Tarefas agora têm um campo de texto livre pra anotações — aparece no
formulário de criar/editar, e também na tela de detalhe da tarefa
(só quando tiver algo escrito).

Já apliquei a migração direto no seu banco durante a conversa — o
arquivo `supabase/schema_observacoes_tarefa.sql` também está aqui,
só pra manter o histórico completo, caso precise recriar num outro
ambiente.

Não precisa rodar SQL agora (já foi aplicado).

**Novo nesta etapa (90) — sobre o print que você mandou:**

Conferi o código — o ícone grande da notificação (`icon`) **já
estava correto**, usando nossa logo nova desde a Etapa 80. A
notificação do seu print especificamente veio do domínio antigo
(`vidatrack.vercel...`), então é bem provável que tenha sido de uma
inscrição/Service Worker de antes dessa atualização — não um
problema no código atual.

**O que achei de real pra melhorar:** o "badge" (o ícone pequeno que
aparece na barra de notificação do Android) ainda usava o mesmo
arquivo colorido do ícone grande — mas esse tipo de ícone funciona
melhor com fundo **transparente**, só o desenho em branco, porque o
Android costuma pintar ele da cor que quiser por cima. Criei uma
versão própria só pra isso.

Não precisa rodar SQL — é arquivo de imagem + 1 linha de código.

**Pra ver isso funcionando de verdade:** teste numa notificação nova,
já pelo `vidatrack.online` (não pelo domínio antigo do print).

**Novo nesta etapa (89) — alarme direto na tela, com som:**

Enquanto o app estiver aberto numa aba do navegador (qualquer tela,
não só Hábitos), ele confere a cada 15 segundos se algum hábito ou
tarefa tem horário de lembrete batendo com o horário atual. Se
bater, aparece um alerta na tela (com o nome, o horário, botão de
"Ver" e "Dispensar") e toca um bipe duplo.

**Isso é um reforço, não substitui o push** — funciona só enquanto a
aba está aberta (se fechar, para de conferir, igual o Timer já
avisa). A vantagem é que **não depende do agendador externo
funcionar** — é tudo calculado no seu próprio navegador, em tempo
real.

**Um detalhe técnico importante:** navegadores modernos bloqueiam
som automático até você interagir com a página pelo menos uma vez
(clicar em qualquer lugar) — é uma política de segurança do próprio
navegador, não tem como contornar. O alerta visual sempre aparece
normalmente; só o som pode ficar mudo na primeiríssima vez, antes de
qualquer clique na página.

**Testei antes de entregar:** a lógica de comparação de horário
(hora atual formatada como "HH:MM") isoladamente, com vários
cenários incluindo meia-noite e fim do dia.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (88) — formulários com seletor de ícone
melhorados pro desktop:**

Os formulários de criar/editar Tarefa, Hábito, Categoria e a criação
rápida de categoria (dentro do lançamento financeiro) tinham a
grade de ícones sempre com 6 (ou 8) colunas, mesmo com a tela
larga — sobrava espaço e precisava rolar pra ver todos. Agora no
desktop a grade usa mais colunas (9 ou 12, dependendo do
formulário), e o formulário em si ficou um pouco mais largo também —
sem virar um formulário gigante, só o suficiente pra não parecer
"celular esticado".

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (86) — o que realmente precisava mudar com o
domínio novo:**

Conferi o código inteiro em busca de qualquer lugar travado no
domínio antigo. Achado real: `capacitor.config.ts` (a configuração
do app nativo/Android) ainda tinha um placeholder genérico
apontando pro Vercel — atualizei pra `https://www.vidatrack.online`.

**O manifest.json (PWA) já estava certo** — usa caminho relativo, se
adapta sozinho a qualquer domínio, não precisava mexer.

**O código de notificação (Web Push e Service Worker) também já
estava certo** — não tem nada travado em domínio específico ali.

## O que ainda precisa fazer manualmente (não é código, é processo)

1. **Reconstruir o app Android** — como o app nativo carrega o site
   de dentro de um WebView configurado nesse arquivo, só trocar o
   código aqui não atualiza quem já tem o app instalado. Precisa
   rodar `npx cap sync android`, gerar um novo `.apk`/`.aab`, e
   reinstalar (ou publicar a atualização, se já estiver na Play
   Store)
2. **Inscrições de notificação do navegador (Web Push) não migram
   sozinhas** — como são vinculadas ao domínio pelo próprio
   navegador, quem já tinha ativado notificação em
   `vidatrack.vercel.app` vai precisar **entrar de novo em
   `vidatrack.online` e ativar notificação outra vez** lá. É
   automático assim que a pessoa visitar e permitir — não precisa
   mexer em nada no banco
3. **Tokens do app nativo (FCM)** devem continuar funcionando
   normalmente depois do app reconstruído, sem precisar de nada
   extra — o FCM não é vinculado ao domínio do site, só ao Firebase

Não precisa rodar SQL — é ajuste de configuração só.

**Novo nesta etapa (85) — achamos a causa real do lançamento
duplicado:**

Não era conexão com dois bancos — era o **botão de salvar sem
nenhuma proteção contra clique duplo**. Se a resposta do servidor
demorasse um pouquinho, um segundo clique (ou clique impaciente)
criava um segundo registro idêntico.

**Corrigido em 9 formulários diferentes**, todos usando um novo
componente reutilizável (`BotaoSalvarFormulario`) que desabilita o
botão e mostra "Salvando..." enquanto processa — impossível clicar
duas vezes agora:
1. Lançamento financeiro
2. Categoria financeira
3. Hábito
4. Tarefa
5. Criar conta
6. Editar conta
7. Recorrência
8. Transferência pra investimento
9. Categoria de produtividade (hábitos)

**Bug que eu mesmo cometi e corrigi antes de entregar:** ao editar um
dos arquivos, deixei uma tag HTML sobrando por engano — conferi
todos os 9 lugares editados um por um antes de empacotar, pra
garantir que nenhum outro tinha o mesmo problema.

**O que ficou de fora de propósito:** telas de alternar estado
(marcar tarefa como feita, ativar/desativar recorrência) e de filtro
(extrato) — essas não criam registro novo, então clique duplo nelas
não causa duplicação de dado, só um efeito colateral inofensivo
(volta ao estado original).

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (84) — Timer corrigido:**

A tela do Timer usava uma largura (`max-w-sm`) que minha varredura da
Etapa 83 não pegou (só tinha buscado `max-w-md` e `max-w-2xl`) — por
isso ela continuou com cara de celular solta no meio da tela. Corrigi
e também **aumentei o tamanho** dos números do timer e dos botões no
desktop, pra não ficar só "a mesma versão pequena, sozinha numa tela
grande" — agora ocupa o espaço de verdade.

Também fiz uma varredura em **todas** as páginas de Finanças e
Hábitos (30 telas) pra confirmar que não sobrou mais nenhuma com
largura esquecida — só as telas de formulário continuam mais
estreitas de propósito (é melhor pra preencher).

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (83) — todas as sub-telas agora se adaptam pro
desktop, não só a tela inicial:**

**Alargadas (14 telas):** Contas, Categorias, Extrato, Mais,
Recorrentes, Análise e Lixeira de contas (Finanças); Lista, Tarefas,
Categorias, Lixeira, Lixeira de tarefas, Estatísticas e Planejador
(Hábitos).

**Viraram grade de 2 colunas no desktop** (pra não sobrar espaço
vazio dos lados numa lista de itens curtos): Contas, Categorias
(Despesas e Receitas lado a lado), Recorrentes e Mais (Finanças);
Categorias (Hábitos).

**O que ficou de propósito só alargado, sem virar coluna:** telas de
formulário (criar/editar um hábito, categoria, conta, lançamento) —
um formulário muito largo fica pior de preencher, não melhor, então
mantive esses mais estreitos e centralizados mesmo no desktop.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (82) — as 3 melhorias que você escolheu, em
`/habitos/estatisticas`:**

1. **Visão geral da semana** — um placar único somando TODOS os
   hábitos: quantos "dia de hábito" eram esperados essa semana vs
   quantos foram realmente feitos, em percentual
2. **Comparação com a semana passada** — mostra os dois números lado
   a lado, com uma seta (↑/↓) indicando se melhorou ou piorou, e por
   quantos pontos percentuais
3. **Dicas automáticas**, geradas só a partir do que realmente
   aconteceu (nada inventado): qual hábito teve melhor desempenho
   (se bateu 100%), qual precisa de mais atenção (se ficou abaixo de
   50%), e um comentário sobre a evolução em relação à semana
   passada

**Testei antes de entregar:** simulei um cenário com 2 hábitos e
conferi cada número isoladamente (total aplicável, total feito,
percentual, melhor e pior hábito) — todos bateram certinho.

A tela já é acessível pela lista de Hábitos (não mexi no menu de
navegação, já que essa opção específica não foi escolhida — me avisa
se quiser adicionar lá também depois).

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (81) — 2 dos 3 pedidos resolvidos:**

**1. Notificação duplicada (navegador + app) corrigida:** o sistema
agora prioriza o app instalado — se você tem o app (token do FCM
existe), ele **não manda mais pelo navegador** ao mesmo tempo. Só
usa o navegador se não tiver o app instalado nesse dispositivo.
(Vale notar: essa prioridade é por pessoa, não por aparelho — se você
usa o app no celular mas queria notificação do navegador no
computador também, essa combinação específica não vem incluída; me
avisa se esse for o seu caso que ajusto.)

**2. Ícones de hábitos e tarefas modernizados**, no mesmo padrão que
já fizemos pras categorias financeiras (Etapa 63):
- 32 ícones Lucide novos pra escolher (antes eram emoji)
- O ícone de **"recorrente"** (antes 🔁) e o de **lembrete** (antes 🔔)
  na tela "Hoje" agora são ícones de verdade também
- Compatibilidade com hábitos/tarefas antigos — continuam mostrando
  o emoji de antes até você trocar
- Corrigido em **11 lugares diferentes** do código: formulários de
  criar/editar hábito e tarefa, tela Hoje, lixeiras, estatísticas,
  detalhe de tarefa, listas arrastáveis, modo offline, sugestões
  rápidas de hábito, e criação rápida offline — todos usando o mesmo
  padrão agora, sem nenhum lugar esquecido

Não precisa rodar SQL — é ajuste de código só.

## Ainda falta (métricas de hábitos)

Sobre mostrar evolução, o que foi feito/não feito e dar dicas: **já
existe uma tela `/habitos/estatisticas`** no projeto. Vou olhar o que
já tem construído ali antes de propor o que adicionar, pra não
duplicar trabalho — fica pra próxima etapa.

**Novo nesta etapa (80) — ícone do app atualizado:**

Troquei o ícone "V" antigo pelo desenho novo do trilho (mesma logo
que fizemos pro Instagram) — em todos os tamanhos que o app usa:

- `icon-192.png` e `icon-512.png` (ícone padrão)
- `icon-maskable-512.png` (versão com margem de segurança pro
  Android recortar em círculo, quadrado arredondado, etc., sem
  cortar nada importante)
- `apple-touch-icon.png` (ícone do iPhone/iPad)
- `favicon.ico` (aba do navegador)

O `manifest.json` já apontava pros mesmos nomes de arquivo, então não
precisei mexer em mais nada — só troquei o conteúdo das imagens.

Não precisa rodar SQL — é arquivo de imagem só.

**Repare que depois do deploy, o ícone pode demorar pra atualizar**
no seu celular — isso é cache do próprio Android/navegador guardando
o ícone antigo. Se não atualizar sozinho em alguns dias, o jeito mais
rápido é desinstalar e reinstalar o app.

**Novo nesta etapa (79) — o app agora se adapta pra tela de computador:**

- **Menu lateral fixo no desktop**, substituindo a barra de baixo
  (que continua normal no celular) — Hábitos e Finanças cada um com
  seu próprio menu, cores certas, link de volta pro Painel e pro
  Perfil
- **Tela de Finanças em 2 colunas no desktop** — Contas/Investido,
  Orçamento, Análise, Calendário, Gráfico e Lançamentos fluem lado a
  lado em vez de ficarem todos empilhados numa coluna só e estreita
- Telas mais largas de modo geral no desktop, aproveitando o espaço
  da tela

Não precisa rodar SQL — é ajuste de código só.

**Novo na etapa (78) — excluir conta direto, sem precisar da lixeira:**

A exclusão definitiva de conta já existia, mas escondida atrás de um
caminho de 2 passos (arquivar → depois achar na lixeira → aí sim
excluir). Agora tem um botão de excluir direto na tela principal de
Contas, ao lado de Arquivar — com um aviso bem claro de que isso
apaga todos os lançamentos e recorrências daquela conta, sem volta.
Também converti os botões de ação (Editar/Compartilhar/Arquivar/Excluir)
pra ícones, evitando o mesmo problema de espaço apertado que já
corrigimos em Hábitos antes.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (77) — achamos por que "funcionava só em alguns
lançamentos":**

O print que você mandou foi decisivo — o "0,00" aparecia em cinza
claro (é o texto de exemplo, não um valor de verdade). Isso, mais o
padrão de "esse funciona, aquele não" no MESMO dono e MESMA conta,
apontou pra a mesma causa que já resolvemos antes nesta conversa: o
**Next.js guardando em cache a resposta de uma tela específica**. Uma
nota visitada ANTES da correção do campo de valor (Etapa 74) ficava
"presa" numa versão antiga da página pra sempre — mesmo o código já
estando corrigido — enquanto uma tela nunca visitada antes pegava a
versão nova certinha.

**Corrigido:** adicionei a mesma proteção que já usamos na rota de
notificações (`dynamic = "force-dynamic"`) em **todas as 7 telas
parecidas** do app (editar lançamento, categoria, conta, hábito,
tarefa, e as telas de compartilhar) — não só na que você reportou,
já que todas tinham o mesmo risco.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (74) — 3 bugs reais, todos com causa concreta:**

1. **Filtro do extrato ("este mês") ia só até hoje, não até o fim do
   mês de verdade** — corrigido pra ir do dia 1 até o último dia do
   mês. Você ainda pode trocar o filtro livremente na tela

2. **Editar lançamento não mostrava o valor** — achei a causa exata:
   a tela de edição convertia o valor pra vírgula (formato antigo)
   ANTES de passar pro campo novo (Etapa 73), que já faz essa
   conversão sozinho — a combinação dos dois quebrava tudo, o campo
   ficava vazio. Corrigido, e testei o fluxo completo (banco → tela
   → campo) isoladamente antes de entregar

3. **Gráfico "Despesas por categoria" colado no último lançamento** —
   o bloco de lançamentos não tinha a mesma margem inferior que os
   outros blocos (Calendário, Gráfico). Corrigido pra ficar
   consistente

**Mais uma pasta duplicada por engano** no meu processo — removida e
confirmada antes de empacotar.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (73) — vários ajustes visuais + 2 funcionalidades novas:**

**Cortes de texto corrigidos:**
- Legenda do gráfico de pizza — era 2 colunas apertadas, agora é
  lista de 1 coluna, cada nome com o espaço inteiro pra si
- "Receitas do mês" / "Despesas do mês" no painel — eram lado a
  lado disputando espaço, agora ficam empilhados, cada um com a
  largura inteira do card
- Lista de Hábitos — achei a causa real: 3 botões de texto
  ("Editar", "Compartilhar", "Arquivar") competindo por espaço fixo
  sobravam quase nada pro nome do hábito. Troquei por ícones
  compactos (mesmo padrão do resto do app)

**2 funcionalidades novas:**
- **Escolher tipo de gráfico** — o gráfico de despesas por categoria
  agora tem um alternador pizza/colunas
- **Comparação com o mês passado** — nova seção na tela de Análise,
  gráfico de colunas lado a lado (mês passado x este mês) por
  categoria, usando dados que já calculávamos ali mesmo

**Valor digitado como app de banco de verdade:**
Agora ao digitar o valor de um lançamento, os 2 últimos dígitos
sempre viram centavos automaticamente — digita "255954" e já
aparece "2.559,54", sem precisar digitar vírgula.

**Bug real que achei junto com isso (e que já estava presente antes,
não é novo desta etapa):** a validação de valor só trocava a vírgula
por ponto, mas não removia o ponto de milhar — isso significa que
**qualquer lançamento acima de R$ 1.000,00 já estava quebrando
silenciosamente** antes desta correção, em 4 lugares diferentes do
código (lançamento normal, saldo inicial de conta, meta de
categoria, transferência pra investimento). Corrigido em todos, e
testei cada caso isoladamente antes de entregar (formatação ao
digitar, conversão do valor ao editar um lançamento existente, e o
parse final que vai pro banco).

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (72) — confirmado: notificação automática está
funcionando de ponta a ponta! 🎉**

O log (Etapa 69) finalmente revelou tudo: a causa de "não chega" nos
testes anteriores era o **controle de duplicidade fazendo o trabalho
certo** — o primeiro disparo automático (lá de manhã cedo) já tinha
marcado "lembrete enviado hoje" pra esse hábito, e o sistema
corretamente recusava mandar de novo no mesmo dia, mesmo eu trocando
o horário várias vezes pra testar.

Depois de limpar esse registro de teste, a notificação chegou — e o
log mostrou **2 envios com sucesso** e 3 falhas por inscrições de
navegador expiradas (código HTTP 410 — normal, de testes em sessões
diferentes ao longo do dia).

**Corrigido nesta etapa:** o Web Push agora limpa sozinho inscrições
mortas (código 404/410), do mesmo jeito que já fazíamos com tokens
FCM inválidos — evita ficar tentando mandar pra endereços que não
existem mais.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (71) — limpeza, sem afetar o funcionamento:**

Achei um `vercel.json` configurando um cron **nativo do Vercel**
chamando `/api/lembretes` 1x por dia — uma sobra de antes de
configurarmos o cron-job.org (que já roda a cada 2 minutos, de
verdade). Não causava conflito (são chamadas independentes, o
controle de "já enviei hoje" evita duplicidade), mas ficou redundante.
Removido.

Não precisa rodar SQL — é limpeza de arquivo só.

**Novo nesta etapa (70) — 4 bugs reais, todos com causa concreta:**

1. **"Erro de caractere" ao criar categoria** — a validação ainda
   esperava um emoji curto (limite de 8 caracteres), mas os ícones
   novos (Etapa 63) são nomes tipo "GraduationCap" — 13 caracteres.
   Aumentei o limite pra 30
2. **Não deixava mudar a cor do ícone** — o seletor de cor tem 10
   opções (Etapa 32), mas a validação só aceitava 4. Escolher
   qualquer uma das outras 6 falhava sem aviso claro. Corrigido pra
   aceitar todas
3. **Botão físico de voltar do Android** — o código antigo usava um
   truque de histórico do navegador, mas isso tem um bug real: no
   segundo toque, o Android já navega de verdade pra página anterior
   ANTES do nosso código conseguir reagir — por isso aparecia o
   aviso, mas o app "voltava" mesmo assim. Reescrevi usando o plugin
   `@capacitor/app`, que intercepta o botão físico direto (o jeito
   certo, dentro de app nativo). **Bônus:** descobri que o
   `package.json` nunca tinha sido atualizado com os pacotes do
   Capacitor que você instalou direto na sua máquina (core, cli,
   android) — corrigido também, pra próxima vez o zip já vir
   completo
4. **Extrato com filtro pré-aplicado** — clicar em "Receitas do mês"
   ou "Despesas do mês" no painel levava direto pro extrato já
   filtrado só por um tipo, escondendo o outro. Agora abre o mês
   inteiro, com os dois tipos — você aplica o filtro que quiser de lá

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (69) — achamos onde a notificação está falhando de verdade:**

O agendador automático (cron-job.org) já estava disparando sozinho —
confirmamos isso pelo registro em `lembretes_enviados`. Mas a
notificação não chegava, e o código **engolia qualquer erro do envio
em silêncio**, sem guardar o motivo — não dava pra saber se era o
Web Push, o FCM, ou os dois.

**Corrigido:** criei uma tabela nova (`log_notificacoes`) que guarda,
pra cada tentativa de envio, se deu certo ou não — e se não deu, o
erro real (código de status do Web Push, ou o erro específico do
Firebase). Da próxima vez que testarmos, consigo consultar essa
tabela direto e ver exatamente onde travou, em vez de ficar no
escuro de novo.

Não precisa rodar SQL manualmente — já apliquei a tabela nova direto
no seu banco (`log_notificacoes`) durante esta conversa, mas o
arquivo `supabase/schema_log_notificacoes.sql` também está aqui, caso
precise recriar num outro ambiente.

**Novo nesta etapa (68) — dinheiro investido, separado do saldo:**

- **Novo tipo de conta: "Investimento"** — ao criar ou editar uma
  conta, agora tem essa opção
- **Fica de fora do "Saldo em contas"** da tela principal — o
  dinheiro guardado não conta mais como "disponível pra gastar"
- **Seção própria "💰 Investido"**, com o total guardado em destaque
  e a lista de cada conta de investimento
- **Nova tela "Guardar em investimento"** (Finanças → Mais) — escolhe
  de qual conta sai o dinheiro e pra qual conta de investimento vai;
  cria automaticamente uma despesa na origem (categorizada como
  "Investimento") e uma receita na conta de investimento, ao mesmo
  tempo. Se uma das duas partes falhar, desfaz a outra, pra nunca
  ficar com dinheiro "perdido" no meio do caminho

**Sobre juros compostos:** por enquanto não calculamos isso
automaticamente — o valor guardado cresce conforme você registra
transferências. Se quiser refletir o rendimento real (o dinheiro
"rendeu" sozinho no banco/corretora), dá pra editar o saldo inicial
da conta de investimento manualmente por enquanto. Calcular juros
automaticamente é um projeto à parte, se quiser no futuro.

**Bug real que achei antes de virar problema silencioso:** a
validação (Zod) da tela de criar/editar conta ainda não aceitava
"investimento" como valor válido — sem corrigir isso, toda tentativa
de criar uma conta de investimento falharia com um erro genérico.
Corrigido antes de entregar.

**Testei antes de entregar:** simulei o cálculo completo (salário
recebido + parte transferida pra investimento) — o saldo principal
não incluiu o valor investido, e o total investido bateu certinho.

## Rodar o schema desta etapa

No SQL Editor do Supabase, roda `supabase/schema_conta_investimento.sql`
(depois de todos os schemas anteriores).

**Novo nesta etapa (67) — achamos de verdade, graças ao modo de
depuração da etapa passada:**

A resposta com `debug=1` mostrou a causa exata: o servidor achava que
eram **08:49**, quando no Brasil real eram **05:49** — 3 horas de
diferença. Isso quer dizer que o servidor estava calculando o horário
em UTC puro, sem aplicar o fuso do Brasil.

**A causa raiz:** o código tinha `Number(process.env.TIMEZONE_OFFSET_HORAS ?? "-3")`.
O `??` só usa o valor padrão quando a variável é `null`/`undefined` —
mas se ela existir no Vercel **em branco** (texto vazio, não
apagada), `Number("")` vira `0`, não cai no `-3`. É exatamente esse
o cenário que bateu aqui.

**Corrigido no código:** agora só usa o valor da variável de ambiente
se ele for um número válido de verdade; qualquer outra coisa
(em branco, ausente, texto inválido) cai no padrão `-3` (Brasília).
Testei os 5 cenários possíveis antes de entregar — todos passaram.

**Vale você também conferir/corrigir a variável em si:** no Vercel,
Settings > Environment Variables > `TIMEZONE_OFFSET_HORAS` — se
estiver em branco, ou apaga ela (o código agora cai no padrão certo
sozinho) ou preenche com `-3` mesmo.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (66) — a causa mais provável do "enviados: 0":**

Testamos 2 vezes seguidas com o horário certo e ambas vieram
`enviados: 0`. Isso é o padrão clássico de **cache** — a rota não
tinha nenhuma instrução dizendo pro Vercel "nunca guarde essa
resposta", então tanto o servidor quanto o próprio navegador podem
estar reaproveitando a primeira resposta em vez de rodar de novo de
verdade.

**Corrigido:**
- `export const dynamic = "force-dynamic"` — força a rota rodar de
  novo a cada chamada, nunca servir uma versão guardada
- `Cache-Control: no-store` na resposta — garante que o navegador
  também não guarde essa resposta pra reusar depois

**Bônus — modo de depuração**, pra não ficarmos adivinhando se isso
não resolver: adicionando `&debug=1` na URL, a resposta mostra
exatamente o horário que o servidor está calculando, a janela de
verificação, e a lista de hábitos com lembrete configurado.

```
https://SEU-APP.vercel.app/api/lembretes?secret=SEU_CRON_SECRET&debug=1
```

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (65) — testar lembretes sem precisar do Console:**

A rota de lembretes agora aceita o segredo de duas formas: no
cabeçalho `Authorization` (como o agendador externo de verdade
chama) OU num parâmetro na própria URL (`?secret=...`) — isso deixa
testar manualmente **só colando um link no navegador**, sem precisar
abrir o Console/DevTools, que estava causando dificuldade.

**Como testar agora:**
```
https://SEU-APP.vercel.app/api/lembretes?secret=SEU_CRON_SECRET
```
Só colar esse link (com os valores reais) na barra de endereço e
apertar Enter — aparece a resposta na tela mesma.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (64) — Notas removida de vez, o app agora é só
Hábitos + Finanças:**

Removido por completo (dados continuam no banco, sem uso, sem
risco nenhum de perda):
- Toda a pasta `app/notas/` e os componentes exclusivos dela
  (editor, botão de nota offline, lista de anexos, ações da lixeira)
- Estação de Notas no painel principal e no card da tela de login
- Aba de Notas no modo offline (`/offline`) — ficou só Hoje e
  Finanças
- Seção de lembrete de nota na rota de notificações automáticas
- Busca de notas no "baixar tudo" offline
- Textos em Notificações, Perfil, Privacidade e no título do app que
  mencionavam Notas

**Bug real que peguei antes de virar quebra de build:** um arquivo
da fila offline ainda importava de dentro da pasta de notas que eu
tinha acabado de apagar — corrigido antes de empacotar.

**Descoberta importante no meio do caminho:** "nota" também é o
nome de uma **cor do tema** usada em Tarefas, históricos e outros
componentes, sem relação nenhuma com o módulo — tive cuidado de
**não mexer** nesses casos (são dezenas de arquivos que usam essa
cor, intactos).

**Testei antes de entregar:** rodei a varredura completa de imports
depois de tudo — zero referência quebrada, zero import apontando pra
algo que não existe mais.

Não precisa rodar SQL — os dados de notas continuam no banco,
intactos, só sem nenhuma tela usando eles.

**Novo nesta etapa (63) — ícones de categoria, no mesmo estilo dos menus:**

- **73 ícones** pra escolher (antes eram só 12 de despesa + 6 de
  receita) — qualquer ícone serve pra qualquer tipo agora, sem
  separação forçada
- Usados ao criar/editar categoria, na lista de categorias, nos
  lançamentos da tela principal e no extrato

**Limitação real do HTML que encontrei:** o menu suspenso de escolher
categoria (`<select>`) não consegue mostrar ícones de verdade — é uma
limitação do próprio navegador, não dá pra contornar sem trocar o
componente inteiro por um customizado. Optei por deixar esse menu só
com o nome (mais limpo que mostrar texto tipo "Utensils Alimentação")
— o ícone de verdade aparece em todo o resto da tela.

**Compatibilidade com categorias antigas:** categorias criadas antes
desta etapa continuam com o emoji de sempre — criei um componente
que reconhece automaticamente se é um ícone novo ou um emoji antigo,
e mostra do jeito certo. Não precisa editar nada nas categorias já
existentes, a não ser que queira trocar o ícone delas também.

Não precisa rodar SQL — é código só.

**Novo nesta etapa (62) — auditoria sistemática, não mais bug por bug:**

Percorri as telas mais visitadas do app (Painel, Hábitos, Notas,
Finanças e suas subtelas) procurando o mesmo padrão de problema já
encontrado antes: buscas ao banco duplicadas ou rodando uma atrás da
outra quando poderiam ser paralelas.

**O que já estava bom (revisei e confirmei, sem mudar):**
- Painel principal — enxuto
- Hábitos "Hoje" — já bem otimizada desde a Etapa 41
- Notas (lista) — busca única, sem duplicação
- Perfil — cadeia de dependência real, não dá pra paralelizar mais

**4 problemas reais encontrados e corrigidos:**
1. **`/financas/contas`** — o maior achado. Tinha uma busca inteira
   duplicada só pra pegar a sua própria foto (quando ela já vinha
   dentro de outra busca que já existia), mais um loop de fotos
   rodando uma pessoa de cada vez em vez de todas juntas. Reescrita
   seguindo o mesmo padrão já aplicado na tela principal lá na
   Etapa 39
2. **`/financas/nova`** (tela de novo lançamento — a mais usada do
   app, você abre toda vez que lança algo) — 2 buscas independentes
   rodavam uma depois da outra; agora rodam juntas
3. **`/notas/[id]`** (abrir uma nota) — a busca dos anexos não
   dependia da nota em si (usa o mesmo id da URL) — agora roda junto
4. **Análise financeira** — uma das 3 buscas não dependia de nada
   anterior e ainda assim era a última da fila; agora roda em
   paralelo desde o início

**Sendo honesto sobre o limite real:** depois dessa auditoria, o que
sobra de lentidão é majoritariamente o "cold start" do Vercel (a
hospedagem "desligando" cada função depois de um tempo sem uso) e a
verificação de sessão em toda navegação (necessária por segurança).
Nenhum dos dois tem correção de graça — expliquei isso com mais
detalhe lá na Etapa 53. O que dava pra melhorar de graça no nosso
próprio código, acredito que já está feito.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (61) — achei uma regressão real de performance:**

Quando adicionei a "lista de contas com saldo" na reformulação
grande de Finanças (Etapa 56), a função que calcula isso
(`buscarSaldoPorConta`) fazia **2 buscas próprias ao banco**
(contas + transações) — totalmente duplicadas com dados que a
própria página já tinha acabado de buscar segundos antes, na mesma
carga de tela. Isso empilhou 2 idas-e-voltas extras exatamente na
tela que você reclamou ser a mais lenta.

**Corrigido:** virou uma função pura — recebe os dados que a página
já carregou e só calcula em cima deles, sem nenhuma busca nova ao
banco. Testei o cálculo isoladamente antes de trocar, pra garantir
que o resultado continua idêntico.

**Sobre Hábitos e Notas:** revisei as duas — `/notas` já é enxuta (uma
busca só, sem duplicação nenhuma), e `/habitos` já tinha sido
otimizada lá na Etapa 41. Não achei uma causa concreta parecida
nelas — o que sobra de lentidão ali é o "cold start" que já
expliquei (característica da hospedagem gratuita, sem solução
mágica sem custo).

**Mais uma pasta duplicada por engano** no meu processo de
empacotamento — removida e confirmada antes de gerar o zip final.

Não precisa rodar SQL — é ajuste de código só.

**Novo nesta etapa (60) — varredura completa em Finanças, não só o menu:**

Da última vez só troquei a barra de abas. Dessa vez varri **todo o
código de `app/financas`** (não só onde eu lembrava, usei um script
de verdade pra achar qualquer emoji restante) e encontrei mais 5
pontos:

- Ícone de lançamento sem categoria (💰/💸 → setas de tendência, na
  cor certa de receita/despesa)
- Aviso de "lançamento guardado offline" (📦 → ícone de pacote)
- Link "Para onde vai seu dinheiro" (📊 → ícone de gráfico, agora
  num selo colorido, igual o resto do app)
- Mesma correção no Extrato
- Ícone de dica automática na tela de Análise (💡 → lâmpada)

**Bônus:** achei um componente inteiro (`IndicadorSaldo.tsx`) que não
era mais usado em lugar nenhum desde a Etapa 39 — tinha ficado
esquecido lá, com emoji e tudo. Removi em vez de gastar tempo
modernizando ícone que nunca aparece pra ninguém.

**Testei antes de entregar:** confirmei que os 5 ícones novos
existem de verdade na biblioteca, e rodei a varredura de novo depois
das correções — zero emoji restante em `app/financas`.

**O que continua emoji, de propósito:** os ícones que você escolhe
pra cada categoria financeira (🍔 Alimentação, 🏠 Moradia...) — isso é
personalização sua, não "interface do sistema".

**Novo nesta etapa (59) — ícones modernos, no lugar dos emojis "de
interface":**

Adicionei o **Lucide** (biblioteca de ícones usada por apps
modernos de verdade — traço fino, consistente, sem parecer clipart).
Troquei nos lugares mais visíveis:

- **Barra de abas de Finanças** (Início/Contas/Extrato/Mais) + botão
  flutuante de "+"
- **Barra de abas de Hábitos** (Hoje/Hábitos/Tarefas/Categorias/Timer)
- **Tela "Mais" de Finanças** (Categorias, Recorrentes, Análise,
  Personalizar, Exportar, Lixeira)
- **Cabeçalho do painel** (sino de notificação, sol/lua do tema)
- **Notas** (fixar/desafixar, lembrete, avisos de "salvo offline")
- **Tela de Notificações** (navegador, app instalado)

**Testei antes de entregar:** instalei a biblioteca temporariamente e
confirmei que todos os 22 ícones que usei existem de verdade nela —
não quis arriscar um nome errado quebrando o build, igual quase
aconteceu com a versão do Capacitor lá atrás.

**O que ficou de fora, de propósito:** os ícones que você mesmo
escolhe pra cada hábito/categoria/nota (aquele seletor de emoji ao
criar um hábito, por exemplo) continuam emoji — ali faz sentido ser
divertido e colorido, é uma personalização seguida por você, não
"interface do sistema". Se quiser ir além (calendário, gráficos, ou
os emojis de categoria financeira também), me avisa que continuo.

**Novo nesta etapa (58) — lembrete de nota, agora claro:**

Achei a causa da confusão: as notas só tinham um **horário**, sem
nenhum conceito de "qual dia" — na prática, um lembrete de nota
disparava **todo santo dia, pra sempre**, sem opção de ser só uma vez
numa data específica.

Agora, ao ativar o lembrete de uma nota, você escolhe entre:
- **Todo dia** — continua funcionando como antes, dispara sempre
  naquele horário
- **Só numa data** — escolhe o dia certo, e o aviso chega só naquela
  data, uma vez

Cada opção mostra uma frase explicando exatamente o que vai acontecer
("Vai avisar todo dia, sempre nesse horário, até você desmarcar" /
"Vai avisar só uma vez, nessa data e horário").

Não implementei "dias da semana" pras notas (tipo hábitos) —
avaliei que "todo dia" ou "uma data específica" cobre o caso real de
nota bem melhor. Se sentir falta de "toda segunda-feira" pra alguma
nota específica, me avisa que adiciono.

## Rodar o schema desta etapa

No SQL Editor do Supabase, roda `supabase/schema_lembrete_nota_data.sql`
(depois de todos os schemas anteriores).

**Novo nesta etapa (57) — reorganizei a ordem do topo de Finanças:**

- **"Saldo em contas"** agora fica sozinho, numa linha inteira pra ele
  — antes dividia espaço com "Previsto", e o número grande ficava
  cortado com "..."
- **"Previsto p/ fim do mês"** desceu pra **depois** de Receitas/
  Despesas do mês, como você pediu
- Nova ordem: avatares/olho → navegação de mês → Saldo em contas
  (grande, sozinho) → Receitas/Despesas do mês → Previsto pro fim do
  mês (linha fina, embaixo de tudo)

**Bônus que reparei no seu print e já corrigi:** o botão flutuante
"+" estava exatamente em cima dos botões "Editar"/"X" do último
lançamento visível na tela. Dei mais espaço entre ele e a barra de
abas.

**Também achei outra pasta duplicada por engano** no meu processo de
empacotamento (mesmo tipo de coisa que já pegamos antes nesta sessão)
— removida antes de te entregar, confirmei que o zip está limpo.

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (56) — reformulação grande de Finanças, inspirada na
referência que você mandou:**

Os 4 pedaços que você pediu, todos feitos:

1. **Saldo atual x Saldo previsto pro fim do mês** — dois números
   agora, lado a lado. "Saldo em contas" é o que você tem agora de
   verdade; "Previsto p/ fim do mês" soma as receitas/despesas
   recorrentes que ainda vão vencer esse mês. Só aparece no mês
   atual — pra um mês passado não tem nada a "prever", já aconteceu
2. **A tela inteira navega por mês** — as setinhas no topo (e as do
   calendário, que agora são a mesma navegação) mudam saldo do mês,
   receitas, despesas, calendário e gráfico juntos. Aparece "Voltar
   pra hoje" quando você não está no mês atual
3. **Lista de contas com saldo real** — antes só dava pra ver isso
   entrando em Finanças → Contas, e nem mostrava o saldo atual (só o
   inicial). Agora aparece direto na tela principal, com o saldo de
   cada conta calculado de verdade (inicial + todas as receitas e
   despesas dela)
4. **Barra de abas fixa embaixo** (Início / Contas / Extrato / Mais)
   + botão flutuante de novo lançamento — em todas as telas da seção
   de Finanças. A tela "Mais" reúne Categorias, Recorrentes, Análise,
   Personalizar ordem e Exportar CSV, que antes ficavam soltos como
   "links rápidos" na tela principal (removidos de lá agora, pra não
   duplicar navegação)

**Testei antes de entregar:**
- A matemática do saldo previsto (4 cenários: sem recorrência futura,
  com despesa futura, mistura de receita+despesa, recorrência já
  vencida não conta de novo)
- A navegação de mês anterior/próximo, incluindo as duas viradas de
  ano (dezembro→janeiro e janeiro→dezembro do ano anterior)

**Bug que encontrei e corrigi no meio do processo:** o calendário de
gastos ainda usava o nome antigo do parâmetro de mês
(`mesCalendario`) — sem corrigir isso, a navegação de mês pelo
calendário ia parar de funcionar assim que unifiquei tudo num
parâmetro só (`mes`).

**Sendo honesto sobre risco:** essa é uma mudança grande, bem perto
da publicação — testei a lógica mais delicada isoladamente antes de
entregar, mas recomendo você testar com calma antes de gerar o build
final pra Play Store.

Não precisa rodar SQL — é código só.

**Novo nesta etapa (55) — bug de layout corrigido:**

A causa: Receitas e Despesas ficavam lado a lado com um espaçamento
fixo, cada um ocupando só o espaço do próprio texto. Quando um valor
é bem maior que o outro (no seu caso: R$ 5.000,00 x R$ 59.525,00), o
lado maior não tinha garantia de espaço — podia esbarrar no card ou
ficar espremido.

Corrigido: agora Receitas e Despesas ficam em **duas colunas de
largura exatamente igual**, então um valor grande de um lado nunca
mais invade o espaço do outro lado. Também adicionei uma proteção
extra (corta com "..." em vez de quebrar feio) pra qualquer valor
absurdamente grande que ainda assim não coubesse.

Mantive a estrutura geral que você gostou do app de referência — mês
+ olho de ocultar no topo, saldo grande, os 2 círculos coloridos de
receita/despesa — só corrigi a proporção interna deles.

Não precisa rodar SQL — é ajuste visual só.

**Novo nesta etapa (54) — a reta final antes da publicação:**

- **Texto cortado no painel, corrigido** — "Hábitos" e "Notas"
  mostravam "..." no final da frase (a classe `truncate` estava
  cortando). Agora o texto quebra em 2 linhas quando precisar, sem
  cortar nada

- **Telegram removido por completo** — nenhum código, tela, variável
  de ambiente ou referência sobrou. Removi:
  - A tela inteira de vínculo/desconexão na página de Notificações
  - O parser de lançamento por mensagem e o comando "Resumo" (eram
    recursos exclusivos do Telegram — junto com ele, saem também)
  - `lib/telegram/` inteiro, `actions_telegram.ts`,
    `lib/agenda/consultaAdmin.ts` (só existia pro resumo diário do
    Telegram, ficou sem uso)
  - `TELEGRAM_BOT_TOKEN` do `.env.local.example` e do guia de deploy
  - SQL opcional (`schema_remover_telegram.sql`) pra quem quiser
    apagar as tabelas que ficaram sem uso — não é obrigatório rodar

- **Notificação com som garantido** — ajustei tanto o Web Push
  (navegador) quanto a notificação nativa (FCM) pra declarar
  explicitamente `sound: "default"` e vibração, em vez de confiar no
  comportamento padrão "seja lá qual for" de cada aparelho

- **Novo: lembrete de conta a pagar** — se você tem uma conta
  recorrente (Finanças → Recorrentes) vencendo **hoje** ou
  **amanhã**, chega uma notificação automática às 8h da manhã, tipo
  "💳 Você tem uma conta vencendo HOJE: Aluguel — R$ 1.200,00". Usa
  os mesmos 2 canais (Web Push + nativo), sem Telegram

**Bug real que achei e corrigi antes de te entregar:** a tabela que
controla "já mandei esse lembrete hoje" só aceitava os tipos
`habito`, `tarefa`, `nota` — sem ajustar isso, o lembrete de conta a
pagar nunca ficaria marcado como enviado, e a pessoa receberia a
mesma notificação de novo a cada poucos minutos, sem parar. Corrigido
com uma migração SQL.

**Testei antes de entregar:** simulei em Node os cálculos de
"hoje/amanhã" em 4 cenários, incluindo os mais traiçoeiros — virada
de mês (30/09 → 01/10) e virada de ANO (31/12 → 01/01). Todos
passaram.

## Rodar os schemas desta etapa

No SQL Editor do Supabase, roda:
1. `supabase/schema_lembrete_conta_a_pagar.sql` (obrigatório — sem
   isso o lembrete de conta vira spam)
2. `supabase/schema_remover_telegram.sql` (opcional, só se quiser
   apagar as tabelas antigas)

**Novo nesta etapa (53) — sobre a demora de 4-5s na primeira vez em cada tela:**

**Diagnóstico:** o padrão que você descreveu ("primeira vez lento,
depois quase instantâneo, por tela") é a assinatura clássica de
**"cold start"** — a hospedagem do Vercel "desliga" a função de cada
tela depois de um tempo sem uso, e a primeira visita paga o custo de
"ligar" ela de novo. Isso é uma característica de como hospedagem
serverless (sem servidor dedicado ligado o tempo todo) funciona — não
é um bug específico nosso, mas dá pra melhorar o quanto isso pesa.

**O que corrigi (gratuito):** achei que 4 telas (Painel, Finanças,
Contas, Perfil) carregavam o SDK inteiro da Amazon/Cloudflare (usado
pra gerar links de foto) mesmo quando **a maioria das vezes nem
precisava dele de verdade** (quem não tem foto customizada, ou usa a
do Google, nunca usa essa parte do código). Agora esse SDK só é
carregado de verdade quando realmente vai ser usado — deixa essas 4
telas mais leves de carregar na primeira vez.

Também conferi que o SDK do Firebase (usado nas notificações) já
estava isolado corretamente, só na rota do agendador — não pesava
nas telas do usuário.

**Sobre pagar — resposta honesta:** o plano **Vercel Pro (~US$
20/mês)** ajuda a reduzir esse "esfriamento" das funções (mais
capacidade de manter tudo "aquecido"), mas **não elimina completamente**
esse comportamento — é uma característica de como hospedagem
serverless funciona, paga ou grátis. Não é algo que eu recomendaria
pagar só por causa desses 4-5 segundos, a não ser que o app cresça
muito em uso e isso vire uma reclamação de várias pessoas, não só
sua ao testar.

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
52. Painel principal travado (sem rolagem)
53. Carregamento preguiçoso do SDK da AWS
54. Notificações nativas sem Telegram + lembrete de conta a pagar
55. Layout Receitas/Despesas corrigido
56. Finanças reformulada (saldo previsto, navegação por mês, contas, abas)
57. Ordem do hero corrigida (saldo em cima, sozinho)
58. Lembrete de nota com data clara
59. Ícones de verdade (Lucide) no lugar dos emojis de interface
60. Varredura completa de emoji em Finanças
61. Removida duplicação de consultas em Finanças
62. Auditoria completa de performance
63. Ícones de categoria modernizados (73 opções)
64. Módulo de Notas removido
65. Teste de lembretes direto pela URL
66. Rota de lembretes sem cache + modo de depuração
67. Bug real do fuso horário corrigido
68. Conta de investimento separada do saldo
69. Log real de falhas no envio de notificação
70. 4 bugs reais corrigidos (categorias, voltar, extrato)
71. Removido cron redundante do Vercel
72. Notificações confirmadas funcionando + limpeza
73. Gráficos sem cortar + tipo de gráfico + comparação mensal + valor com centavo automático
74. 3 bugs reais corrigidos (extrato, editar lançamento, espaçamento)
75. (sem mudanças de código — investigação/confirmação de cache)
76. (sem mudanças de código — investigação/confirmação de cache)
77. Cache travando telas de editar (causa real)
78. Excluir conta direto, sem precisar da lixeira
79. Layout de desktop (menu lateral + colunas)
80. Ícone do app trocado (trilho)
81. Notificação única + ícones de hábitos modernizados
82. Resumo semanal de hábitos + dicas automáticas
83. Desktop em todas as sub-telas
84. Timer também ajustado pro desktop
85. Lançamento duplicado corrigido (clique duplo)
86. Domínio novo no app nativo (capacitor.config.ts)
87. (sem mudanças de código — investigação de notificação/cron após troca de domínio)
88. Formulários com ícone mais largos no desktop
89. Alarme na tela (reforço, independente do push)
90. Ícone próprio no "badge" da notificação
91. (sem mudanças de código — resolução final da notificação)
92. Campo de observações nas tarefas 🎉
93. Aviso de orçamento estourado + metas de economia
94. Fatura de cartão de crédito de verdade
95. Importar extrato do banco (OFX/CSV)
96. Dividir despesa entre pessoas
97. Patrimônio líquido ao longo do tempo 🎉
98. Sequência visível + conquistas + nota rápida (Hábitos) — **você está aqui**

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
