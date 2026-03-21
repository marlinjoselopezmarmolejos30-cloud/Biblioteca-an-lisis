-- =============================================
-- BIBLIOTECA DE ANÁLISIS - ESQUEMA COMPLETO
-- Para recrear la base de datos desde cero en Supabase
-- Ejecutar todo este archivo en el SQL Editor de Supabase
-- =============================================


-- =============================================
-- 1. TABLAS
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'visitor')),
  is_silenced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content_url TEXT NOT NULL,
  cover_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  series_order INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  estimated_read_time INTEGER DEFAULT 5,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'featured')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress REAL DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_document', 'comment_reply', 'comment_like', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT,
  read_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- 2. ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_series ON public.documents(series_id);
CREATE INDEX IF NOT EXISTS idx_documents_published ON public.documents(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_featured ON public.documents(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_document ON public.comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);


-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_select_all" ON public.series FOR SELECT USING (true);
CREATE POLICY "series_admin_all" ON public.series FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_select_published" ON public.documents FOR SELECT USING (
  status = 'published'
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "documents_admin_all" ON public.documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_visible" ON public.comments FOR SELECT USING (
  status != 'hidden'
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "comments_insert_authenticated" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_silenced = TRUE)
);
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "comments_delete_own_or_admin" ON public.comments FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_likes_select_all" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert_own" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete_own" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_history_select_own" ON public.reading_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_history_insert_own" ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_history_update_own" ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR auth.uid() = user_id
);

ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_views_insert_all" ON public.document_views FOR INSERT WITH CHECK (true);
CREATE POLICY "document_views_select_admin" ON public.document_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- =============================================
-- 4. FUNCIONES Y TRIGGERS
-- =============================================

-- Auto-crear perfil al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_documents ON public.documents;
CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_series ON public.series;
CREATE TRIGGER set_updated_at_series
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_comments ON public.comments;
CREATE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Conteo de likes en comentarios
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_likes_count ON public.comment_likes;
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Conteo de comentarios en documentos
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status != 'hidden' AND NEW.parent_id IS NULL THEN
    UPDATE public.documents SET comments_count = comments_count + 1 WHERE id = NEW.document_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'hidden' AND NEW.status = 'hidden' AND NEW.parent_id IS NULL THEN
    UPDATE public.documents SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.document_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status != 'hidden' AND OLD.parent_id IS NULL THEN
    UPDATE public.documents SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.document_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_document_comments_count ON public.comments;
CREATE TRIGGER update_document_comments_count
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- Incrementar vistas al insertar en document_views
CREATE OR REPLACE FUNCTION public.increment_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents SET views_count = views_count + 1 WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_document_views ON public.document_views;
CREATE TRIGGER increment_document_views
  AFTER INSERT ON public.document_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_view_count();

-- Notificación al publicar documento
CREATE OR REPLACE FUNCTION public.notify_new_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    INSERT INTO public.notifications (user_id, type, title, message, document_id)
    SELECT p.id, 'new_document', 'Nuevo documento publicado', NEW.title, NEW.id
    FROM public.profiles p
    WHERE p.role = 'user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_document_published ON public.documents;
CREATE TRIGGER on_document_published
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_document();

-- Notificación al responder un comentario
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  parent_user_id UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_user_id FROM public.comments WHERE id = NEW.parent_id;
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, document_id)
      VALUES (
        parent_user_id,
        'comment_reply',
        'Nueva respuesta a tu comentario',
        SUBSTRING(NEW.content, 1, 100),
        NEW.document_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_reply ON public.comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_comment_reply();


-- =============================================
-- 5. FUNCIONES RPC (llamadas desde el frontend)
-- =============================================

CREATE OR REPLACE FUNCTION increment_views(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE documents SET views_count = views_count + 1 WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID, p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM comment_likes
    WHERE comment_id = p_comment_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM comment_likes WHERE comment_id = p_comment_id AND user_id = p_user_id;
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = p_comment_id;
    RETURN false;
  ELSE
    INSERT INTO comment_likes (comment_id, user_id) VALUES (p_comment_id, p_user_id);
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION toggle_comment_like(UUID, UUID) TO authenticated;
