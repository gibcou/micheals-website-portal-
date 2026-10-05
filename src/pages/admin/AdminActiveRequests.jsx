import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { Flame } from "lucide-react";

const ACTIVE_STATUSES = ["open", "in_progress", "scheduled"];
const PRIORITY_ORDER = ["urgent", "high", "medium", "low"];

export default function AdminActiveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.ServiceRequest.filter(
          { status: { $in: ACTIVE_STATUSES } },
          { sort: "-created_date", limit: 200 }
        );
        setRequests((items || []).sort(
          (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
        ));
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
              <div key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground font-medium">{r.title}</h3>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.photo && <RequestPhoto fileUri={r.photo} className="mt-3 h-40 w-56 rounded-md border border-border" />}
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
    </div>
  );
}