BEGIN;

CREATE TABLE IF NOT EXISTS public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE RESTRICT,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  event_type text NOT NULL CHECK (event_type IN ('grill', 'trip', 'friendly', 'tournament', 'other')),
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 1 AND 200),
  opponent_name text CHECK (opponent_name IS NULL OR char_length(opponent_name) <= 120),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS club_events_club_date_idx
  ON public.club_events (club_id, event_date DESC);

CREATE INDEX IF NOT EXISTS club_events_team_date_idx
  ON public.club_events (team_id, event_date DESC);

ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.club_events TO authenticated;

CREATE POLICY "Club staff read events in their scope"
  ON public.club_events
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() = 'club_admin'::user_role
        OR (
          get_auth_role() = 'coordinator'::user_role
          AND (
            team_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.team_coaches tc
              WHERE tc.team_id = club_events.team_id
                AND tc.club_id = club_events.club_id
                AND tc.coach_id = auth.uid()
                AND tc.revoked_at IS NULL
            )
          )
        )
      )
    )
  );

CREATE POLICY "Club staff create events in their scope"
  ON public.club_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() = 'club_admin'::user_role
        OR (
          get_auth_role() = 'coordinator'::user_role
          AND (
            team_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.team_coaches tc
              WHERE tc.team_id = club_events.team_id
                AND tc.club_id = club_events.club_id
                AND tc.coach_id = auth.uid()
                AND tc.revoked_at IS NULL
            )
          )
        )
      )
    )
  );

CREATE POLICY "Club staff update events in their scope"
  ON public.club_events
  FOR UPDATE
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() = 'club_admin'::user_role
        OR (
          get_auth_role() = 'coordinator'::user_role
          AND (
            team_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.team_coaches tc
              WHERE tc.team_id = club_events.team_id
                AND tc.club_id = club_events.club_id
                AND tc.coach_id = auth.uid()
                AND tc.revoked_at IS NULL
            )
          )
        )
      )
    )
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() = 'club_admin'::user_role
        OR (
          get_auth_role() = 'coordinator'::user_role
          AND (
            team_id IS NULL
            OR EXISTS (
              SELECT 1
              FROM public.team_coaches tc
              WHERE tc.team_id = club_events.team_id
                AND tc.club_id = club_events.club_id
                AND tc.coach_id = auth.uid()
                AND tc.revoked_at IS NULL
            )
          )
        )
      )
    )
  );

COMMIT;
