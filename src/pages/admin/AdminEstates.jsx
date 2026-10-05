import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, Loader2, MapPin, User, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const emptyForm = { name: "", address: "", type: "Primary residence", status: "onboarding", client_id: "", advisor_name: "", monthly_retainer: "", notes: "" };

export default function AdminEstates() {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 50 });
    setEstates(items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (est) => { setEditing(est); setForm({ name: est.name, address: est.address, type: est.type, status: est.status, client_id: est.client_id || "", advisor_name: est.advisor_name || "", monthly_retainer: est.monthly_retainer || "", notes: est.notes || "" }); setOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, monthly_retainer: form.monthly_retainer ? Number(form.monthly_retainer) : null };
    if (editing) await base44.entities.Estate.update(editing.id, payload);
    else await base44.entities.Estate.create(payload);
    setSaving(false);
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    await base44.entities.Estate.delete(deleting.id);
    setDeleting(null);
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Estates"
        subtitle="Manage every property and its assigned client."
        action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />Add Estate</Button>}
      />

      {estates.length === 0 ? (
        <SectionCard><EmptyState icon={Building2} title="No estates yet" description="Add your first estate to begin." action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />Add Estate</Button>} /></SectionCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {estates.map((est) => (
            <SectionCard key={est.id} className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-foreground">{est.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><MapPin className="h-3.5 w-3.5" />{est.address}</p>
                </div>
                <StatusBadge status={est.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p><p className="text-foreground/90 mt-0.5">{est.type}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Advisor</p><p className="text-foreground/90 mt-0.5 flex items-center gap-1"><User className="h-3 w-3" />{est.advisor_name || "—"}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Retainer</p><p className="text-foreground/90 mt-0.5">{est.monthly_retainer ? `$${est.monthly_retainer.toLocaleString()}/mo` : "—"}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Client ID</p><p className="text-foreground/90 mt-0.5 truncate font-mono text-xs">{est.client_id || "—"}</p></div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(est)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(est)}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Edit Estate" : "New Estate"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Estate Name</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Client User ID</Label>
              <Input value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} placeholder="The client's user ID (from App Users)" required />
              <p className="text-xs text-muted-foreground">Find this in the App Users dashboard. The client will only see this estate's data.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="Primary residence">Primary residence</SelectItem><SelectItem value="Second home / vacation estate">Second home</SelectItem><SelectItem value="Investment property">Investment</SelectItem><SelectItem value="Commercial property">Commercial</SelectItem><SelectItem value="Land / ranch">Land / ranch</SelectItem>
              </SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="active">Active</SelectItem><SelectItem value="onboarding">Onboarding</SelectItem><SelectItem value="paused">Paused</SelectItem>
              </SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="advisor">Advisor Name</Label><Input id="advisor" value={form.advisor_name} onChange={(e) => setForm({ ...form, advisor_name: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="retainer">Monthly Retainer ($)</Label><Input id="retainer" type="number" value={form.monthly_retainer} onChange={(e) => setForm({ ...form, monthly_retainer: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{editing ? "Save Changes" : "Create Estate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Delete estate?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {deleting?.name}. Its requests, reports, invoices and messages will remain but become unlinked. This cannot be undone.</AlertDialogDescription>
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