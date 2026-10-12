import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar } from "lucide-react";
import PullToRefresh from "@/components/portal/PullToRefresh";

export default function ClientInvoices() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading: loading } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
      if (!items[0]) return [];
      const invs = await base44.entities.Invoice.filter({ estate_id: items[0].id }, { sort: "-issue_date", limit: 50 });
      return invs.items || [];
    },
  });

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        subtitle="Your engagement statements and payment records."
      />

      <PullToRefresh>
      {invoices.length === 0 ? (
        <SectionCard>
          <EmptyState icon={CreditCard} title="No invoices" description="Your billing statements will appear here." />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-5 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/portal/invoices/${inv.id}`)}>
                <div className="min-w-0">
                  <p className="text-foreground font-medium">{inv.invoice_number}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {inv.description && <span className="truncate">{inv.description}</span>}
                    {inv.due_date && (<><span>·</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {inv.due_date}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-display text-xl text-foreground">${inv.amount.toLocaleString()}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      </PullToRefresh>
    </div>
  );
}