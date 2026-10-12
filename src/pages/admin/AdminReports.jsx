import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Loader2, Calendar } from "lucide-react";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", week_of: "", estate_id: "", summary: "", actions_taken: "" });

  const load = async () => {
    const { data: reps, error: repsError } = await supabase.from('weekly_reports').select('*').order('week_of', { ascending: false }).limit(100);
    const { data: ests, error: estsError } = await supabase.from('estates').select('*').order('created_at', { ascending: false }).limit(100);

    if (repsError) console.error("Error loading reports", repsError);
    if (estsError) console.error("Error loading estates", estsError);

    setReports(reps || []);
    setEstates(ests || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from('weekly_reports').insert([form]);
    if (error) console.error("Error saving report", error);
    setSaving(false);
    setOpen(false);
    setForm({ title: "", week_of: "", estate_id: "", summary: "", actions_taken: "" });
    load();
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Weekly Reports"
        subtitle="Compose the weekly summary your clients receive every Friday."
        action={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Report</Button>}
      />

      {reports.length === 0 ? (
        <SectionCard><EmptyState icon={FileText} title="No reports yet" description="Create your first weekly report." action={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Report</Button>} /></SectionCard>
      ) : (
        <SectionCard>
          <div className="divide-y divide-border">
            {reports.map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><Calendar className="h-3.5 w-3.5" />Week of {r.week_of}</div>
                <h3 className="font-display text-lg text-foreground">{r.title}</h3>
                <p className="text-xs text-primary mt-0.5">{r.estate_name || "—"}</p>
                {r.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.summary}</p>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">New Weekly Report</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Week of October 6" /></div>
              <div className="space-y-2"><Label htmlFor="week_of">Week Of</Label><Input id="week_of" type="date" value={form.week_of} onChange={(e) => setForm({ ...form, week_of: e.target.value })} required /></div>
            </div>
            <div className="space-y-2">
              <Label>Estate</Label>
              <Select value={form.estate_id} onValueChange={(v) => setForm({ ...form, estate_id: v })} required>
                <SelectTrigger><SelectValue placeholder="Select estate" /></SelectTrigger>
                <SelectContent>{estates.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="summary">Summary</Label><Textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={4} placeholder="The week's overview..." /></div>
            <div className="space-y-2"><Label htmlFor="actions">Actions Taken</Label><Textarea id="actions" value={form.actions_taken} onChange={(e) => setForm({ ...form, actions_taken: e.target.value })} rows={4} placeholder="What was done this week..." /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Publish Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}