-- ========================================================
-- VidaTrack — Etapa 26: compartilhamento entre casal/família
-- Rode isso no SQL Editor do seu projeto Supabase
-- (depois de todos os schemas anteriores)
-- ========================================================

-- A política original de `perfis` (Etapa 1) só deixa cada pessoa ver
-- o PRÓPRIO nome — o que faria os recursos novos desta etapa (mostrar
-- "quem lançou" nas finanças, e o nome de cada participante num hábito
-- compartilhado) sempre aparecerem como "Alguém" ou vazio, mesmo com
-- os dados certos no código.
--
-- Esta política adiciona: você também pode ver o nome de qualquer
-- pessoa com quem você tenha uma relação de compartilhamento (seja
-- porque você convidou ela, ou porque ela te convidou). Continua sem
-- expor nome de gente aleatória — só de quem já compartilha algo com
-- você de propósito.
create policy "usuário vê o nome de quem compartilha algo com ele"
  on public.perfis for select
  using (
    exists (
      select 1 from public.compartilhamentos c
      where (c.dono_id = perfis.id and c.usuario_convidado_id = auth.uid())
         or (c.usuario_convidado_id = perfis.id and c.dono_id = auth.uid())
    )
  );
