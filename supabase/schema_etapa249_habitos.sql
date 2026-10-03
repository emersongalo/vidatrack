-- Etapa 249 — já aplicado no Supabase (fica aqui de registro)
alter table public.habitos
  add column if not exists economia_dia numeric(10,2) check (economia_dia is null or economia_dia >= 0),
  add column if not exists depois_de uuid references public.habitos(id) on delete set null;
comment on column public.habitos.economia_dia is 'Etapa 249: hábito de parar — quanto economiza por dia limpo';
comment on column public.habitos.depois_de is 'Etapa 249: encadear — fazer logo depois deste hábito';
