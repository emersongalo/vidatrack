-- ========================================================
-- VidaTrack — Etapa 68: conta do tipo "Investimento"
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

alter table public.financa_contas drop constraint if exists financa_contas_tipo_check;
alter table public.financa_contas
  add constraint financa_contas_tipo_check
  check (tipo in ('carteira', 'banco', 'cartao', 'investimento'));

-- Categoria especial, criada automaticamente pra cada usuário, usada
-- nas transferências pra investimento (assim elas aparecem
-- identificadas no extrato, em vez de "sem categoria").
insert into public.financa_categorias (dono_id, nome, tipo, icone, cor)
select id, 'Investimento', 'despesa', 'PiggyBank', 'financa'
from auth.users u
where not exists (
  select 1 from public.financa_categorias c
  where c.dono_id = u.id and c.nome = 'Investimento' and c.tipo = 'despesa'
);

-- Pra quem se cadastrar de agora em diante, a categoria já vem junto
-- com as outras padrão.
create or replace function public.criar_categorias_padrao(p_usuario_id uuid)
returns void as $$
begin
  insert into public.financa_categorias (dono_id, nome, tipo, icone, cor) values
    (p_usuario_id, 'Salário', 'receita', 'Briefcase', 'habito'),
    (p_usuario_id, 'Outras receitas', 'receita', 'Sparkles', 'habito'),
    (p_usuario_id, 'Alimentação', 'despesa', 'Utensils', 'financa'),
    (p_usuario_id, 'Moradia', 'despesa', 'Home', 'financa'),
    (p_usuario_id, 'Transporte', 'despesa', 'Car', 'financa'),
    (p_usuario_id, 'Lazer', 'despesa', 'Film', 'financa'),
    (p_usuario_id, 'Saúde', 'despesa', 'HeartPulse', 'financa'),
    (p_usuario_id, 'Investimento', 'despesa', 'PiggyBank', 'financa'),
    (p_usuario_id, 'Outras despesas', 'despesa', 'Package', 'financa')
  on conflict do nothing;
end;
$$ language plpgsql security definer;
