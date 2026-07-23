BEGIN;

ALTER TABLE public.quote_images DROP CONSTRAINT IF EXISTS quote_images_mime_type_check;
ALTER TABLE public.quote_images ADD CONSTRAINT quote_images_mime_type_check
  CHECK (mime_type IN ('image/jpeg','image/png','image/heic'));

ALTER TABLE public.quote_images DROP CONSTRAINT IF EXISTS quote_images_file_size_check;
ALTER TABLE public.quote_images ADD CONSTRAINT quote_images_file_size_check
  CHECK (file_size > 0 AND file_size <= 10485760);

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

COMMIT;
