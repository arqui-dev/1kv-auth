-- 20250202090010_seed_products.sql
-- Seed initial products for 1000 Videos access control

begin;

insert into public.products (slug, name, description, is_bundle, bundle_items, metadata)
values
  ('1kv_videos', 'Gerador de Vídeos', 'Automação principal para criação de vídeos faceless.', false, '{}', '{"category": "core"}'),
  ('1kv_narration', 'Narração com IA', 'Geração de narrações com IA e ajustes de voz.', false, '{}', '{"category": "addon"}'),
  ('1kv_captions', 'Legendas Automáticas', 'Criação e sincronização de legendas.', false, '{}', '{"category": "addon"}'),
  ('bundle_complete', 'Pacote Completo', 'Inclui gerador de vídeos, narração e legendas.', true, '{1kv_videos,1kv_narration,1kv_captions}', '{"category": "bundle"}')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_bundle = excluded.is_bundle,
  bundle_items = excluded.bundle_items,
  metadata = coalesce(public.products.metadata, '{}'::jsonb) || excluded.metadata,
  updated_at = now();

commit;
