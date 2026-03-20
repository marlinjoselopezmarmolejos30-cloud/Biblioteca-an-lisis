-- Function to increment document views
CREATE OR REPLACE FUNCTION increment_views(doc_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE documents
  SET views_count = views_count + 1
  WHERE id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle comment like
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
    DELETE FROM comment_likes 
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
    
    UPDATE comments SET likes_count = likes_count - 1 
    WHERE id = p_comment_id;
    
    RETURN false;
  ELSE
    INSERT INTO comment_likes (comment_id, user_id) 
    VALUES (p_comment_id, p_user_id);
    
    UPDATE comments SET likes_count = likes_count + 1 
    WHERE id = p_comment_id;
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION toggle_comment_like(UUID, UUID) TO authenticated;
