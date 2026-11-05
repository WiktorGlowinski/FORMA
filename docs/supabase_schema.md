## Table `clubs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `slug` | `text` |  Unique |
| `logo_url` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `club_fields`

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` | References `clubs.id` |
| `name` | `text` | Unique per club, trimmed and non-empty |
| `is_active` | `bool` | Defaults to true |
| `created_at` | `timestamptz` | Defaults to now |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  Nullable |
| `email` | `text` |  Unique |
| `full_name` | `text` |  |
| `role` | `user_role` |  |
| `avatar_url` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `seasons`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `name` | `text` |  |
| `start_date` | `date` |  |
| `end_date` | `date` |  |
| `is_current` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `teams`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `season_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `age_group` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `team_coaches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `team_id` | `uuid` |  |
| `coach_id` | `uuid` |  |
| `is_primary` | `bool` |  |
| `assigned_at` | `timestamptz` |  |
| `revoked_at` | `timestamptz` |  Nullable |

## Table `players`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `current_team_id` | `uuid` |  |
| `first_name` | `text` |  |
| `last_name` | `text` |  |
| `birth_year` | `int4` |  |
| `birth_date` | `date` |  Nullable |
| `jersey_number` | `int4` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `parent_name` | `text` |  Nullable |
| `parent_email` | `text` |  Nullable |
| `parent_phone` | `text` |  Nullable |
| `preferred_survey_recipient` | `survey_recipient` |  |
| `is_active` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `phone` | `text` |  Nullable |
| `email` | `text` |  Nullable |

## Table `player_team_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `player_id` | `uuid` |  |
| `team_id` | `uuid` |  |
| `joined_at` | `timestamptz` |  |
| `left_at` | `timestamptz` |  Nullable |

## Table `trainings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `team_id` | `uuid` |  |
| `lead_coach_id` | `uuid` |  Nullable |
| `date` | `date` |  |
| `start_time` | `time` |  |
| `end_time` | `time` |  Nullable |
| `topic` | `text` |  Nullable |
| `main_goal` | `text` |  Nullable |
| `location` | `text` |  Nullable |
| `training_type` | `text` |  Nullable |
| `organizational_note` | `text` |  Nullable |
| `status` | `training_status` |  |
| `evaluation_status` | `evaluation_status` |  |
| `survey_enabled` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `evaluations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `training_id` | `uuid` |  |
| `player_id` | `uuid` |  |
| `evaluator_id` | `uuid` |  Nullable |
| `is_present` | `bool` |  |
| `score` | `evaluation_score` |  Nullable |
| `absence_reason` | `absence_reason` |  Nullable |
| `is_guest` | `bool` |  |
| `comment` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

`comment` stores injury details as `Uraz: <kind>` and coach notes as
`Notatka: <text>`, using separate lines when both are present. Coach notes are
transcribed from speech in supported browsers or entered manually.

## Table `post_training_surveys`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `training_id` | `uuid` |  |
| `player_id` | `uuid` |  |
| `token` | `uuid` |  Unique |
| `recipient` | `survey_recipient` |  |
| `fatigue` | `int4` |  Nullable |
| `satisfaction` | `int4` |  Nullable |
| `feedback_note` | `text` |  Nullable |
| `is_completed` | `bool` |  |
| `completed_at` | `timestamptz` |  Nullable |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `audit_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `club_id` | `uuid` |  |
| `user_id` | `uuid` |  Nullable |
| `table_name` | `text` |  |
| `record_id` | `uuid` |  |
| `action` | `text` |  |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  |

## Custom Types / Enums

### `user_role`

`master_admin` | `club_admin` | `coordinator` | `coach`

### `training_status`

`scheduled` | `completed` | `cancelled`

### `evaluation_status`

`unrated` | `partial` | `completed`

### `evaluation_score`

`-` | `0` | `+`

### `absence_reason`

`unexcused` | `excused` | `sick` | `injury`

### `survey_recipient`

`player` | `parent`

## RLS Policies

The policies below reflect the hardening migration in
[`supabase/migrations/20261105160000_harden_club_rls_and_surveys.sql`](../supabase/migrations/20261105160000_harden_club_rls_and_surveys.sql).
Apply that migration to the Supabase project; this documentation alone does not change deployed policies.

