import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
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
        const { data: estates, error: estatesError } = await supabase.from('estates').select('*', { count: 'exact' });
        const { data: openReqs, error: openReqsError } = await supabase.from('service_requests').select('*', { count: 'exact' }).in('status', ['open', 'in_progress']);
        const { data: unpaid, error: unpaidError } = await supabase.from('invoices').select('*', { count: 'exact' }).in('status', ['sent', 'overdue']);
        const { data: reports, error: reportsError } = await supabase.from('weekly_reports').select('*', { count: 'exact' });
        const { data: reqs, error: reqsError } = await supabase.from('service_requests').select('*').order('created_at', { ascending: false }).limit(5);

        if (estatesError) console.error("Error loading estates", estatesError);
        if (openReqsError) console.error("Error loading open requests", openReqsError);
        if (unpaidError) console.error("Error loading unpaid invoices", unpaidError);
        if (reportsError) console.error("Error loading reports", reportsError);
        if (reqsError) console.error("Error loading recent requests", reqsError);

        setStats({ estates: estates?.length || 0, openRequests: openReqs?.length || 0, unpaidInvoices: unpaid?.length || 0, reports: reports?.length || 0 });
        setRecentRequests(reqs || []);

        const { data: invAgg, error: invAggError } = await supabase.from('invoices').select('status, amount');
        if (invAggError) console.error("Error aggregating invoices", invAggError);
        else {
          const invAggData = invAgg.reduce((acc, curr) => {
            const existing = acc.find(item => item.status === curr.status);
            if (existing) {
              existing.sum_amount += curr.amount;
              existing.count += 1;
            } else {
              acc.push({ status: curr.status, sum_amount: curr.amount, count: 1 });
            }
            return acc;
          }, []);
          setInvoiceStatuses(invAggData);
        }

        const { data: reqAgg, error: reqAggError } = await supabase.from('service_requests').select('status');
        if (reqAggError) console.error("Error aggregating requests", reqAggError);
        else {
          const reqAggData = reqAgg.reduce((acc, curr) => {
            const existing = acc.find(item => item.status === curr.status);
            if (existing) {
              existing.count += 1;
            } else {
              acc.push({ status: curr.status, count: 1 });
            }
            return acc;
          }, []);
          setRequestStatuses(reqAggData);
        }
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