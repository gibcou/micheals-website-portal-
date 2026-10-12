
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_messages_conversation_id_created_at ON messages(conversation_id, created_at);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Function to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'client'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is a participant in a conversation
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Profiles
CREATE POLICY "Users can read their own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Conversations
CREATE POLICY "Users can see conversations they are a part of" ON conversations FOR SELECT USING (is_conversation_participant(id));

-- Conversation Participants
CREATE POLICY "Users can see participants of conversations they are in" ON conversation_participants FOR SELECT USING (is_conversation_participant(conversation_id));

-- Messages
CREATE POLICY "Users can see messages in conversations they are a part of" ON messages FOR SELECT USING (is_conversation_participant(conversation_id));
CREATE POLICY "Users can insert messages into conversations they belong to" ON messages FOR INSERT WITH CHECK (is_conversation_participant(conversation_id) AND sender_id = auth.uid());

-- Admins
CREATE POLICY "Admins can create conversations" ON conversations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can add participants to conversations" ON conversation_participants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Storage
CREATE POLICY "Participants can upload to conversation folder" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-attachments' AND is_conversation_participant( (storage.foldername(name))[1]::uuid ));
CREATE POLICY "Participants can read from conversation folder" ON storage.objects FOR SELECT USING (bucket_id = 'chat-attachments' AND is_conversation_participant( (storage.foldername(name))[1]::uuid ));

-- Add messages table to publication for realtime

-- Create estates table
CREATE TABLE estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  type TEXT,
  advisor_name TEXT,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create weekly_reports table
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  week_of DATE NOT NULL,
  estate_id UUID NOT NULL REFERENCES estates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can see their own estate" ON estates FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users can see requests for their own estate" ON service_requests FOR SELECT USING (estate_id IN (SELECT id FROM estates WHERE client_id = auth.uid()));
CREATE POLICY "Users can see invoices for their own estate" ON invoices FOR SELECT USING (estate_id IN (SELECT id FROM estates WHERE client_id = auth.uid()));
CREATE POLICY "Users can see reports for their own estate" ON weekly_reports FOR SELECT USING (estate_id IN (SELECT id FROM estates WHERE client_id = auth.uid()));

-- Add new tables to publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE estates;
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_reports;


