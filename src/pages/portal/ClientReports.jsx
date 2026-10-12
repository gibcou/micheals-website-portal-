import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { FileText, Calendar } from "lucide-react";

export default function ClientReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

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
            <SectionCard
              key={r.id}
              className="p-6 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div onClick={() => navigate(`/portal/reports/${r.id}`)} className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
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
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}