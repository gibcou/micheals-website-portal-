-- getMessages() embeds sender:profiles(full_name), but messages.sender_id
-- only had a foreign key to auth.users, not profiles, so PostgREST had no
-- relationship path to resolve the embed and every message fetch 400'd
-- with "Could not find a relationship between 'messages' and 'profiles'".
-- profiles.id already mirrors auth.users.id 1:1 (via handle_new_user), so
-- adding this FK is safe and lets PostgREST embed the join.
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_profiles_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
