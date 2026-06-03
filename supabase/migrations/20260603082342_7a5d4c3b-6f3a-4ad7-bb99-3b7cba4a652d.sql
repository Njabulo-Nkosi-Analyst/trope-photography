-- Add Data API grants to all public tables. service_role + authenticated everywhere;
-- anon SELECT only on tables with a permissive public-read policy.

DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.relname);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.relname);
  END LOOP;
END $$;

-- Public-readable tables (have policies that allow anon to SELECT/INSERT)
GRANT SELECT ON public.gallery_images       TO anon;
GRANT SELECT ON public.hero_images          TO anon;
GRANT SELECT ON public.packages             TO anon;
GRANT SELECT ON public.promotions           TO anon;
GRANT SELECT ON public.testimonials         TO anon;
GRANT SELECT ON public.reviews              TO anon;
GRANT SELECT ON public.site_settings        TO anon;
GRANT SELECT ON public.availability_blocks  TO anon;
GRANT SELECT ON public.client_gallery_access TO anon;
GRANT SELECT ON public.client_gallery_images TO anon;

-- Anonymous visitors submit forms
GRANT INSERT ON public.inquiries TO anon;
GRANT INSERT ON public.quotes    TO anon;
GRANT INSERT ON public.reviews   TO anon;