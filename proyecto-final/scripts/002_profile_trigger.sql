-- Trigger para crear perfil automáticamente cuando un usuario se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Función para incrementar vistas de documentos
create or replace function increment_document_views(doc_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update documents
  set view_count = view_count + 1
  where id = doc_id;
end;
$$;

-- Función para toggle like en comentarios
create or replace function toggle_comment_like(p_comment_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  existing_like boolean;
begin
  select exists(
    select 1 from comment_likes 
    where comment_id = p_comment_id and user_id = p_user_id
  ) into existing_like;
  
  if existing_like then
    delete from comment_likes where comment_id = p_comment_id and user_id = p_user_id;
    update comments set likes_count = likes_count - 1 where id = p_comment_id;
    return false;
  else
    insert into comment_likes (comment_id, user_id) values (p_comment_id, p_user_id);
    update comments set likes_count = likes_count + 1 where id = p_comment_id;
    return true;
  end if;
end;
$$;
