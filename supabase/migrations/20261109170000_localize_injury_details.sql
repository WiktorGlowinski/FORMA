BEGIN;

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: cast($|\r?\n)', 'Uraz: Gips\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: cast($|\r?\n)';

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: joint($|\r?\n)', 'Uraz: Staw\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: joint($|\r?\n)';

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: muscle($|\r?\n)', 'Uraz: Mięsień\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: muscle($|\r?\n)';

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: head($|\r?\n)', 'Uraz: Głowa\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: head($|\r?\n)';

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: overload($|\r?\n)', 'Uraz: Przeciążenie\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: overload($|\r?\n)';

UPDATE public.evaluations
SET comment = regexp_replace(comment, '^Uraz: other($|\r?\n)', 'Uraz: Inna\1'),
    updated_at = now()
WHERE comment ~ '^Uraz: other($|\r?\n)';

COMMIT;