### `clubs`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Master admin widzi wszystkie kluby` | ALL | public | PERMISSIVE | `(get_auth_role() = 'master_admin'::user_role)` | — |
| `Członkowie klubu widzą swój klub` | SELECT | public | PERMISSIVE | `(id = get_auth_club_id())` | — |

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Master admin widzi wszystkie profile` | ALL | public | PERMISSIVE | `(get_auth_role() = 'master_admin'::user_role)` | — |
| `Użytkownicy widzą profile ze swojego klubu` | SELECT | public | PERMISSIVE | `(club_id = get_auth_club_id())` | — |
| `Admin klubu zarządza profilami w klubie` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) AND (get_auth_role() = 'club_admin'::user_role))` | — |

### `seasons`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Members read club seasons` | SELECT | authenticated | PERMISSIVE | `(get_auth_role() = 'master_admin'::user_role OR club_id = get_auth_club_id())` | — |
| `Club admins manage seasons` | ALL | authenticated | PERMISSIVE | `master_admin OR (same club AND role in club_admin/coordinator)` | Same as USING |

### `team_coaches`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff and coaches read team assignments` | SELECT | authenticated | PERMISSIVE | `master_admin OR (same club AND coach_id = auth.uid()) OR (same club AND role in club_admin/coordinator)` | — |
| `Club admins manage team assignments` | ALL | authenticated | PERMISSIVE | `master_admin OR (same club AND role in club_admin/coordinator)` | Same as USING |

### `player_team_history`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff read club player history` | SELECT | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR same-club assigned team coach` | — |
| `Club admins manage player history` | ALL | authenticated | PERMISSIVE | `master_admin OR (same club AND role in club_admin/coordinator)` | Same as USING |

Transfers performed from the admin player registry use the
`transfer_player_to_team` database function. It updates `players.current_team_id`,
closes the previous `player_team_history` record, and creates the new one in a
single transaction. Execution is restricted to `service_role`; the server action
authorizes the administrator and supplies the club ID.

### `trainings`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff and coaches read trainings` | SELECT | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_team(team_id))` | — |
| `Staff and assigned coaches create trainings` | INSERT | authenticated | PERMISSIVE | — | `master_admin OR same-club admin/coordinator OR assigned coach in same club with lead null/self` |
| `Staff and assigned coaches update trainings` | UPDATE | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_training(id))` | Same as USING |

### `evaluations`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff and assigned coaches read evaluations` | SELECT | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_training(training_id))` | — |
| `Staff and assigned coaches insert evaluations` | INSERT | authenticated | PERMISSIVE | — | `master_admin OR same-club admin/coordinator OR assigned coach with evaluator_id = auth.uid()` |
| `Staff and assigned coaches update evaluations` | UPDATE | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR same-club assigned coach with evaluator_id = auth.uid()` | Same as USING |
| `Staff and assigned coaches delete evaluations` | DELETE | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_training(training_id))` | — |

### `post_training_surveys`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff and assigned coaches read surveys` | SELECT | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_training(training_id))` | — |
| `Staff and assigned coaches manage surveys` | ALL | authenticated | PERMISSIVE | `master_admin OR same-club admin/coordinator OR (same club AND is_coach_of_training(training_id))` | Same as USING |

Anonymous table privileges are revoked. Public survey access is performed only through server actions using an individual unguessable survey token; the token is not accepted as a direct table policy predicate.

### `audit_logs`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Dostęp do audytu` | SELECT | public | PERMISSIVE | `((get_auth_role() = 'master_admin'::user_role) OR ((club_id = get_auth_club_id()) AND (get_auth_role() = ANY (ARRAY['club_admin'::user_role, 'coordinator'::user_role]))))` | — |

### `teams`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff can view club teams` | SELECT | authenticated | PERMISSIVE | `(club_id = get_current_user_club_id())` | — |

### `players`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Staff can view club players` | SELECT | authenticated | PERMISSIVE | `((club_id = get_current_user_club_id()) OR (current_team_id IN ( SELECT teams.id    FROM teams   WHERE (teams.club_id = get_current_user_club_id()))))` | — |
