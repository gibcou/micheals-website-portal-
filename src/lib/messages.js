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
  const { data, error } = await supabase.from('messages').insert([
    {
      conversation_id: conversationId,
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
  const subscription = supabase
    .from(`messages:conversation_id=eq.${conversationId}`)
    .on('INSERT', (payload) => {
      onMessage(payload.new);
    })
    .subscribe();

  return subscription;
};