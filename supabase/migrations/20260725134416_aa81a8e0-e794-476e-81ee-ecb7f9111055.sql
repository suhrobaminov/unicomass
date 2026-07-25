CREATE TABLE public.major_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  trait_scores jsonb,
  results jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.major_assessments TO authenticated;
GRANT ALL ON public.major_assessments TO service_role;

ALTER TABLE public.major_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own major_assessments" ON public.major_assessments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER touch_major_assessments_updated_at
  BEFORE UPDATE ON public.major_assessments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX major_assessments_user_created_idx ON public.major_assessments(user_id, created_at DESC);