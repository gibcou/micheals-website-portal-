import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { StatusBadge } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, CheckSquare } from "lucide-react";

export default function BulkInvoiceUpdate() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState("paid");
  const [applying, setApplying] = useState(false);

  const load = async () => {
    const { items } = await base44.entities.Invoice.filter({}, { sort: "-issue_date", limit: 100 });
    setInvoices(items || []);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = invoices.length > 0 && selected.size === invoices.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(invoices.map((i) => i.id)));

  const apply = async () => {
    setApplying(true);
    const updates = [...selected].map((id) => ({
      id,
      status,
      ...(status === "paid" ? { paid_date: new Date().toISOString().split("T")[0] } : {}),
    }));
    await base44.entities.Invoice.bulkUpdate(updates);
    setApplying(false);
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-secondary/30">
        <label className="flex items-center gap-2.5 text-sm text-foreground/90 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[hsl(var(--primary))] rounded" />
          Select all
        </label>
      </div>
      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground p-5">No invoices to update.</p>
      ) : (
        <div className="divide-y divide-border">
          {invoices.map((inv) => (
            <label key={inv.id} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors">
              <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggle(inv.id)} className="h-4 w-4 accent-[hsl(var(--primary))] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{inv.invoice_number}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="text-primary">{inv.estate_name || "—"}</span>
                  {inv.due_date && (<><span>·</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {inv.due_date}</span></>)}
                </div>
              </div>
              <span className="font-display text-base text-foreground shrink-0 hidden sm:block">${(inv.amount || 0).toLocaleString()}</span>
              <StatusBadge status={inv.status} />
            </label>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="p-4 border-t border-border flex flex-wrap items-center gap-3 bg-secondary/30">
          <span className="flex items-center gap-2 text-sm text-foreground/90"><CheckSquare className="h-4 w-4 text-primary" />{selected.size} selected</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Mark Draft</SelectItem>
              <SelectItem value="sent">Mark Sent</SelectItem>
              <SelectItem value="paid">Mark Paid</SelectItem>
              <SelectItem value="overdue">Mark Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={apply} disabled={applying} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {applying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Apply to Selected
          </Button>
        </div>
      )}
    </div>
  );
}