-- Criar a tabela user_profiles
create table public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.user_profiles enable row level security;

-- Política para visualizar usuários
create policy "Usuários podem ver todos os perfis" on public.user_profiles
  for select using (true);

-- Política para criar perfil
create policy "Usuários podem criar seu próprio perfil" on public.user_profiles
  for insert with check (auth.uid() = user_id);

-- Política para atualizar perfil
create policy "Apenas admins podem atualizar perfis" on public.user_profiles
  for update using (
    exists (
      select 1 from public.user_profiles where user_id = auth.uid() and role = 'admin'
    )
  );

-- Política para deletar perfil
create policy "Apenas admins podem deletar perfis" on public.user_profiles
  for delete using (
    exists (
      select 1 from public.user_profiles where user_id = auth.uid() and role = 'admin'
    )
  );

-- Trigger para verificar limite de usuários
create or replace function public.check_user_limit()
returns trigger as $$
begin
  if (select count(*) from public.user_profiles) >= 5 then
    raise exception 'Limite de 5 usuários atingido';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger check_user_limit_trigger
  before insert on public.user_profiles
  for each row
  execute procedure public.check_user_limit();

-- Trigger para definir primeiro usuário como admin
create or replace function public.set_first_user_as_admin()
returns trigger as $$
begin
  if (select count(*) from public.user_profiles) = 0 then
    new.role := 'admin';
  else
    new.role := 'user';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger set_first_user_as_admin_trigger
  before insert on public.user_profiles
  for each row
  execute procedure public.set_first_user_as_admin();

-- Função para deletar usuário quando o perfil for removido
create or replace function public.handle_deleted_user()
returns trigger as $$
begin
  if exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin'
  ) then
    delete from auth.users where id = old.user_id;
  end if;
  return old;
end;
$$ language plpgsql security definer;

create trigger on_profile_deleted
  after delete on public.user_profiles
  for each row
  execute procedure public.handle_deleted_user();
