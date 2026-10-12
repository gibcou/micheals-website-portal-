import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/server';

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { req, res }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, participantIds } = req.body;

  if (!title || !participantIds) {
    return res.status(400).json({ error: 'Missing title or participantIds' });
  }

  const serviceRoleClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

  const { data: conversation, error: conversationError } = await serviceRoleClient
    .from('conversations')
    .insert([{ title, created_by: user.id }])
    .single();

  if (conversationError) {
    return res.status(500).json({ error: conversationError.message });
  }

  const conversationId = conversation.id;

  const participants = participantIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
  }));

  const { error: participantsError } = await serviceRoleClient
    .from('conversation_participants')
    .insert(participants);

  if (participantsError) {
    return res.status(500).json({ error: participantsError.message });
  }

  return res.status(200).json(conversation);
};
