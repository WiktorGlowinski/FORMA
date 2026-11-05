BEGIN;

DROP POLICY IF EXISTS "Izolacja klubowa - seasons" ON public.seasons;
CREATE POLICY "Members read club seasons"
  ON public.seasons
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR club_id = get_auth_club_id()
  );
CREATE POLICY "Club admins manage seasons"
  ON public.seasons
  FOR ALL
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() = ANY (ARRAY['club_admin'::user_role, 'coordinator'::user_role])
    )
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() = ANY (ARRAY['club_admin'::user_role, 'coordinator'::user_role])
    )
  );

DROP POLICY IF EXISTS "Izolacja klubowa - team_coaches" ON public.team_coaches;
DROP POLICY IF EXISTS "Trener widzi swoje powiązania w team_coaches" ON public.team_coaches;
CREATE POLICY "Staff and coaches read team assignments"
  ON public.team_coaches
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (club_id = get_auth_club_id() AND coach_id = auth.uid())
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() = ANY (ARRAY['club_admin'::user_role, 'coordinator'::user_role])
    )
  );
CREATE POLICY "Club admins manage team assignments"
  ON public.team_coaches
  FOR ALL
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
  );

DROP POLICY IF EXISTS "Izolacja klubowa - player_team_history" ON public.player_team_history;
CREATE POLICY "Staff read club player history"
  ON public.player_team_history
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
        OR (club_id = get_auth_club_id() AND is_coach_of_team(team_id))
      )
    )
  );
CREATE POLICY "Club admins manage player history"
  ON public.player_team_history
  FOR ALL
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
  );

DROP POLICY IF EXISTS "Izolacja klubowa - trainings" ON public.trainings;
DROP POLICY IF EXISTS "Trener widzi jednostki swoich drużyn" ON public.trainings;
DROP POLICY IF EXISTS "Trener tworzy treningi dla swoich grup" ON public.trainings;
DROP POLICY IF EXISTS "Trener modyfikuje własne jednostki" ON public.trainings;
CREATE POLICY "Staff and coaches read trainings"
  ON public.trainings
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_team(team_id))
  );
CREATE POLICY "Staff and assigned coaches create trainings"
  ON public.trainings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (
      club_id = get_auth_club_id()
      AND is_coach_of_team(team_id)
      AND (lead_coach_id IS NULL OR lead_coach_id = auth.uid())
    )
  );
CREATE POLICY "Staff and assigned coaches update trainings"
  ON public.trainings
  FOR UPDATE
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(id))
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(id))
  );

DROP POLICY IF EXISTS "Izolacja klubowa - evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Trener odczytuje oceny swojego treningu" ON public.evaluations;
DROP POLICY IF EXISTS "Trener zapisuje oceny dla swojego treningu" ON public.evaluations;
DROP POLICY IF EXISTS "Trener aktualizuje oceny swojego treningu" ON public.evaluations;
DROP POLICY IF EXISTS "Trener może wyczyścić oceny swojego treningu" ON public.evaluations;
CREATE POLICY "Staff and assigned coaches read evaluations"
  ON public.evaluations
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(training_id))
  );
CREATE POLICY "Staff and assigned coaches insert evaluations"
  ON public.evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
        OR (
          club_id = get_auth_club_id()
          AND is_coach_of_training(training_id)
          AND evaluator_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Staff and assigned coaches update evaluations"
  ON public.evaluations
  FOR UPDATE
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
        OR (
          club_id = get_auth_club_id()
          AND is_coach_of_training(training_id)
          AND evaluator_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
        OR (
          club_id = get_auth_club_id()
          AND is_coach_of_training(training_id)
          AND evaluator_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY "Staff and assigned coaches delete evaluations"
  ON public.evaluations
  FOR DELETE
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND (
        get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
        OR (club_id = get_auth_club_id() AND is_coach_of_training(training_id))
      )
    )
  );

DROP POLICY IF EXISTS "Klub ma wgląd do ankiet" ON public.post_training_surveys;
DROP POLICY IF EXISTS "Publiczny odczyt ankiety przez token" ON public.post_training_surveys;
DROP POLICY IF EXISTS "Publiczne wypełnienie ankiety przez token" ON public.post_training_surveys;
DROP POLICY IF EXISTS "Trener ma pełen dostęp do ankiet swojej jednostki" ON public.post_training_surveys;
REVOKE ALL PRIVILEGES ON TABLE public.post_training_surveys FROM anon, PUBLIC;
CREATE POLICY "Staff and assigned coaches read surveys"
  ON public.post_training_surveys
  FOR SELECT
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(training_id))
  );
CREATE POLICY "Staff and assigned coaches manage surveys"
  ON public.post_training_surveys
  FOR ALL
  TO authenticated
  USING (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(training_id))
  )
  WITH CHECK (
    get_auth_role() = 'master_admin'::user_role
    OR (
      club_id = get_auth_club_id()
      AND get_auth_role() IN ('club_admin'::user_role, 'coordinator'::user_role)
    )
    OR (club_id = get_auth_club_id() AND is_coach_of_training(training_id))
  );

COMMIT;
