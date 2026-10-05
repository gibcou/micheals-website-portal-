import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatCard, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import RequestFormDialog from "@/components/portal/RequestFormDialog";
import { ClipboardList, FileText, CreditCard, Calendar, MapPin, User, ArrowRight, Building2, Plus } from "lucide-react";

export default function ClientDashboard() {
  const [estate, setEstate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ openRequests: 0, unpaidInvoices: 0, reports: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = async () => {
    try {
      const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
      const est = items[0];
      setEstate(est);
      if (est) {
        const [reqs, invoices, reports] = await Promise.all([
          base44.entities.ServiceRequest.filter({ estate_id: est.id, status: { $in: ["open", "in_progress", "scheduled"] } }, { sort: "-created_date", limit: 5 }),
          base44.entities.Invoice.count({ estate_id: est.id, status: { $in: ["sent", "overdue"] } }),
          base44.entities.WeeklyReport.filter({ estate_id: est.id }, { sort: "-week_of", limit: 3 }),
        ]);
        setRecentRequests(reqs.items || []);
        setStats({ openRequests: (reqs.items || []).length, unpaidInvoices: invoices, reports: (reports.items || []).length });
        setRecentReports(reports.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;
  if (!estate) {
    return (
      <EmptyState
        icon={Building2}
        title="No estate assigned yet"
        description="Your advisor is preparing your estate profile. You'll receive access once onboarding is complete."
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your Estate"
        title={estate.name}
        subtitle="A single view of everything we're caring for on your behalf."
        action={
          <Button onClick={() => setRequestOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1" />New Request
          </Button>
        }
      />

      <SectionCard className="p-6 mb-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoRow icon={MapPin} label="Location" value={estate.address} />
          <InfoRow icon={Building2} label="Estate Type" value={estate.type} />
          <InfoRow icon={User} label="Your Advisor" value={estate.advisor_name || "To be assigned"} />
        </div>
      </SectionCard>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Open Requests" value={stats.openRequests} icon={ClipboardList} />
        <StatCard label="Invoices Due" value={stats.unpaidInvoices} icon={CreditCard} />
        <StatCard label="Reports Filed" value={stats.reports} icon={FileText} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionRowHeader title="Recent Requests" link="/portal/requests" />
          <SectionCard>
            {recentRequests.length === 0 ? (
              <EmptyState title="No active requests" description="Everything is in order." />
            ) : (
              <div className="divide-y divide-border">
                {recentRequests.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.category}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionRowHeader title="Latest Reports" link="/portal/reports" />
          <SectionCard>
            {recentReports.length === 0 ? (
              <EmptyState title="No reports yet" description="Your weekly reports will appear here." />
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((r) => (
                  <Link key={r.id} to="/portal/reports" className="block p-4 hover:bg-secondary/30 transition-colors">
                    <p className="text-sm text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Week of {r.week_of}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <RequestFormDialog
        estate={estate}
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onCreated={load}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5 break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionRowHeader({ title, link }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <Link to={link} className="text-xs text-primary hover:underline flex items-center gap-1">
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-64 bg-secondary rounded mb-8" />
      <div className="h-32 bg-card rounded-lg border border-border mb-8" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="h-24 bg-card rounded-lg border border-border" />
        <div className="h-24 bg-card rounded-lg border border-border" />
        <div className="h-24 bg-card rounded-lg border border-border" />
      </div>
    </div>
  );
}