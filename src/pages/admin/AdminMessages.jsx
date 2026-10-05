import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, ArrowLeft, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminMessages() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = async () => {
    const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 100 });
    setConversations(items || []);
    const counts = await base44.entities.Message.aggregate({ query: { from_role: "client", read: false }, groupBy: "estate_id" });
    const map = {};
    (counts.rows || []).forEach((row) => { map[row.estate_id] = row.count; });
    setUnread(map);
    setLoading(false);
  };

  const loadThread = async (est) => {
    if (!est) return;
    const msgs = await base44.entities.Message.filter({ estate_id: est.id }, { sort: "created_date", limit: 200 });
    setMessages(msgs.items || []);
    if ((msgs.items || []).some((m) => m.from_role === "client" && !m.read)) {
      await base44.entities.Message.updateMany({ estate_id: est.id, from_role: "client", read: false }, { $set: { read: true } });
      setUnread((u) => ({ ...u, [est.id]: 0 }));
    }
  };

  useEffect(() => { loadConversations(); }, []);

  // Live updates: incoming messages appear instantly on both sides
  useEffect(() => {
    const unsubscribe = base44.entities.Message.subscribe(() => {
      loadConversations();
      if (selected) loadThread(selected);
    });
    return unsubscribe;
  }, [selected?.id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSelect = async (est) => {
    setSelected(est);
    setMessages([]);
    await loadThread(est);
  };

  const handleSend = async () => {
    if (!body.trim() || !selected) return;
    setSending(true);
    const created = await base44.entities.Message.create({
      estate_id: selected.id,
      client_id: selected.client_id,
      body: body.trim(),
      from_role: "admin",
      read: false,
    });
    setBody("");
    setSending(false);
    await loadThread(selected);
    base44.functions.invoke("notifyNewMessage", { message_id: created.id }).catch((e) => console.error(e));
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Direct Line"
        title="Messages"
        subtitle="Conversations with your clients across all managed estates."
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Conversation list */}
        <div className={cn(selected ? "hidden" : "block", "lg:block")}>
          <SectionCard>
            {conversations.length === 0 ? (
              <EmptyState icon={Building2} title="No estates yet" description="Conversations appear once estates are added." />
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => handleSelect(est)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 flex items-center justify-between gap-2 hover:bg-secondary/40 transition-colors",
                      selected?.id === est.id && "bg-primary/10"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{est.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {est.advisor_name || "Unassigned advisor"}
                      </p>
                    </div>
                    {unread[est.id] > 0 && (
                      <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                        {unread[est.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Thread */}
        <div className={cn(selected ? "block" : "hidden", "lg:block")}>
          {!selected ? (
            <SectionCard>
              <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose an estate from the list to open its thread." />
            </SectionCard>
          ) : (
            <SectionCard className="flex flex-col h-[calc(100vh-14rem)] min-h-0 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden shrink-0"
                  onClick={() => { setSelected(null); setMessages([]); }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selected.advisor_name ? `Advisor: ${selected.advisor_name}` : "No advisor assigned"}
                  </p>
                </div>
              </div>

              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState icon={MessageSquare} title="No messages yet" description="Start the conversation with this client." />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m) => {
                    const mine = m.from_role === "admin";
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
          )}
        </div>
      </div>
    </div>
  );
}