import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileSignature, ExternalLink, Download } from "lucide-react";
import { downloadContractPdf } from "@/lib/pdf";

export default function ClientContracts() {
  const { effectiveClientId } = useOutletContext() || {};
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!effectiveClientId) return;
    const load = async () => {
      const { data, error } = await supabase.from("contracts").select("*").eq("client_id", effectiveClientId).order("created_at", { ascending: false });
      if (error) console.error("Error loading contracts", error);
      setContracts(data || []);
      setLoading(false);
    };
    load();
  }, [effectiveClientId]);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Contracts"
        title="Agreements & Renewals"
        subtitle="Service contracts for your properties, including anything up for renewal."
      />

      {contracts.length === 0 ? (
        <SectionCard><EmptyState icon={FileSignature} title="No contracts yet" description="Contracts your advisor sends will appear here." /></SectionCard>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <SectionCard key={c.id} className="p-5 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setViewing(c)}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-foreground">{c.title}</h3>
                  <p className="text-sm text-primary mt-0.5">{c.estate_name}</p>
                  {(c.start_date || c.end_date) && (
                    <p className="text-xs text-muted-foreground mt-1">{c.start_date || "—"} → {c.end_date || "—"}</p>
                  )}
                  {c.status === "sent" && (
                    <p className="text-xs text-muted-foreground mt-2">Your advisor will send a DocuSign link to review and sign shortly.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); downloadContractPdf(c); }} aria-label="Download contract PDF">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{viewing.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <StatusBadge status={viewing.status} />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Property</p><p className="text-foreground/90 mt-0.5">{viewing.estate_name}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Start Date</p><p className="text-foreground/90 mt-0.5">{viewing.start_date || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">End Date</p><p className="text-foreground/90 mt-0.5">{viewing.end_date || "—"}</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Signed</p><p className="text-foreground/90 mt-0.5">{viewing.signed_at ? new Date(viewing.signed_at).toLocaleDateString() : "—"}</p></div>
                </div>
                {viewing.status === "sent" && (
                  <p className="text-sm text-muted-foreground">Your advisor will send a DocuSign link to review and sign shortly.</p>
                )}
                {viewing.notes && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{viewing.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                {viewing.document_url && (
                  <Button asChild variant="outline">
                    <a href={viewing.document_url} target="_blank" rel="noopener noreferrer">
                      View Document<ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => downloadContractPdf(viewing)}>
                  <Download className="h-4 w-4 mr-1" />Download PDF
                </Button>
                <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
