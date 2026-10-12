-- The estates form/UI (status badge, monthly retainer display, notes
-- field) has always used status, monthly_retainer and notes, but the
-- table never had these columns - every estate create/update failed
-- with "Could not find the 'monthly_retainer' column of 'estates' in
-- the schema cache".
ALTER TABLE estates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'onboarding';
ALTER TABLE estates ADD COLUMN IF NOT EXISTS monthly_retainer INT;
ALTER TABLE estates ADD COLUMN IF NOT EXISTS notes TEXT;
