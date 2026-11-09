BEGIN;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS planned_rpe smallint;

ALTER TABLE public.trainings
  DROP CONSTRAINT IF EXISTS trainings_planned_rpe_check;

ALTER TABLE public.trainings
  ADD CONSTRAINT trainings_planned_rpe_check
  CHECK (planned_rpe IS NULL OR planned_rpe BETWEEN 1 AND 5);

COMMENT ON COLUMN public.trainings.planned_rpe IS
  'Planowane obciążenie jednostki w skali RPE 1-5.';

COMMIT;
