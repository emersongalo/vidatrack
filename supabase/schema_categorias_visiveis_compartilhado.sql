-- Etapa 151 — permite ENXERGAR (só leitura) a categoria de quem
-- compartilha uma conta financeira com você. Antes, cada categoria
-- era 100% travada pro dono (nem o parceiro numa conta compartilhada
-- via) — na prática isso fazia todo lançamento feito pela outra
-- pessoa aparecer como "Sem categoria" pra você, mesmo tendo
-- categoria certinha.
--
-- Continua igual: só o dono cria, edita ou apaga as PRÓPRIAS
-- categorias. Isso só abre a LEITURA pra quem compartilha pelo menos
-- uma conta financeira com o dono dela, em qualquer direção.

-- Função auxiliar: existe algum compartilhamento de CONTA financeira
-- (em qualquer direção) entre o usuário atual e p_outro_usuario_id?
create or replace function public.compartilha_financas_com(p_outro_usuario_id uuid)
returns boolean as $$
  select exists (
    -- Eu sou dono de uma conta e compartilhei com essa pessoa
    select 1
    from public.financa_contas fc
    join public.compartilhamentos c
      on c.tipo_item = 'financa' and c.item_id = fc.id
    where fc.dono_id = auth.uid()
      and c.usuario_convidado_id = p_outro_usuario_id
    union
    -- Essa pessoa é dona de uma conta e compartilhou comigo
    select 1
    from public.financa_contas fc
    join public.compartilhamentos c
      on c.tipo_item = 'financa' and c.item_id = fc.id
    where fc.dono_id = p_outro_usuario_id
      and c.usuario_convidado_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "dono gerencia suas categorias" on public.financa_categorias;

create policy "dono ou quem compartilha finanças com ele vê a categoria"
  on public.financa_categorias for select
  using (auth.uid() = dono_id or public.compartilha_financas_com(dono_id));

create policy "só o dono cria categoria"
  on public.financa_categorias for insert
  with check (auth.uid() = dono_id);

create policy "só o dono atualiza a categoria"
  on public.financa_categorias for update
  using (auth.uid() = dono_id)
  with check (auth.uid() = dono_id);

create policy "só o dono remove a categoria"
  on public.financa_categorias for delete
  using (auth.uid() = dono_id);
