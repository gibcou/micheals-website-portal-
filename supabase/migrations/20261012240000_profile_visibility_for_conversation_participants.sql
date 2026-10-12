-- Messages join sender:profiles(full_name), but a client and the admin
-- they're messaging couldn't see each other's profile (only their own, or
-- an admin could see everyone's) - so the other party's name came back
-- null. Let participants in a shared conversation read each other's
-- profile. Queries conversation_participants, not profiles, so this
-- doesn't recurse like the earlier admin-read-all-profiles policy did.
DROP POLICY IF EXISTS "Conversation participants can read each other's profile" ON profiles;
CREATE POLICY "Conversation participants can read each other's profile" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = profiles.id AND cp2.user_id = auth.uid()
  )
);
