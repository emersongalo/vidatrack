-- ========================================================
-- VidaTrack — Etapa 11: correções de segurança (auditoria RLS)
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- ========================================================
-- ACHADO 1 (grave): um colaborador com permissão de "edição" num
-- hábito/nota/conta compartilhado conseguia trocar o campo dono_id
-- via UPDATE, efetivamente roubando a posse do item. Isso acontecia
-- porque a política de UPDATE usava só `USING`, e a condição
-- `tem_acesso_item(...)` não depende do dono_id — só do id do item,
-- que não muda numa atualização comum.
--
-- Correção: dono_id passa a ser imutável (nem o próprio dono consegue
-- mudar — não há necessidade de "transferir posse" no app hoje).
-- ========================================================

create or replace function public.impedir_troca_de_dono()
returns trigger as $$
begin
  if new.dono_id is distinct from old.dono_id then
    raise exception 'não é permitido alterar o dono deste item';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trava_dono_habitos on public.habitos;
create trigger trava_dono_habitos
  before update on public.habitos
  for each row execute procedure public.impedir_troca_de_dono();

drop trigger if exists trava_dono_notas on public.notas;
create trigger trava_dono_notas
  before update on public.notas
  for each row execute procedure public.impedir_troca_de_dono();

drop trigger if exists trava_dono_financa_contas on public.financa_contas;
create trigger trava_dono_financa_contas
  before update on public.financa_contas
  for each row execute procedure public.impedir_troca_de_dono();

drop trigger if exists trava_dono_tarefas on public.tarefas;
create trigger trava_dono_tarefas
  before update on public.tarefas
  for each row execute procedure public.impedir_troca_de_dono();

drop trigger if exists trava_dono_financa_recorrencias on public.financa_recorrencias;
create trigger trava_dono_financa_recorrencias
  before update on public.financa_recorrencias
  for each row execute procedure public.impedir_troca_de_dono();

-- ========================================================
-- ACHADO 2 (grave): a função buscar_usuario_por_email era chamável
-- diretamente por QUALQUER usuário logado via API do Supabase,
-- mesmo sem passar pelo nosso app — permitindo descobrir se um
-- e-mail arbitrário tem conta no VidaTrack (enumeração de e-mails,
-- útil pra phishing/spam direcionado).
--
-- Correção: só o servidor (com a chave de serviço) pode chamar essa
-- função agora. O app já foi atualizado para usar o cliente
-- administrativo nesse ponto específico.
-- ========================================================

revoke execute on function public.buscar_usuario_por_email(text) from public, anon, authenticated;
grant execute on function public.buscar_usuario_por_email(text) to service_role;

-- A função nome_do_usuario tinha o mesmo problema (expõe nome/e-mail
-- de qualquer usuário por ID) e não está sendo usada em nenhuma tela
-- hoje. Aplicamos a mesma trava por precaução.
revoke execute on function public.nome_do_usuario(uuid) from public, anon, authenticated;
grant execute on function public.nome_do_usuario(uuid) to service_role;

-- ========================================================
-- ACHADO 3 (baixo risco, mas fácil de reforçar): a tabela de
-- analytics aceitava inserções de QUALQUER um, inclusive sem login,
-- sem limite de tamanho no texto. Um script malicioso batendo nessa
-- rota sem parar poderia inflar o banco (o plano gratuito do
-- Supabase tem teto de armazenamento). Adicionamos uma trava de
-- tamanho no próprio banco, além da que já existe no código do app.
-- ========================================================

alter table public.analytics_eventos
  drop constraint if exists analytics_eventos_pagina_tamanho;
alter table public.analytics_eventos
  add constraint analytics_eventos_pagina_tamanho check (char_length(pagina) <= 200);

-- Sugestão de manutenção periódica (rode manualmente de vez em quando,
-- ou agende junto com o cron de lembretes): apaga eventos com mais de
-- 90 dias, pra manter a tabela pequena.
-- delete from public.analytics_eventos where criado_em < now() - interval '90 days';
