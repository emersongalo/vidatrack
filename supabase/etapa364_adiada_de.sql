-- Etapa 364 (ja aplicado no banco): data original da conta fixa adiada
alter table public.financa_transacoes add column if not exists adiada_de date;
