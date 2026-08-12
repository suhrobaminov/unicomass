ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
DROP POLICY IF EXISTS "Public can read comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;

GRANT SELECT, INSERT ON public.comments TO anon;
GRANT SELECT, INSERT ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can post a comment"
  ON public.comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND rating BETWEEN 1 AND 5
    AND char_length(body) BETWEEN 3 AND 1000
    AND char_length(display_name) BETWEEN 1 AND 80
  );