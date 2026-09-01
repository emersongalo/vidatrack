# VidaTrack — Etapa 23: Trava de Zoom + Ícone Corrigido

App único de **hábitos**, **notas** e **finanças**, com telas próprias por
módulo e compartilhamento entre usuários. Stack: **Next.js** (Vercel),
**Supabase** (banco + autenticação) e **Cloudflare R2** (arquivos e fotos
das Notas).

## O que já está pronto

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
24. Trava de zoom + ícone corrigido — **você está aqui**

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
