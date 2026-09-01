-- ========================================================
-- VidaTrack — Etapa 17: editar lançamento financeiro
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- A tabela financa_transacoes tinha INSERT/SELECT/DELETE, mas nunca
-- teve UPDATE — a Etapa 11 (auditoria de segurança) já tinha
-- identificado isso como pendência, documentado como "se um dia
-- adicionar edição, lembre de aplicar a mesma trava de dono_id".
-- Chegou a hora.

create policy "dono ou convidado com edição atualiza o lançamento"
  on public.financa_transacoes for update
  using (
    exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, false))
    )
  )
  with check (
    exists (
      select 1 from public.financa_contas c
      where c.id = conta_id
        and (c.dono_id = auth.uid() or public.tem_acesso_item('financa', c.id, false))
    )
  );

-- Mesma trava de "não pode trocar o dono" aplicada nas outras tabelas
-- compartilháveis desde a Etapa 11.
drop trigger if exists trava_dono_financa_transacoes on public.financa_transacoes;
create trigger trava_dono_financa_transacoes
  before update on public.financa_transacoes
  for each row execute procedure public.impedir_troca_de_dono();
