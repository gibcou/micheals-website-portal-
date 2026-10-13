import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RequestFormDialog from "@/components/portal/RequestFormDialog";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { Plus, ClipboardList, Calendar } from "lucide-react";
import PullToRefresh from "@/components/portal/PullToRefresh";

export default function ClientRequests() {
  const { effectiveClientId } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  // Loaded through React Query so pull-to-refresh can refetch active queries
  const { data, isLoading: loading } = useQuery({
    queryKey: ["portal", "requests", effectiveClientId],
    enabled: !!effectiveClientId,
    queryFn: async () => {
      const { data: estates, error: estateError } = await supabase
        .from('estates')
        .select('*')
        .eq('client_id', effectiveClientId)
        .order('created_at', { ascending: false });

      if (estateError) {
        console.error("Error fetching estates", estateError);
        return { estates: [], requests: [] };
      }

      if (!estates || estates.length === 0) {
        return { estates: [], requests: [] };
      }

      const { data: reqs, error: reqsError } = await supabase
        .from('service_requests')
        .select('*')
        .in('estate_id', estates.map((e) => e.id))
        .order('created_at', { ascending: false })
        .limit(50);

      if (reqsError) {
        console.error("Error fetching service requests", reqsError);
        return { estates, requests: [] };
      }

      return { estates, requests: reqs || [] };
    },
  });
  const estates = data?.estates || [];
  const requests = data?.requests || [];

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Service Requests"
        title="Request & Track"
        subtitle="Submit a request and we'll handle it from end to end."
        action={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Request</Button>}
      />

      <PullToRefresh>
      {requests.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={ClipboardList}
            title="No requests yet"
            description="Submit your first service request and your advisor will take it from there."
            action={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Request</Button>}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="p-5 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setViewing(r)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground font-medium">{r.title}</h3>
                    {r.estate_name && <p className="text-xs text-primary mt-0.5">{r.estate_name}</p>}
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.photo_url && <RequestPhoto fileUri={r.photo_url} className="mt-3 h-40 w-56 rounded-md border border-border" />}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{r.category}</span>
                      <span>·</span>
                      <span className="capitalize">{r.priority} priority</span>
                      {r.scheduled_date && (<><span>·</span><span>Scheduled {r.scheduled_date}</span></>)}
                      {r.assigned_to && (<><span>·</span><span>{r.assigned_to}</span></>)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      </PullToRefresh>

      <RequestFormDialog
        estates={estates}
        open={open}
        onOpenChange={setOpen}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["portal", "requests"] })}
      />

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
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Property</p><p className="text-foreground/90 mt-0.5">{viewing.estate_name || "—"}</p></div>
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