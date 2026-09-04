# Deploy no Vercel — Guia Consolidado

Depois de 18 etapas, tem bastante coisa acumulada. Esse arquivo junta
tudo num só lugar, na ordem certa, pra você não precisar caçar em
17 READMEs diferentes.

## 1. Rodar todos os SQLs no Supabase (nessa ordem)

Se você já rodou alguns desses antes, pode pular — cada um é seguro
de rodar de novo (usa `if not exists` / `create or replace`).

No SQL Editor do Supabase, em **New query**, um de cada vez:

1. `schema.sql`
2. `schema_habitos.sql`
3. `schema_notas.sql`
4. `schema_financas.sql`
5. `schema_compartilhamento.sql`
6. `schema_agenda.sql`
7. `schema_etapa7.sql`
8. `schema_etapa8.sql`
9. `schema_etapa9.sql`
10. `schema_seguranca.sql`
11. `schema_planejador.sql`
12. `schema_telegram.sql`
13. `schema_dashboard.sql`
14. `schema_editar_transacao.sql`
15. `schema_auditoria.sql`
16. `schema_categorias_visuais.sql`
17. `schema_casal.sql`
18. `schema_perfil_google.sql`
19. `schema_categorias_padrao_v2.sql`
20. `schema_ordem_blocos.sql`
21. `schema_fcm.sql`
22. `schema_lembrete_conta_a_pagar.sql`
23. `schema_remover_telegram.sql` (opcional)

Dica: seleciona todos os arquivos de uma vez no seu editor de código,
copia o conteúdo de cada um e cola em queries separadas — é mais rápido
que abrir um por um.

## 2. Colocar o código no GitHub

Se ainda não fez isso:

```bash
git init
git add .
git commit -m "VidaTrack"
```

Cria um repositório novo (privado, se preferir) no GitHub, e sobe:

```bash
git remote add origin https://github.com/SEU-USUARIO/vidatrack.git
git push -u origin main
```

## 3. Importar no Vercel

1. Entra em [vercel.com](https://vercel.com), **Add New > Project**
2. Escolhe o repositório que você acabou de subir
3. **Antes de clicar em Deploy**, vai em **Environment Variables** e
   cola todas as variáveis da tabela abaixo

## 4. Variáveis de ambiente — todas, num lugar só

| Variável | Onde conseguir | Obrigatória? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | A URL que o Vercel vai te dar (ex: `https://vidatrack.vercel.app`) — dá pra editar depois do 1º deploy, quando souber a URL final | Sim |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > service_role (Reveal) | Sim |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npm run gerar-chaves-vapid` (local) | Só se for usar notificação push |
| `VAPID_PRIVATE_KEY` | mesmo comando acima | Só se for usar notificação push |
| `CRON_SECRET` | Você inventa (string aleatória longa) | Só se for usar lembretes automáticos |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase Console > Configurações > Contas de serviço (veja o passo a passo no README) | Só se for usar notificação push nativa no app publicado |
| `TIMEZONE_OFFSET_HORAS` | `-3` pra Brasília | Só se for usar lembretes automáticos |
| `R2_ACCOUNT_ID` | Painel Cloudflare R2 | Sim, se for usar anexos em Notas |
| `R2_ACCESS_KEY_ID` | Painel Cloudflare R2 | Sim, se for usar anexos em Notas |
| `R2_SECRET_ACCESS_KEY` | Painel Cloudflare R2 | Sim, se for usar anexos em Notas |
| `R2_BUCKET_NAME` | O nome que você deu ao bucket | Sim, se for usar anexos em Notas |

**Nenhuma dessas variáveis pode ter o prefixo `NEXT_PUBLIC_` exceto as
que já estão assim na tabela** — colocar esse prefixo em qualquer
outra expõe o valor no navegador.

## 5. Depois do primeiro deploy

1. Copia a URL que o Vercel gerou (ex: `https://vidatrack-seu-usuario.vercel.app`)
2. Volta em **Settings > Environment Variables** e atualiza
   `NEXT_PUBLIC_SITE_URL` com essa URL real
3. No Google Cloud Console, adiciona essa mesma URL nas origens
   autorizadas do OAuth (se for usar login com Google)
4. No Supabase, em **Authentication > URL Configuration**, atualiza
   a **Site URL** pra essa URL também
5. Clica em **Redeploy** no Vercel pra aplicar a mudança de variável

## 6. Configurar o agendador externo (se for usar lembretes)

Só depois de ter a URL final: siga o passo a passo já existente no
README principal, seção "Configurar o Telegram" / "Configurar
notificações push", trocando `SEU-PROJETO.vercel.app` pela URL real.

## 7. Testar

Checklist rápido depois do deploy:
- [ ] Login por e-mail funciona
- [ ] Login com Google funciona (se configurado)
- [ ] Criar um hábito, uma nota e um lançamento financeiro
- [ ] Abrir pelo celular e ver se aparece o convite pra instalar como app
- [ ] Se configurou lembretes: esperar um lembrete de teste chegar

## Sobre o aviso de "instalar como app" (Etapa 18)

Agora, ao abrir o VidaTrack pelo celular (fora das telas de
login/cadastro), aparece um banner sugerindo instalar como app —
funciona diferente por causa de limitações de cada sistema:

- **Android/Chrome:** botão "Instalar" que dispara o prompt nativo do
  próprio Android
- **iPhone/Safari:** a Apple não permite iniciar a instalação
  programaticamente, então o banner mostra o passo a passo manual
  (Compartilhar > Adicionar à Tela de Início)

Se a pessoa dispensar o banner, ele não aparece de novo por 10 dias.
