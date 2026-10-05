import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import RequestFormDialog from "@/components/portal/RequestFormDialog";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { Plus, ClipboardList } from "lucide-react";

export default function ClientRequests() {
  const [requests, setRequests] = useState([]);
  const [estate, setEstate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
    const est = items[0];
    setEstate(est);
    if (est) {
      const reqs = await base44.entities.ServiceRequest.filter({ estate_id: est.id }, { sort: "-created_date", limit: 50 });
      setRequests(reqs.items || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Service Requests"
        title="Request & Track"
        subtitle="Submit a request and we'll handle it from end to end."
        action={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Request</Button>}
      />

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
              <div key={r.id} className="p-5 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground font-medium">{r.title}</h3>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.photo && <RequestPhoto fileUri={r.photo} className="mt-3 h-40 w-56 rounded-md border border-border" />}
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

      <RequestFormDialog
        estate={estate}
        open={open}
        onOpenChange={setOpen}
        onCreated={load}
      />
    </div>
  );
}