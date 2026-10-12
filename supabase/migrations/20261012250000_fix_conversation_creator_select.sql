-- createConversation() inserts a conversation and reads it back via
-- .select() (RETURNING), but the only SELECT policy on conversations
-- required the caller to already be a participant - which the creator
-- isn't yet at that point (participants are added in a second insert
-- right after). RETURNING's implicit visibility check failed before that
-- second insert ever ran, surfacing as "new row violates row-level
-- security policy for table conversations" on every conversation creation.
-- Let the creator see their own conversation immediately too.
DROP POLICY IF EXISTS "Users can see conversations they are a part of" ON conversations;
CREATE POLICY "Users can see conversations they are a part of" ON conversations
  FOR SELECT USING (is_conversation_participant(id) OR created_by = auth.uid());
