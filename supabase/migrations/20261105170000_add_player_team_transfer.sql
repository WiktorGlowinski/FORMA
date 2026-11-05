BEGIN;

CREATE OR REPLACE FUNCTION public.transfer_player_to_team(
  p_club_id uuid,
  p_player_id uuid,
  p_team_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_team_id uuid;
  v_transferred_at timestamptz := now();
BEGIN
  SELECT current_team_id
  INTO v_current_team_id
  FROM public.players
  WHERE id = p_player_id
    AND club_id = p_club_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono zawodnika w klubie.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.teams
    WHERE id = p_team_id
      AND club_id = p_club_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Wybrana drużyna nie istnieje lub jest nieaktywna.';
  END IF;

  IF v_current_team_id = p_team_id THEN
    RETURN;
  END IF;

  IF v_current_team_id IS NOT NULL THEN
    UPDATE public.player_team_history
    SET left_at = v_transferred_at
    WHERE club_id = p_club_id
      AND player_id = p_player_id
      AND team_id = v_current_team_id
      AND left_at IS NULL;
  END IF;

  UPDATE public.players
  SET current_team_id = p_team_id,
      updated_at = v_transferred_at
  WHERE id = p_player_id
    AND club_id = p_club_id;

  INSERT INTO public.player_team_history (club_id, player_id, team_id, joined_at)
  VALUES (p_club_id, p_player_id, p_team_id, v_transferred_at);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_player_to_team(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_player_to_team(uuid, uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_player_to_team(uuid, uuid, uuid) TO service_role;

COMMIT;
