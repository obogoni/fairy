-- migrate:up

-- Roles (door 2). Created without login and without a password: the repository is public
-- (ADR 0012). Each environment enables login and sets the password outside the repo.
-- Roles are cluster-wide, so creation is skipped when the role already exists.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'fairy_app') then
    create role fairy_app nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'fairy_admin') then
    create role fairy_admin nologin;
  end if;
end
$$;

-- Tables (door 1). The Tenant slice adds columns to tenants and drops greetings.
create table tenants (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table greetings (
  id uuid primary key,
  tenant_id uuid not null references tenants (id),
  message text not null check (char_length(message) between 1 and 200),
  unique (tenant_id, id)
);

-- Tenant isolation (door 3). nullif: on a pooled connection, a setting a past transaction set
-- locally reads '' afterwards, and ''::uuid would throw instead of matching nothing.
alter table tenants enable row level security;
alter table tenants force row level security;
create policy tenant_isolation on tenants
  using (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table greetings enable row level security;
alter table greetings force row level security;
create policy tenant_isolation on greetings
  using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

grant usage on schema public to fairy_app, fairy_admin;
grant select on tenants to fairy_app;
grant select, insert, update, delete on greetings to fairy_app;

-- migrate:down
