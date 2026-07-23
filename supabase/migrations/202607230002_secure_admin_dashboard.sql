BEGIN;

CREATE OR REPLACE FUNCTION private.sync_paint28_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF lower(coalesce(NEW.email, '')) = 'hanna@paint28.fi' THEN
    INSERT INTO public.admin_users (user_id, role, active)
    VALUES (NEW.id, 'admin', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin', active = true;
  ELSIF TG_OP = 'UPDATE' AND lower(coalesce(OLD.email, '')) = 'hanna@paint28.fi' THEN
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_paint28_admin_user() FROM PUBLIC;
DROP TRIGGER IF EXISTS paint28_sync_admin_user ON auth.users;
CREATE TRIGGER paint28_sync_admin_user
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.sync_paint28_admin_user();

INSERT INTO public.admin_users (user_id, role, active)
SELECT id, 'admin', true FROM auth.users
WHERE lower(email) = 'hanna@paint28.fi'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', active = true;

COMMIT;
