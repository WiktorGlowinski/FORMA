CREATE TABLE IF NOT EXISTS public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'bug',
  priority text NOT NULL DEFAULT 'normal',
  page_url text,
  browser_info text,
  screenshot_path text,
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT bug_reports_category_check CHECK (category IN ('bug', 'suggestion', 'login')),
  CONSTRAINT bug_reports_priority_check CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT bug_reports_status_check CHECK (status IN ('new', 'in_progress', 'resolved', 'rejected'))
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own bug reports"
  ON public.bug_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own bug reports"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', false)
ON CONFLICT (id) DO NOTHING;
