# Auditoria de Segurança — Etapa 11

Revisão de todas as políticas de RLS (Row Level Security) e funções do
banco criadas nas Etapas 1 a 10. Resumo executivo: **2 achados graves,
1 de baixo risco**, todos corrigidos nesta etapa.

## 🔴 Achado 1 — Sequestro de posse via UPDATE (grave)

**Onde:** `habitos`, `notas`, `financa_contas`, `tarefas`,
`financa_recorrencias`

**O problema:** as políticas de UPDATE dessas tabelas permitiam que
o dono OU um convidado com permissão de "edição" atualizasse a linha.
Mas nada impedia que esse convidado, numa requisição manual (fora do
app normal), alterasse o próprio campo `dono_id` — efetivamente se
tornando o dono do item, ou atribuindo a posse a outra pessoa.

**Como alguém exploraria isso:** um colaborador com acesso de edição a
um hábito compartilhado poderia, usando o token da própria conta
direto na API do Supabase (sem passar pela interface do app),
enviar um UPDATE trocando `dono_id` pro próprio ID. A partir daí, ele
vira "dono" e pode até remover o compartilhamento com o dono original.

**Correção:** um gatilho (`impedir_troca_de_dono`) em cada uma dessas
tabelas, que bloqueia qualquer UPDATE que tente mudar `dono_id` —
mesmo o próprio dono não consegue mudar (não há necessidade disso no
app hoje).

## 🔴 Achado 2 — Vazamento de e-mails cadastrados (grave)

**Onde:** função `buscar_usuario_por_email`

**O problema:** essa função foi criada pra, no fluxo de convite,
descobrir se o e-mail convidado já tem conta. Mas por padrão, toda
função do Postgres pode ser chamada por qualquer papel (`anon`,
`authenticated`) via a API do Supabase — não só pelo nosso código.
Isso significa que **qualquer pessoa logada no VidaTrack** podia abrir
o DevTools do navegador, pegar o próprio token de acesso, e chamar essa
função diretamente pra descobrir se um e-mail arbitrário (o de um
ex-parceiro, um colega, etc.) tem conta no app.

**Correção:** revogamos a permissão de chamar essa função de `anon` e
`authenticated`, deixando só o papel `service_role` (usado
exclusivamente pelo nosso servidor, nunca exposto ao navegador). O
código do convite foi atualizado pra usar o cliente administrativo
nesse ponto específico.

Apliquei a mesma correção preventiva na função `nome_do_usuario`, que
tinha o mesmo problema (embora não estivesse sendo usada em nenhuma
tela ainda).

## 🟡 Achado 3 — Tabela de analytics sem limite (baixo risco)

**Onde:** `analytics_eventos`

**O problema:** a rota que registra eventos anônimos aceita
requisições de qualquer um, sem exigir login (é assim de propósito,
pra registrar visitas de quem ainda nem se cadastrou). Mas isso também
significa que um script malicioso batendo nessa rota sem parar
poderia, com tempo, inflar a tabela e consumir o espaço gratuito do
Supabase.

**Correção:** adicionei uma trava direto no banco limitando o tamanho
do campo (mesmo que alguém contorne a validação do código do app), e
deixei uma sugestão de limpeza periódica no schema. Não é um risco
grave — mais uma questão de "boa prática" do que uma vulnerabilidade
de fato.

## Não são problemas (verificado e descartado)

- **`tem_acesso_item` ser chamável publicamente:** revela só um
  verdadeiro/falso de "eu tenho acesso a esse item", nada sensível —
  e essa função precisa continuar acessível pra `authenticated` porque
  as próprias políticas de RLS dependem dela internamente.
- **UPDATE em `financa_transacoes`:** não existe política de UPDATE
  pra essa tabela — e não deveria, já que o app não tem uma função de
  "editar lançamento" (só criar e excluir). Se um dia essa função for
  adicionada, é importante lembrar de aplicar o mesmo gatilho de
  proteção de `dono_id` também aqui.

## O que rodar

No SQL Editor do Supabase, rode `supabase/schema_seguranca.sql` (depois
de todos os schemas anteriores). Não deleta nem altera nenhum dado
existente — só adiciona travas.
