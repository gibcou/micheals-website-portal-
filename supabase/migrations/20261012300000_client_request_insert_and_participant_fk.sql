-- service_requests had an admin-manage policy and a client SELECT policy,
-- but no policy letting a client INSERT their own request. Every "New
-- Request" submission from the client portal silently failed RLS.
CREATE POLICY "Clients can create requests for their own estate" ON service_requests
  FOR INSERT WITH CHECK (estate_id IN (SELECT id FROM estates WHERE client_id = auth.uid()));

-- conversation_participants.user_id only had a foreign key to auth.users,
-- not profiles, so PostgREST had no relationship path to embed
-- participant profile info (needed to show a client's name on the admin
-- conversation list) - same class of gap fixed for messages.sender_id.
ALTER TABLE conversation_participants
  ADD CONSTRAINT conversation_participants_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
