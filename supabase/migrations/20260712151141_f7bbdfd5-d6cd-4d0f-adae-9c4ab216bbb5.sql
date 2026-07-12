
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  rating smallint NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments readable by all" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "authed users insert own comment" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authors update own comment" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authors delete own comment" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_comment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF length(NEW.body) < 3 OR length(NEW.body) > 1000 THEN
    RAISE EXCEPTION 'body must be 3-1000 chars';
  END IF;
  IF length(NEW.display_name) < 1 OR length(NEW.display_name) > 80 THEN
    RAISE EXCEPTION 'display_name must be 1-80 chars';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_comment_trg BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment();

ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
