import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, Loader2, Calendar, Pencil, Trash2 } from "lucide-react";

const emptyForm = { invoice_number: "", estate_id: "", amount: "", issue_date: "", due_date: "", description: "", status: "sent" };

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [invs, ests] = await Promise.all([
      base44.entities.Invoice.filter({}, { sort: "-issue_date", limit: 100 }),
      base44.entities.Estate.filter({}, { sort: "-created_date", limit: 100 }),
    ]);
    setInvoices(invs.items || []);
    setEstates(ests.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      invoice_number: inv.invoice_number || "",
      estate_id: inv.estate_id || "",
      amount: inv.amount != null ? String(inv.amount) : "",
      issue_date: inv.issue_date || "",
      due_date: inv.due_date || "",
      description: inv.description || "",
      status: inv.status || "sent",
    });
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const est = estates.find((x) => x.id === form.estate_id);
    const payload = {
      invoice_number: form.invoice_number,
      estate_id: form.estate_id,
      estate_name: est?.name || "",
      client_id: est?.client_id || "",
      amount: Number(form.amount),
      issue_date: form.issue_date,
      due_date: form.due_date,
      description: form.description,
      status: form.status,
      ...(form.status === "paid" && !editing?.paid_date ? { paid_date: new Date().toISOString().split("T")[0] } : {}),
    };
    if (editing) await base44.entities.Invoice.update(editing.id, payload);
    else await base44.entities.Invoice.create(payload);
    setSaving(false);
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    load();
  };

  const confirmDelete = async () => {
    await base44.entities.Invoice.delete(deleting.id);
    setDeleting(null);
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Invoices"
        subtitle="Issue billing statements to your clients."
        action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Invoice</Button>}
      />

      {invoices.length === 0 ? (
        <SectionCard><EmptyState icon={CreditCard} title="No invoices" description="Create your first invoice." action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Invoice</Button>} /></SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-foreground font-medium">{inv.invoice_number}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="text-primary">{inv.estate_name || "—"}</span>
                    {inv.due_date && (<><span>·</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {inv.due_date}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display text-xl text-foreground hidden sm:block">${(inv.amount || 0).toLocaleString()}</span>
                  <StatusBadge status={inv.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)} aria-label="Edit invoice"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(inv)} aria-label="Delete invoice"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="inv_num">Invoice Number</Label><Input id="inv_num" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} required placeholder="INV-001" /></div>
              <div className="space-y-2"><Label htmlFor="amount">Amount ($)</Label><Input id="amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            </div>
            <div className="space-y-2">
              <Label>Estate</Label>
              <Select value={form.estate_id} onValueChange={(v) => setForm({ ...form, estate_id: v })} required>
                <SelectTrigger><SelectValue placeholder="Select estate" /></SelectTrigger>
                <SelectContent>{estates.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="issue">Issue Date</Label><Input id="issue" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="due">Due Date</Label><Input id="due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Monthly retainer — October 2026" /></div>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent></Select></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? "Save Changes" : "Create Invoice"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete invoice {deleting?.invoice_number}. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-input bg-transparent hover:bg-accent hover:text-accent-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}