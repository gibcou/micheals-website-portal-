-- estates, service_requests, invoices and weekly_reports each only had a
-- single client-facing SELECT policy (client_id = auth.uid() or an
-- estate-ownership check). There was no policy of any kind letting an
-- admin see, create, update or delete rows in any of these tables, so
-- every admin create/edit (e.g. adding an estate for a client) silently
-- failed RLS, and the admin pages' own SELECT queries always came back
-- empty too. Give admins full access, matching the is_admin() pattern
-- already used elsewhere.
CREATE POLICY "Admins can manage estates" ON estates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage service requests" ON service_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage weekly reports" ON weekly_reports FOR ALL USING (is_admin()) WITH CHECK (is_admin());
