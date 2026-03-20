-- =============================================
-- DATOS INICIALES / SEED DATA
-- =============================================

-- Insertar categorias por defecto
INSERT INTO public.categories (name, slug, color, description) VALUES
  ('Filosofia', 'filosofia', '#8b5cf6', 'Reflexiones y analisis filosoficos profundos'),
  ('Ciencia', 'ciencia', '#06b6d4', 'Exploraciones del mundo cientifico y tecnologico'),
  ('Historia', 'historia', '#f59e0b', 'Analisis de eventos y periodos historicos'),
  ('Politica', 'politica', '#ef4444', 'Estudios sobre sistemas politicos y sociales'),
  ('Economia', 'economia', '#22c55e', 'Analisis economicos y financieros'),
  ('Arte', 'arte', '#ec4899', 'Critica y analisis artistico'),
  ('Literatura', 'literatura', '#6366f1', 'Ensayos y critica literaria'),
  ('Tecnologia', 'tecnologia', '#3b82f6', 'Analisis sobre avances tecnologicos')
ON CONFLICT (slug) DO NOTHING;

-- Insertar una serie de ejemplo
INSERT INTO public.series (title, slug, description, sort_order) VALUES
  ('Introduccion al Pensamiento Critico', 'pensamiento-critico', 'Una serie completa sobre como desarrollar el pensamiento critico y analitico.', 1),
  ('Historia de las Ideas', 'historia-ideas', 'Recorrido por las grandes ideas que han moldeado nuestra civilizacion.', 2)
ON CONFLICT (slug) DO NOTHING;
