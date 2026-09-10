-- 代码实验室：作品表
create table if not exists public.code_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  file_url text not null,
  file_path text default '',
  tags text default '',
  sort_order int default 0,
  is_active boolean default true,
  view_count int default 0,
  created_at timestamptz default now()
);

alter table public.code_projects enable row level security;

drop policy if exists "公开读取 code_projects" on public.code_projects;
create policy "公开读取 code_projects" on public.code_projects
  for select using (true);

-- 刷新 PostgREST schema cache
notify pgrst, 'reload schema';
