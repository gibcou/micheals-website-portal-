import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatCard, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import RequestStatusChart from "@/components/admin/RequestStatusChart";
import BulkInvoiceUpdate from "@/components/admin/BulkInvoiceUpdate";
import { Building2, ClipboardList, CreditCard, FileText, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ estates: 0, openRequests: 0, unpaidInvoices: 0, reports: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [estates, openReqs, unpaid, reports, reqs, invAgg, reqAgg] = await Promise.all([
          base44.entities.Estate.count({}),
          base44.entities.ServiceRequest.count({ status: { $in: ["open", "in_progress"] } }),
          base44.entities.Invoice.count({ status: { $in: ["sent", "overdue"] } }),
          base44.entities.WeeklyReport.count({}),
          base44.entities.ServiceRequest.filter({}, { sort: "-created_date", limit: 5 }),
          base44.entities.Invoice.aggregate({ groupBy: "status", sum: "amount" }),
          base44.entities.ServiceRequest.aggregate({ groupBy: "status" }),
        ]);
        setStats({ estates, openRequests: openReqs, unpaidInvoices: unpaid, reports });
        setRecentRequests(reqs.items || []);
        setInvoiceStatuses(invAgg.rows || []);
        setRequestStatuses(reqAgg.rows || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Dashboard" subtitle="An overview of every estate under your care." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Estates" value={stats.estates} icon={Building2} />
        <StatCard label="Open Requests" value={stats.openRequests} icon={ClipboardList} />
        <StatCard label="Invoices Due" value={stats.unpaidInvoices} icon={CreditCard} />
        <StatCard label="Reports Filed" value={stats.reports} icon={FileText} />
      </div>

      <div className="mb-6">
        <SectionRowHeader title="Request Status" link="/admin/requests" />
        <SectionCard>
          <RequestStatusChart rows={requestStatuses} />
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionRowHeader title="Recent Requests" link="/admin/requests" />
          <SectionCard>
            {recentRequests.length === 0 ? (
              <EmptyState title="No requests" description="Service requests will appear here." />
            ) : (
              <div className="divide-y divide-border">
                {recentRequests.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.estate_name || "—"} · {r.category}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div>
          <SectionRowHeader title="Quick Actions" link="/admin/estates" />
          <SectionCard className="p-2">
            <QuickLink to="/admin/estates" icon={Building2} label="Manage Estates" />
            <QuickLink to="/admin/reports" icon={FileText} label="Create Weekly Report" />
            <QuickLink to="/admin/invoices" icon={CreditCard} label="Create Invoice" />
            <QuickLink to="/admin/requests" icon={ClipboardList} label="Triage Requests" />
          </SectionCard>
        </div>
      </div>

      <div className="mt-6">
        <SectionRowHeader title="Invoice Status" link="/admin/invoices" />
        {invoiceStatuses.length === 0 ? (
          <SectionCard><EmptyState title="No invoices" description="Invoices will appear here once created." /></SectionCard>
        ) : (
          <SectionCard>
            <div className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
              {STATUS_ORDER.filter((s) => invoiceStatuses.some((r) => r.status === s)).map((status, i) => {
                const row = invoiceStatuses.find((r) => r.status === status);
                return (
                  <div key={status} className={`p-4 flex items-center justify-between gap-4 ${i > 0 ? "border-t border-border sm:border-t-0" : ""} ${i === 2 ? "sm:border-t" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-border" : ""}`}>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={status} />
                      <div>
                        <p className="text-sm text-foreground">{row.count} invoice{row.count === 1 ? "" : "s"}</p>
                        <p className="text-xs text-muted-foreground">{status === "paid" ? "Paid" : "Pending"}</p>
                      </div>
                    </div>
                    <span className="font-display text-lg text-foreground">${(row.sum_amount || 0).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}
      </div>

      <div className="mt-6">
        <SectionRowHeader title="Bulk Update Invoices" link="/admin/invoices" />
        <SectionCard>
          <BulkInvoiceUpdate />
        </SectionCard>
      </div>
    </div>
  );
}

const STATUS_ORDER = ["draft", "sent", "overdue", "paid"];

function SectionRowHeader({ title, link }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <Link to={link} className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 rounded-md hover:bg-secondary/50 transition-colors text-sm text-foreground">
      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
      {label}
    </Link>
  );
}