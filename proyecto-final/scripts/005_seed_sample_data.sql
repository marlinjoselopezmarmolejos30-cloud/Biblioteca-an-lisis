-- Seed sample data for demonstration

-- First, ensure categories exist with proper data
INSERT INTO categories (id, name, slug, color, description, created_at)
VALUES 
  (gen_random_uuid(), 'Filosofía', 'filosofia', '#9333ea', 'Análisis sobre pensamiento filosófico, ética y metafísica', now()),
  (gen_random_uuid(), 'Ciencia', 'ciencia', '#0ea5e9', 'Descubrimientos científicos y análisis de investigaciones', now()),
  (gen_random_uuid(), 'Historia', 'historia', '#f59e0b', 'Análisis históricos y lecciones del pasado', now()),
  (gen_random_uuid(), 'Política', 'politica', '#ef4444', 'Análisis político y geopolítica mundial', now()),
  (gen_random_uuid(), 'Economía', 'economia', '#22c55e', 'Tendencias económicas y análisis financiero', now()),
  (gen_random_uuid(), 'Tecnología', 'tecnologia', '#3b82f6', 'Innovación tecnológica y su impacto en la sociedad', now()),
  (gen_random_uuid(), 'Arte', 'arte', '#ec4899', 'Análisis artístico y cultural', now()),
  (gen_random_uuid(), 'Literatura', 'literatura', '#8b5cf6', 'Análisis literario y crítica de obras', now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  description = EXCLUDED.description;

-- Create a sample series
INSERT INTO series (id, title, slug, description, cover_url, sort_order, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Fundamentos del Pensamiento Crítico',
  'pensamiento-critico',
  'Una serie completa sobre cómo desarrollar el pensamiento crítico y analítico',
  NULL,
  1,
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample documents with actual content_url (using placeholder URL)
INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'La Naturaleza del Conocimiento: Un Análisis Epistemológico',
  'naturaleza-conocimiento-epistemologia',
  'Un profundo análisis sobre qué es el conocimiento, cómo lo adquirimos y cuáles son sus límites según las principales corrientes filosóficas.',
  '/content/filosofia-epistemologia.html',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['epistemología', 'filosofía', 'conocimiento'],
  'published',
  true,
  156,
  12,
  now() - interval '2 days',
  now() - interval '5 days',
  now()
FROM categories c WHERE c.slug = 'filosofia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'Inteligencia Artificial: Presente y Futuro',
  'inteligencia-artificial-presente-futuro',
  'Exploramos el estado actual de la IA, sus aplicaciones más revolucionarias y hacia dónde se dirige esta tecnología transformadora.',
  '/content/ia-presente-futuro.html',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['IA', 'tecnología', 'futuro', 'machine learning'],
  'published',
  true,
  243,
  15,
  now() - interval '1 day',
  now() - interval '3 days',
  now()
FROM categories c WHERE c.slug = 'tecnologia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'El Colapso de los Imperios: Lecciones de la Historia',
  'colapso-imperios-lecciones',
  'Un análisis comparativo de cómo cayeron los grandes imperios de la historia y qué podemos aprender de estos eventos.',
  '/content/colapso-imperios.html',
  'https://images.unsplash.com/photo-1461360370896-922624d12a74?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['imperios', 'caída', 'roma', 'historia'],
  'published',
  false,
  89,
  20,
  now() - interval '4 days',
  now() - interval '7 days',
  now()
FROM categories c WHERE c.slug = 'historia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'Economía del Siglo XXI: Nuevos Paradigmas',
  'economia-siglo-xxi-paradigmas',
  'Analizamos las nuevas teorías económicas y cómo están redefiniendo nuestra comprensión de los mercados globales.',
  '/content/economia-paradigmas.html',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['economía', 'mercados', 'globalización'],
  'published',
  false,
  67,
  18,
  now() - interval '3 days',
  now() - interval '6 days',
  now()
FROM categories c WHERE c.slug = 'economia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'La Física Cuántica Explicada',
  'fisica-cuantica-explicada',
  'Una introducción accesible al fascinante mundo de la mecánica cuántica y sus implicaciones para nuestra comprensión del universo.',
  '/content/fisica-cuantica.html',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['física', 'cuántica', 'ciencia', 'universo'],
  'published',
  true,
  312,
  25,
  now() - interval '5 hours',
  now() - interval '2 days',
  now()
FROM categories c WHERE c.slug = 'ciencia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO documents (
  id, title, slug, description, content_url, cover_url, 
  category_id, series_id, series_order, tags, status, 
  is_featured, view_count, estimated_read_time, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  'Geopolítica Actual: El Nuevo Orden Mundial',
  'geopolitica-nuevo-orden-mundial',
  'Análisis de las dinámicas de poder actuales entre las grandes potencias y cómo están redefiniendo el orden internacional.',
  '/content/geopolitica-orden.html',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
  c.id,
  NULL,
  NULL,
  ARRAY['geopolítica', 'poder', 'internacional'],
  'published',
  false,
  145,
  22,
  now() - interval '6 days',
  now() - interval '10 days',
  now()
FROM categories c WHERE c.slug = 'politica'
ON CONFLICT (slug) DO NOTHING;
