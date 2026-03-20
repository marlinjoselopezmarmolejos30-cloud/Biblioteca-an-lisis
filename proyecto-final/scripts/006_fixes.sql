-- =============================================
-- FIXES - Run these after initial setup
-- =============================================

-- Add order_index to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Rename view_count to views_count for consistency with frontend code
ALTER TABLE public.documents RENAME COLUMN view_count TO views_count;

-- Add comments_count to documents (kept in sync via trigger)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Update comments_count trigger
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
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_count();

-- Fix increment_views function to use renamed column
CREATE OR REPLACE FUNCTION increment_views(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE documents SET views_count = views_count + 1 WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon;

-- Update categories order
UPDATE public.categories SET order_index = 0 WHERE order_index IS NULL;
