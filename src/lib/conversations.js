import { supabase } from './supabase';

export const getConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, last_message:messages(body, created_at), conversation_participants(user_id, profiles(full_name))')
    .order('created_at', { foreignTable: 'messages', ascending: false })
    .limit(1, { foreignTable: 'messages' });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const createConversation = async (title, participantIds) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('conversations')
    .insert([{ title, created_by: user.id }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const conversationId = data.id;

  const participants = participantIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase.from('conversation_participants').insert(participants);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  return data;
};
