import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Download } from "lucide-react";
import PullToRefresh from "@/components/portal/PullToRefresh";
import { downloadInvoicePdf } from "@/lib/pdf";

export default function ClientInvoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading: loading } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: estates, error: estateError } = await supabase.from('estates').select('id').eq('client_id', user.id);
      if (estateError) console.error("Error fetching estates", estateError);
      if (!estates || estates.length === 0) return [];
      const { data: invs, error: invsError } = await supabase.from('invoices').select('*').in('estate_id', estates.map((e) => e.id)).order('issue_date', { ascending: false }).limit(50);
      if (invsError) console.error("Error fetching invoices", invsError);
      return invs || [];
    },
  });

  const handlePay = async (inv) => {
    const paidDate = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from('invoices').update({ status: "paid", paid_date: paidDate }).eq('id', inv.id);
    if (error) console.error("Error paying invoice", error);
    queryClient.invalidateQueries({ queryKey: ["portal", "invoices"] });
  };

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
                  {inv.estate_name && <p className="text-xs text-primary mt-0.5">{inv.estate_name}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {inv.description && <span className="truncate">{inv.description}</span>}
                    {inv.due_date && (<><span>·</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {inv.due_date}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-display text-xl text-foreground">${inv.amount.toLocaleString()}</span>
                  {inv.status !== "paid" && (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handlePay(inv); }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" />Pay
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); downloadInvoicePdf(inv); }}
                    aria-label="Download invoice PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
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