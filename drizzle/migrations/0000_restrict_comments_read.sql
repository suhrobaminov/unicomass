DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
DROP POLICY IF EXISTS "comments readable by all" ON public.comments;
REVOKE SELECT ON public.comments FROM anon;
CREATE POLICY "authors read own comments" ON public.comments FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_comments(_limit int DEFAULT 24)
RETURNS TABLE(id uuid, display_name text, rating smallint, body text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.display_name, c.rating, c.body, c.created_at
  FROM public.comments c
  ORDER BY c.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100)
$$;
REVOKE ALL ON FUNCTION public.get_public_comments(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_comments(int) TO anon, authenticated;