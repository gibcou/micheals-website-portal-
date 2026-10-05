import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Loader2, Calendar, FileText } from "lucide-react";

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
    if (items[0]) {
      const invs = await base44.entities.Invoice.filter({ estate_id: items[0].id }, { sort: "-issue_date", limit: 50 });
      setInvoices(invs.items || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    setPaying(true);
    await base44.entities.Invoice.update(selected.id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] });
    setPaying(false);
    setSelected(null);
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        subtitle="Your engagement statements and payment records."
      />

      {invoices.length === 0 ? (
        <SectionCard>
          <EmptyState icon={CreditCard} title="No invoices" description="Your billing statements will appear here." />
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-5 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelected(inv)}>
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Invoice {selected.invoice_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-display text-2xl text-foreground">${selected.amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Issued</span><span>{selected.issue_date || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Due</span><span>{selected.due_date || "—"}</span></div>
                <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground">Status</span><StatusBadge status={selected.status} /></div>
                {selected.description && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground/90">{selected.description}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {selected.status !== "paid" ? (
                  <Button onClick={handlePay} disabled={paying} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {paying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1" />}
                    Mark as Paid
                  </Button>
                ) : (
                  <p className="text-sm text-emerald-400 flex items-center gap-1.5"><FileText className="h-4 w-4" /> Paid{selected.paid_date ? ` on ${selected.paid_date}` : ""}</p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}