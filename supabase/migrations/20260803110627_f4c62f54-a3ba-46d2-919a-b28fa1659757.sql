-- 1. Missing foreign key on major_assessments
DELETE FROM public.major_assessments ma
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ma.user_id);

ALTER TABLE public.major_assessments
  ADD CONSTRAINT major_assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Missing indexes on foreign-key / filter columns
CREATE INDEX IF NOT EXISTS extracurriculars_user_id_idx ON public.extracurriculars (user_id, created_at);
CREATE INDEX IF NOT EXISTS awards_user_id_idx ON public.awards (user_id, created_at);
CREATE INDEX IF NOT EXISTS reports_user_created_idx ON public.reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments (created_at DESC);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments (user_id);

-- 3. Scope owner-only policies to the authenticated role explicitly
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own ecs" ON public.extracurriculars;
CREATE POLICY "own ecs" ON public.extracurriculars FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own awards" ON public.awards;
CREATE POLICY "own awards" ON public.awards FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own reports" ON public.reports;
CREATE POLICY "own reports" ON public.reports FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own major_assessments" ON public.major_assessments;
CREATE POLICY "own major_assessments" ON public.major_assessments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
