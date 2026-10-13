import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, StatusBadge, SectionCard, EmptyState } from "@/components/portal/Shared";
import { FileSignature, ExternalLink } from "lucide-react";

export default function ClientContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
      if (error) console.error("Error loading contracts", error);
      setContracts(data || []);
      setLoading(false);
    };
    load();
  }, []);

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
            <SectionCard key={c.id} className="p-5">
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
                  {c.document_url && (
                    <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View Document<ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
