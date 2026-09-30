-- Artes de moldura por candidato; aplicar antes de publicar o novo formulário.
alter table public.candidates
  add column if not exists frame_circle_url text,
  add column if not exists frame_square_url text,
  add column if not exists frame_background_url text,
  add column if not exists frame_background_color text not null default '#075b3b',
  add column if not exists frame_text_color text not null default '#ffffff',
  add column if not exists frame_font_family text not null default 'Arial',
  add column if not exists frame_font_size integer not null default 64;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('candidate-frames', 'candidate-frames', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "candidate frame admin upload" on storage.objects;
create policy "candidate frame admin upload" on storage.objects for insert to authenticated
with check (bucket_id = 'candidate-frames' and exists (
  select 1 from public.admin_profiles p where p.id = (select auth.uid()) and p.role = 'admin'
));
