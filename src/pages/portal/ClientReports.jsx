import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle2 } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Estate.filter({}, { sort: "-created_date", limit: 1 });
      if (items[0]) {
        const reps = await base44.entities.WeeklyReport.filter({ estate_id: items[0].id }, { sort: "-week_of", limit: 50 });
        setReports(reps.items || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Reports"
        title="The Weekly Report"
        subtitle="A single summary of every action taken on your behalf."
      />

      {reports.length === 0 ? (
        <SectionCard>
          <EmptyState icon={FileText} title="No reports yet" description="Your weekly reports will be published here every Friday." />
        </SectionCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {reports.map((r) => (
            <SectionCard key={r.id} className="p-6 cursor-pointer hover:border-primary/40 transition-colors" >
              <div onClick={() => setSelected(r)}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  Week of {r.week_of}
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">{r.title}</h3>
                {r.summary && <p className="text-sm text-muted-foreground line-clamp-3">{r.summary}</p>}
                {r.actions_taken && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Actions Taken</p>
                    <p className="text-sm text-foreground/80 line-clamp-2">{r.actions_taken}</p>
                  </div>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" /> Week of {selected.week_of}
                </div>
                <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {selected.summary && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</p>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{selected.summary}</p>
                  </div>
                )}
                {selected.actions_taken && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Actions Taken</p>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{selected.actions_taken}</p>
                  </div>
                )}
                {selected.photos && selected.photos.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selected.photos.map((url, i) => (
                        <Image key={i} src={url} alt={`Report photo ${i + 1}`} className="rounded-lg aspect-video object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}