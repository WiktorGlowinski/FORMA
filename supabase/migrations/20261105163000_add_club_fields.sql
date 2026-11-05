BEGIN;

CREATE TABLE public.club_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name = btrim(name) AND length(name) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX club_fields_club_name_unique
  ON public.club_fields (club_id, lower(btrim(name)));

ALTER TABLE public.club_fields ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.club_fields FROM anon, PUBLIC;
GRANT SELECT, INSERT ON public.club_fields TO authenticated;

CREATE POLICY "Club members read club fields"
  ON public.club_fields
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() = ANY (
        ARRAY['club_admin'::user_role, 'coordinator'::user_role, 'coach'::user_role]
      )
    )
  );

CREATE POLICY "Club admins add club fields"
  ON public.club_fields
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() = 'club_admin'::user_role
    )
  );

COMMIT;
