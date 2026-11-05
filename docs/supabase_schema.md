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
| `Izolacja klubowa - seasons` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |

### `team_coaches`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Izolacja klubowa - team_coaches` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |
| `Trener widzi swoje powiązania w team_coaches` | SELECT | authenticated | PERMISSIVE | `(coach_id = auth.uid())` | — |

### `player_team_history`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Izolacja klubowa - player_team_history` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |

### `trainings`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Izolacja klubowa - trainings` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |
| `Trener widzi jednostki swoich drużyn` | SELECT | authenticated | PERMISSIVE | `is_coach_of_team(team_id)` | — |
| `Trener tworzy treningi dla swoich grup` | INSERT | authenticated | PERMISSIVE | — | `(is_coach_of_team(team_id) AND ((lead_coach_id IS NULL) OR (lead_coach_id = auth.uid())))` |
| `Trener modyfikuje własne jednostki` | UPDATE | authenticated | PERMISSIVE | `is_coach_of_training(id)` | `is_coach_of_training(id)` |

### `evaluations`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Izolacja klubowa - evaluations` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |
| `Trener odczytuje oceny swojego treningu` | SELECT | authenticated | PERMISSIVE | `is_coach_of_training(training_id)` | — |
| `Trener zapisuje oceny dla swojego treningu` | INSERT | authenticated | PERMISSIVE | — | `(is_coach_of_training(training_id) AND (evaluator_id = auth.uid()))` |
| `Trener aktualizuje oceny swojego treningu` | UPDATE | authenticated | PERMISSIVE | `(is_coach_of_training(training_id) AND (evaluator_id = auth.uid()))` | `(is_coach_of_training(training_id) AND (evaluator_id = auth.uid()))` |
| `Trener może wyczyścić oceny swojego treningu` | DELETE | authenticated | PERMISSIVE | `is_coach_of_training(training_id)` | — |

### `post_training_surveys`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Klub ma wgląd do ankiet` | ALL | public | PERMISSIVE | `((club_id = get_auth_club_id()) OR (get_auth_role() = 'master_admin'::user_role))` | — |
| `Publiczny odczyt ankiety przez token` | SELECT | anon | PERMISSIVE | `((token IS NOT NULL) AND (is_completed = false) AND (expires_at > now()))` | — |
| `Publiczne wypełnienie ankiety przez token` | UPDATE | anon | PERMISSIVE | `((token IS NOT NULL) AND (is_completed = false) AND (expires_at > now()))` | `((is_completed = true) AND (completed_at IS NOT NULL) AND (fatigue IS NOT NULL) AND (satisfaction IS NOT NULL))` |
| `Trener ma pełen dostęp do ankiet swojej jednostki` | ALL | authenticated | PERMISSIVE | `is_coach_of_training(training_id)` | `is_coach_of_training(training_id)` |

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

