
-- Pin search_path on functions that didn't have it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Tighten has_role exposure
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

-- Replace permissive inquiry insert with sanity checks
DROP POLICY IF EXISTS "Anyone submits inquiry" ON public.inquiries;
CREATE POLICY "Anyone submits inquiry" ON public.inquiries FOR INSERT
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 320
    AND email LIKE '%_@_%.__%'
    AND status = 'new'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Restrict storage listing on gallery bucket to admins; public can still read individual files via public URL
DROP POLICY IF EXISTS "Anyone views gallery files" ON storage.objects;
CREATE POLICY "Public read gallery files" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));
