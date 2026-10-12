import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Loader2, FileText, Calendar } from "lucide-react";

export default function ClientInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const inv = await base44.entities.Invoice.get(id);
        if (!inv) setNotFound(true);
        else setInvoice(inv);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    await base44.entities.Invoice.update(invoice.id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] });
    setInvoice({ ...invoice, status: "paid", paid_date: new Date().toISOString().split("T")[0] });
    setPaying(false);
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Invoice not found.</p>
        <Button variant="outline" onClick={() => navigate("/portal/invoices")}>Back to Invoices</Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/portal/invoices")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Invoices
      </button>

      <PageHeader
        eyebrow="Billing"
        title={`Invoice ${invoice.invoice_number}`}
        subtitle={invoice.estate_name}
        action={<StatusBadge status={invoice.status} />}
      />

      <SectionCard className="p-6">
        <div className="space-y-4 max-w-md">
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-display text-3xl text-foreground">${invoice.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Issued</span>
            <span>{invoice.issue_date || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due</span>
            <span>{invoice.due_date ? <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{invoice.due_date}</span> : "—"}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={invoice.status} />
          </div>
          {invoice.description && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground/90">{invoice.description}</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          {invoice.status !== "paid" ? (
            <Button onClick={handlePay} disabled={paying} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {paying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1" />}
              Mark as Paid
            </Button>
          ) : (
            <p className="text-sm text-emerald-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Paid{invoice.paid_date ? ` on ${invoice.paid_date}` : ""}
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}