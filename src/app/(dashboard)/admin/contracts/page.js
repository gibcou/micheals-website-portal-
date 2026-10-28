"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { sendForSignature, markSigned, isDocuSignConnected } from "@/lib/docusign";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Plus, Loader2, RefreshCw, Send, Check, AlertTriangle, Download } from "lucide-react";
import { downloadContractPdf } from "@/lib/pdf";

const emptyForm = { title: "", client_id: "", estate_id: "", start_date: "", end_date: "", notes: "" };
const RENEWAL_WINDOW_DAYS = 60;

export default function AdminContracts() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [renewingFrom, setRenewingFrom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actingOn, setActingOn] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    const [{ data: contractData, error: contractError }, { data: clientData, error: clientError }, { data: estateData, error: estateError }] = await Promise.all([
      supabase.from("contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email").eq("role", "client").order("full_name"),
      supabase.from("estates").select("id, name, client_id").order("name"),
    ]);
    if (contractError) console.error("Error loading contracts", contractError);
    if (clientError) console.error("Error loading clients", clientError);
    if (estateError) console.error("Error loading estates", estateError);
    setContracts(contractData || []);
    setClients(clientData || []);
    setEstates(estateData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const needsRenewal = (c) => {
    if (c.status !== "signed" || !c.end_date) return false;
    const daysLeft = (new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= RENEWAL_WINDOW_DAYS;
  };

  const filtered = useMemo(() => {
    if (filter === "all") return contracts;
    if (filter === "renewal") return contracts.filter(needsRenewal);
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const estatesForClient = (clientId) => estates.filter((e) => e.client_id === clientId);

  const openNew = () => { setRenewingFrom(null); setForm(emptyForm); setOpen(true); };

  const openRenew = (contract) => {
    setRenewingFrom(contract);
    const newStart = contract.end_date ? new Date(new Date(contract.end_date).getTime() + 86400000).toISOString().slice(0, 10) : "";
    setForm({
      title: contract.title,
      client_id: contract.client_id,
      estate_id: contract.estate_id,
      start_date: newStart,
      end_date: "",
      notes: "",
    });
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const estate = estates.find((x) => x.id === form.estate_id);
    const payload = {
      title: form.title,
      client_id: form.client_id,
      estate_id: form.estate_id,
      estate_name: estate?.name || "",
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes,
      contract_type: renewingFrom ? "renewal" : "new",
      renews_contract_id: renewingFrom?.id || null,
    };
    const { error } = await supabase.from("contracts").insert([payload]);
    if (error) console.error("Error creating contract", error);
    setSaving(false);
    setOpen(false);
    setRenewingFrom(null);
    setForm(emptyForm);
    load();
  };

  const handleSend = async (contract) => {
    setActingOn(contract.id);
    try {
      await sendForSignature(contract.id);
      load();
    } catch (err) {
      console.error("Error sending contract for signature", err);
    }
    setActingOn(null);
  };

  const handleMarkSigned = async (contract) => {
    setActingOn(contract.id);
    try {
      await markSigned(contract.id);
      load();
    } catch (err) {
      console.error("Error marking contract signed", err);
    }
    setActingOn(null);
  };

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  const filters = [
    { key: "all", label: "All" },
    { key: "renewal", label: "Needs Renewal" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "signed", label: "Signed" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Contracts"
        subtitle="Track each estate's service contract and renewals."
        action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Contract</Button>}
      />

      {!isDocuSignConnected && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>DocuSign isn&apos;t connected yet, so &quot;Send for Signature&quot; only tracks status here — no real envelope or email goes out. Connect your DocuSign credentials to send and collect real e-signatures.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <SectionCard><EmptyState icon={FileSignature} title="No contracts" description="Create your first contract to begin." action={<Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New Contract</Button>} /></SectionCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const client = clients.find((cl) => cl.id === c.client_id);
            return (
              <SectionCard key={c.id} className="p-5 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setViewing(c)}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg text-foreground">{c.title}</h3>
                      {c.contract_type === "renewal" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                          <RefreshCw className="h-2.5 w-2.5" />Renewal
                        </span>
                      )}
                      {needsRenewal(c) && <StatusBadge status="expired" />}
                    </div>
                    <p className="text-sm text-primary mt-0.5">{c.estate_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{client?.full_name || client?.email || "—"}</p>
                    {(c.start_date || c.end_date) && (
                      <p className="text-xs text-muted-foreground mt-1">{c.start_date || "—"} &rarr; {c.end_date || "—"}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={c.status} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); downloadContractPdf(c); }} aria-label="Download contract PDF">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {c.status === "draft" && (
                      <Button variant="ghost" size="sm" disabled={actingOn === c.id} onClick={(e) => { e.stopPropagation(); handleSend(c); }}>
                        {actingOn === c.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}Send for Signature
                      </Button>
                    )}
                    {c.status === "sent" && (
                      <Button variant="ghost" size="sm" disabled={actingOn === c.id} onClick={(e) => { e.stopPropagation(); handleMarkSigned(c); }}>
                        {actingOn === c.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}Mark Signed
                      </Button>
                    )}
                    {(needsRenewal(c) || c.status === "expired") && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openRenew(c); }}>
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />Renew
                      </Button>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{renewingFrom ? "Renew Contract" : "New Contract"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Annual Service Agreement" /></div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, estate_id: "" })} disabled={!!renewingFrom}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}{c.email ? ` (${c.email})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estate</Label>
              <Select value={form.estate_id} onValueChange={(v) => setForm({ ...form, estate_id: v })} disabled={!!renewingFrom || !form.client_id}>
                <SelectTrigger><SelectValue placeholder={form.client_id ? "Select an estate" : "Select a client first"} /></SelectTrigger>
                <SelectContent>
                  {estatesForClient(form.client_id).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="start">Start Date</Label><Input id="start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="end">End Date</Label><Input id="end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.client_id || !form.estate_id} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{renewingFrom ? "Create Renewal" : "Create Contract"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          {viewing && (() => {
            const client = clients.find((cl) => cl.id === viewing.client_id);
            const renewsContract = viewing.renews_contract_id ? contracts.find((c) => c.id === viewing.renews_contract_id) : null;
            const renewedBy = contracts.find((c) => c.renews_contract_id === viewing.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">{viewing.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={needsRenewal(viewing) ? "expired" : viewing.status} />
                    {viewing.contract_type === "renewal" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                        <RefreshCw className="h-2.5 w-2.5" />Renewal
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Estate</p><p className="text-foreground/90 mt-0.5">{viewing.estate_name}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Client</p><p className="text-foreground/90 mt-0.5">{client?.full_name || client?.email || "—"}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Start Date</p><p className="text-foreground/90 mt-0.5">{viewing.start_date || "—"}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">End Date</p><p className="text-foreground/90 mt-0.5">{viewing.end_date || "—"}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Sent</p><p className="text-foreground/90 mt-0.5">{viewing.sent_at ? new Date(viewing.sent_at).toLocaleString() : "—"}</p></div>
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Signed</p><p className="text-foreground/90 mt-0.5">{viewing.signed_at ? new Date(viewing.signed_at).toLocaleString() : "—"}</p></div>
                  </div>
                  {viewing.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{viewing.notes}</p>
                    </div>
                  )}
                  {(renewsContract || renewedBy) && (
                    <div className="pt-4 border-t border-border space-y-1 text-sm">
                      {renewsContract && <p className="text-muted-foreground">Renews <span className="text-foreground/90">{renewsContract.title}</span></p>}
                      {renewedBy && <p className="text-muted-foreground">Renewed by <span className="text-foreground/90">{renewedBy.title}</span></p>}
                    </div>
                  )}
                  {viewing.document_url && (
                    <a href={viewing.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block pt-2">
                      View Document
                    </a>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => downloadContractPdf(viewing)}>
                    <Download className="h-4 w-4 mr-1" />Download PDF
                  </Button>
                  {viewing.status === "draft" && (
                    <Button disabled={actingOn === viewing.id} onClick={() => { handleSend(viewing); setViewing(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Send className="h-4 w-4 mr-1" />Send for Signature
                    </Button>
                  )}
                  {viewing.status === "sent" && (
                    <Button disabled={actingOn === viewing.id} onClick={() => { handleMarkSigned(viewing); setViewing(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Check className="h-4 w-4 mr-1" />Mark Signed
                    </Button>
                  )}
                  {(needsRenewal(viewing) || viewing.status === "expired") && (
                    <Button onClick={() => { openRenew(viewing); setViewing(null); }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <RefreshCw className="h-4 w-4 mr-1" />Renew
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}