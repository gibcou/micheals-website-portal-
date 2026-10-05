import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RequestPhoto from "@/components/portal/RequestPhoto";
import { ClipboardList } from "lucide-react";

const statuses = ["open", "in_progress", "scheduled", "completed", "cancelled"];

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const query = filter === "all" ? {} : { status: filter };
    const { items } = await base44.entities.ServiceRequest.filter(query, { sort: "-created_date", limit: 100 });
    setRequests(items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    await base44.functions.invoke("notifyRequestStatus", { request_id: id, status });
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
              <div key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-foreground font-medium">{r.title}</h3>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.photo && <RequestPhoto fileUri={r.photo} className="mt-3 h-40 w-56 rounded-md border border-border" />}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="text-primary">{r.estate_name || "—"}</span>
                      <span>·</span><span>{r.category}</span>
                      <span>·</span><span className="capitalize">{r.priority} priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={r.status} />
                    <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
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