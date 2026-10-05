import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";

export default function ClientMessages() {
  const [estate, setEstate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = async () => {
    const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
    const est = items[0];
    setEstate(est);
    if (est) {
      const msgs = await base44.entities.Message.filter({ estate_id: est.id }, { sort: "created_date", limit: 100 });
      setMessages(msgs.items || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Live updates: messages from your advisor appear instantly
  useEffect(() => {
    if (!estate) return;
    const unsubscribe = base44.entities.Message.subscribe(() => { load(); });
    return unsubscribe;
  }, [estate?.id]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!body.trim() || !estate) return;
    setSending(true);
    const created = await base44.entities.Message.create({
      estate_id: estate.id,
      client_id: estate.client_id,
      body: body.trim(),
      from_role: "client",
      read: false,
    });
    setBody("");
    setSending(false);
    load();
    base44.functions.invoke("notifyNewMessage", { message_id: created.id }).catch((e) => console.error(e));
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        eyebrow="Direct Line"
        title="Messages"
        subtitle={`A private channel with your advisor${estate?.advisor_name ? `, ${estate.advisor_name}` : ""}.`}
      />

      <SectionCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" description="Start the conversation with your advisor." />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => {
              const mine = m.from_role === "client";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-3 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                    <p className={`text-[10px] mt-1.5 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(m.created_date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}

        <div className="border-t border-border p-4 flex gap-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message..."
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={sending || !body.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}