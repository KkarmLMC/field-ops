-- ── Production indexes for Field Ops ─────────────────────────────────────────
-- Run once in Supabase SQL Editor: https://app.supabase.com/project/jnbdlhyjnzdsvscpgkqi/sql

CREATE INDEX IF NOT EXISTS idx_form_def_category    ON form_definitions(category);
CREATE INDEX IF NOT EXISTS idx_form_def_branch       ON form_definitions(branch);
CREATE INDEX IF NOT EXISTS idx_form_def_parent_slug  ON form_definitions(parent_slug);
CREATE INDEX IF NOT EXISTS idx_form_def_active_sort  ON form_definitions(active, sort_order);

CREATE INDEX IF NOT EXISTS idx_fsv2_status           ON form_submissions_v2(status);
CREATE INDEX IF NOT EXISTS idx_fsv2_created_at       ON form_submissions_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fsv2_project_id       ON form_submissions_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_fsv2_slug_branch      ON form_submissions_v2(form_slug, branch);

CREATE INDEX IF NOT EXISTS idx_form_cat_active_sort  ON form_categories(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_form_cat_branch       ON form_categories(branch);

CREATE INDEX IF NOT EXISTS idx_dfl_branch            ON daily_field_logs(branch);
CREATE INDEX IF NOT EXISTS idx_dfl_submitted_by      ON daily_field_logs(submitted_by);
CREATE INDEX IF NOT EXISTS idx_dfl_report_date       ON daily_field_logs(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_dfl_status            ON daily_field_logs(status);
CREATE INDEX IF NOT EXISTS idx_dfl_jobsite_id        ON daily_field_logs(jobsite_id);

CREATE INDEX IF NOT EXISTS idx_ra_branch             ON risk_assessments(branch);
CREATE INDEX IF NOT EXISTS idx_ra_created_at         ON risk_assessments(created_at DESC);
