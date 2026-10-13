import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { Flame, Calendar } from "lucide-react";

const ACTIVE_STATUSES = ["open", "in_progress", "scheduled"];
const PRIORITY_ORDER = ["urgent", "high", "medium", "low"];

export default function AdminActiveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: items, error } = await supabase
          .from('service_requests')
          .select('*')
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Error fetching active requests:', error);
          // Optionally, you could set an error state here and display it in the UI
        } else {
          setRequests((items || []).sort(
            (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
          ));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Needs Attention"
        subtitle="Every active request across all estates, ordered by priority — urgent first."
      />

      {requests.length === 0 ? (
        <SectionCard><EmptyState icon={Flame} title="Nothing pending" description="No active service requests right now." /></SectionCard>
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
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={r.priority} />
                    <StatusBadge status={r.status} />
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
                  <StatusBadge status={viewing.priority} />
                  <StatusBadge status={viewing.status} />
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
                <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}