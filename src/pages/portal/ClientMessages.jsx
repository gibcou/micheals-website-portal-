import React, { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConversations } from "@/lib/conversations";
import { getMessages, sendMessage, subscribeToMessages } from "@/lib/messages";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, Paperclip } from "lucide-react";
import { useSupabase } from "@/lib/supabase/client-react-router";

export default function ClientMessages() {
  const { user, supabase } = useSupabase();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(null);
  const scrollRef = useRef(null);

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedConversation?.id],
    queryFn: () => getMessages(selectedConversation.id),
    enabled: !!selectedConversation,
  });

  const { mutate: doSendMessage, isLoading: isSendingMessage } = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setBody("");
      setAttachment(null);
      queryClient.invalidateQueries(["messages", selectedConversation?.id]);
    },
  });

  useEffect(() => {
    if (selectedConversation) {
      // Refetch (rather than splice the raw payload in) so the sender's
      // profile join is populated for the new message too.
      const subscription = subscribeToMessages(selectedConversation.id, () => {
        queryClient.invalidateQueries(["messages", selectedConversation.id]);
      });
      return () => subscription.unsubscribe();
    }
  }, [selectedConversation, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!body.trim() && !attachment) return;

    let attachmentPath = null;
    if (attachment) {
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(`${selectedConversation.id}/${Date.now()}-${attachment.name}`, attachment);

      if (error) {
        console.error("Error uploading attachment:", error);
        return;
      }
      attachmentPath = data.path;
    }

    doSendMessage({ conversationId: selectedConversation.id, body: body.trim(), attachmentPath });
  };

  if (isLoadingConversations) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100dvh-9rem)]">
      <div className="md:col-span-1 flex flex-col">
        <PageHeader
          eyebrow="Direct Line"
          title="Conversations"
          subtitle="A private channel with your advisor"
        />
        <SectionCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {conversations?.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" description="Your advisor will start a conversation with you." />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 border-b cursor-pointer ${selectedConversation?.id === conv.id ? "bg-secondary" : ""}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <p className="font-semibold">{conv.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message?.[0]?.body || "No messages yet"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
      <div className="md:col-span-2 flex flex-col">
        {selectedConversation ? (
          <SectionCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                messages?.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-4 py-3 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        <p className="text-sm font-semibold">{m.sender?.full_name || "Unknown"}</p>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        {m.attachment_path && (
                          <a
                            href={supabase.storage.from("chat-attachments").getPublicUrl(m.attachment_path).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline mt-2 block"
                          >
                            View Attachment
                          </a>
                        )}
                        <p className={`text-[10px] mt-1.5 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>
            <div className="border-t border-border p-4 flex gap-3 items-center">
              <input type="file" id="file-upload" className="hidden" onChange={(e) => setAttachment(e.target.files[0])} />
              <Button asChild variant="ghost" size="icon">
                <label htmlFor="file-upload">
                  <Paperclip className="h-5 w-5" />
                </label>
              </Button>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write a message..."
                rows={1}
                className="resize-none min-h-[44px] max-h-32"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button onClick={handleSend} disabled={isSendingMessage || (!body.trim() && !attachment)} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </SectionCard>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the list to see messages." />
          </div>
        )}
      </div>
    </div>
  );
}