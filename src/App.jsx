-- CSP RELEASE 52 - Fatture provvigioni amministratori
-- Tabella dedicata alle fatture trimestrali delle provvigioni amministratori
-- con collegamento ad amministratore e azienda fornitore.

create table if not exists public.fatture_provvigioni_amministratori (
  id bigserial primary key,
  amministratore_email text not null,
  azienda_partner_id bigint references public.aziende_partner(id),
  numero_fattura text,
  trimestre text,
  anno integer not null default extract(year from current_date)::integer,
  data_fattura date not null default current_date,
  importo_imponibile numeric(12,2) not null default 0,
  iva numeric(5,2) not null default 0,
  totale numeric(12,2) not null default 0,
  stato text not null default 'da_pagare',
  file_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fatture_provvigioni_amministratori_stato_check check (
    stato in ('da_pagare', 'pagata', 'annullata')
  )
);

create index if not exists fatture_provvigioni_amministratori_email_idx
on public.fatture_provvigioni_amministratori (lower(amministratore_email));

create index if not exists fatture_provvigioni_amministratori_azienda_idx
on public.fatture_provvigioni_amministratori (azienda_partner_id);

create index if not exists fatture_provvigioni_amministratori_stato_idx
on public.fatture_provvigioni_amministratori (stato);

grant select, insert, update, delete on table public.fatture_provvigioni_amministratori to authenticated;
grant select, insert, update, delete on table public.fatture_provvigioni_amministratori to service_role;
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;

alter table public.fatture_provvigioni_amministratori enable row level security;

drop policy if exists fatture_provvigioni_amministratori_all_gestore on public.fatture_provvigioni_amministratori;
drop policy if exists fatture_provvigioni_amministratori_select_admin on public.fatture_provvigioni_amministratori;

create policy fatture_provvigioni_amministratori_all_gestore
on public.fatture_provvigioni_amministratori
for all
to authenticated
using (
  exists (
    select 1
    from public.utenti u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
      and lower(coalesce(u.ruolo, '')) = 'gestore'
  )
)
with check (
  exists (
    select 1
    from public.utenti u
    where lower(u.email) = lower(auth.jwt() ->> 'email')
      and lower(coalesce(u.ruolo, '')) = 'gestore'
  )
);

create policy fatture_provvigioni_amministratori_select_admin
on public.fatture_provvigioni_amministratori
for select
to authenticated
using (
  lower(amministratore_email) = lower(auth.jwt() ->> 'email')
);
