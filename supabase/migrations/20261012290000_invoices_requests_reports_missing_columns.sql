-- Same gap as estates (fixed in 20261012280000): invoices, service_requests
-- and weekly_reports were missing columns their forms/display have used
-- all along, so creating an invoice, submitting a service request, or
-- publishing a weekly report all failed with "Could not find the '<col>'
-- column ... in the schema cache".
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS estate_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_date DATE;

ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS estate_name TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS scheduled_date DATE;

ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS actions_taken TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS estate_name TEXT;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS photos TEXT[];
