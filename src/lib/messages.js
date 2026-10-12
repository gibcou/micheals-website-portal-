import { supabase } from './supabase';

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles(full_name)')
    .eq('conversation_id', conversationId)
    .order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const sendMessage = async ({ conversationId, body, attachmentPath }) => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('messages').insert([
    {
      conversation_id: conversationId,
      sender_id: user.id,
      body,
      attachment_path: attachmentPath,
    },
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const subscribeToMessages = (conversationId, onMessage) => {
  // Channel names are local pub/sub topics; make this one unique per
  // mount so overlapping subscriptions to the same conversation never
  // collide (see the same issue fixed in NotificationBell).
  const channel = supabase
    .channel(`messages-${conversationId}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      onMessage(payload.new);
    })
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
};