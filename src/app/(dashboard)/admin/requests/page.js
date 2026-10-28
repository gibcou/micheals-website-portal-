"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { ClipboardList, Calendar } from "lucide-react";

const statuses = ["open", "in_progress", "scheduled", "completed", "cancelled"];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from('service_requests').select('*').order('created_at', { ascending: false }).limit(100);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading service requests', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setViewing((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    await supabase.from('service_requests').update({ status }).eq('id', id);
    await supabase.functions.invoke("notifyRequestStatus", { body: { request_id: id, status } });
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Service Requests" subtitle="Triage and update every request across all estates." />

      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <FilterChip label="All" value="all" current={filter} onClick={setFilter} />
        {statuses.map((s) => <FilterChip key={s} label={s.replace(/_/g, " ")} value={s} current={filter} onClick={setFilter} />)}
      </div>

      {requests.length === 0 ? (
        <SectionCard><EmptyState icon={ClipboardList} title="No requests" description="Requests matching this filter will appear here." /></SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="p-5 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setViewing(r)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground font-medium">{r.title}</h3>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.photo_url && <RequestPhoto fileUri={r.photo_url} className="mt-3 h-40 w-56 rounded-md border border-border" />}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="text-primary">{r.estate_name || "—"}</span>
                      <span>·</span><span>{r.category}</span>
                      <span>·</span><span className="capitalize">{r.priority} priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={r.status} />
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{viewing.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={viewing.status} />
                  <StatusBadge status={viewing.priority} />
                </div>
                {viewing.description && (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{viewing.description}</p>
                )}
                {viewing.photo_url && <RequestPhoto fileUri={viewing.photo_url} className="rounded-lg aspect-video object-cover w-full" />}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Estate</p><p className="text-foreground/90 mt-0.5">{viewing.estate_name || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Category</p><p className="text-foreground/90 mt-0.5 capitalize">{viewing.category || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Assigned To</p><p className="text-foreground/90 mt-0.5">{viewing.assigned_to || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Scheduled</p><p className="text-foreground/90 mt-0.5">{viewing.scheduled_date || "—"}</p></div>
                </div>
                {viewing.created_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-border">
                    <Calendar className="h-3.5 w-3.5" /> Submitted {new Date(viewing.created_at).toLocaleString()}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Select value={viewing.status} onValueChange={(v) => updateStatus(viewing.id, v)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ label, value, current, onClick }) {
  const active = current === value;
  return (
    <button onClick={() => onClick(value)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>
      {label}
    </button>
  );
}