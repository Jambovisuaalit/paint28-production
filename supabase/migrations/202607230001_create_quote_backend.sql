BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Uusi' CHECK (
    status IN ('Uusi','Käsittelyssä','Tarjous lähetetty','Sovittu pajalle','Hyväksytty','Hylätty','Valmis','Arkistoitu')
  ),
  customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  phone TEXT NOT NULL CHECK (char_length(trim(phone)) BETWEEN 5 AND 40),
  license_plate TEXT NOT NULL CHECK (char_length(trim(license_plate)) BETWEEN 1 AND 20),
  damage_description TEXT NOT NULL CHECK (char_length(trim(damage_description)) BETWEEN 5 AND 5000),
  preferred_contact_method TEXT NOT NULL DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone','email')),
  privacy_consent BOOLEAN NOT NULL CHECK (privacy_consent = true),
  internal_notes TEXT,
  source TEXT NOT NULL DEFAULT 'website'
);

CREATE TABLE IF NOT EXISTS public.quote_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL CHECK (char_length(storage_path) BETWEEN 1 AND 1024),
  original_filename TEXT,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg','image/png','image/heic')),
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order BETWEEN 0 AND 2)
);

CREATE TABLE IF NOT EXISTS private.quote_submission_rate_limits (
  fingerprint TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON public.quote_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_created_at_idx ON public.quote_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_images_quote_request_id_idx ON public.quote_images (quote_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS quote_images_storage_path_uidx ON public.quote_images (storage_path);
CREATE INDEX IF NOT EXISTS quote_rate_limits_updated_at_idx ON private.quote_submission_rate_limits (updated_at);

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_requests_set_updated_at ON public.quote_requests;
CREATE TRIGGER quote_requests_set_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.is_paint28_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
      AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.consume_quote_submission_rate_limit(
  p_fingerprint TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_row private.quote_submission_rate_limits%ROWTYPE;
  now_at TIMESTAMPTZ := now();
BEGIN
  INSERT INTO private.quote_submission_rate_limits (fingerprint, window_started_at, request_count, updated_at)
  VALUES (p_fingerprint, now_at, 1, now_at)
  ON CONFLICT (fingerprint) DO UPDATE
  SET
    window_started_at = CASE
      WHEN private.quote_submission_rate_limits.window_started_at < now_at - make_interval(mins => p_window_minutes)
      THEN now_at ELSE private.quote_submission_rate_limits.window_started_at END,
    request_count = CASE
      WHEN private.quote_submission_rate_limits.window_started_at < now_at - make_interval(mins => p_window_minutes)
      THEN 1 ELSE private.quote_submission_rate_limits.request_count + 1 END,
    updated_at = now_at
  RETURNING * INTO current_row;

  RETURN current_row.request_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION private.is_paint28_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_quote_submission_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_paint28_admin() TO authenticated;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_images ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.quote_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.quote_images FROM anon, authenticated;
GRANT SELECT ON TABLE public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_images TO authenticated;

DROP POLICY IF EXISTS "Paint28 admin reads own membership" ON public.admin_users;
CREATE POLICY "Paint28 admin reads own membership" ON public.admin_users
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) AND role = 'admin' AND active = true);

DROP POLICY IF EXISTS "Paint28 admin reads quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Paint28 admin creates quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Paint28 admin updates quote requests" ON public.quote_requests;
DROP POLICY IF EXISTS "Paint28 admin deletes quote requests" ON public.quote_requests;
CREATE POLICY "Paint28 admin reads quote requests" ON public.quote_requests FOR SELECT TO authenticated USING ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin creates quote requests" ON public.quote_requests FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin updates quote requests" ON public.quote_requests FOR UPDATE TO authenticated USING ((SELECT private.is_paint28_admin())) WITH CHECK ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin deletes quote requests" ON public.quote_requests FOR DELETE TO authenticated USING ((SELECT private.is_paint28_admin()));

DROP POLICY IF EXISTS "Paint28 admin reads quote images" ON public.quote_images;
DROP POLICY IF EXISTS "Paint28 admin creates quote images" ON public.quote_images;
DROP POLICY IF EXISTS "Paint28 admin updates quote images" ON public.quote_images;
DROP POLICY IF EXISTS "Paint28 admin deletes quote images" ON public.quote_images;
CREATE POLICY "Paint28 admin reads quote images" ON public.quote_images FOR SELECT TO authenticated USING ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin creates quote images" ON public.quote_images FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin updates quote images" ON public.quote_images FOR UPDATE TO authenticated USING ((SELECT private.is_paint28_admin())) WITH CHECK ((SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin deletes quote images" ON public.quote_images FOR DELETE TO authenticated USING ((SELECT private.is_paint28_admin()));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('damage-photos','damage-photos',false,10485760,ARRAY['image/jpeg','image/png','image/heic']::TEXT[])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Paint28 admin reads private damage photos" ON storage.objects;
DROP POLICY IF EXISTS "Paint28 admin deletes private damage photos" ON storage.objects;
CREATE POLICY "Paint28 admin reads private damage photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'damage-photos' AND (SELECT private.is_paint28_admin()));
CREATE POLICY "Paint28 admin deletes private damage photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'damage-photos' AND (SELECT private.is_paint28_admin()));

ALTER TABLE public.quote_requests REPLICA IDENTITY FULL;
ALTER TABLE public.quote_images REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quote_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'quote_images'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_images;
  END IF;
END;
$$;

COMMIT;
