BEGIN;

CREATE OR REPLACE FUNCTION public.audit_business_record_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_club_id uuid;
  record_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    record_club_id := OLD.club_id;
    record_id := OLD.id;
  ELSE
    record_club_id := NEW.club_id;
    record_id := NEW.id;
  END IF;

  INSERT INTO public.audit_logs (
    club_id,
    user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    created_at
  )
  VALUES (
    record_club_id,
    auth.uid(),
    TG_TABLE_NAME,
    record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.audit_business_record_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_evaluations_changes ON public.evaluations;
CREATE TRIGGER audit_evaluations_changes
AFTER INSERT OR UPDATE OR DELETE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.audit_business_record_change();

DROP TRIGGER IF EXISTS audit_trainings_changes ON public.trainings;
CREATE TRIGGER audit_trainings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.trainings
FOR EACH ROW EXECUTE FUNCTION public.audit_business_record_change();

COMMIT;
