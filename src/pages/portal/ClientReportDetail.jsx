import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, SectionCard } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";

export default function ClientReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rep = await base44.entities.WeeklyReport.get(id);
        if (!rep) setNotFound(true);
        else setReport(rep);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  if (notFound) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Report not found.</p>
        <Button variant="outline" onClick={() => navigate("/portal/reports")}>Back to Reports</Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/portal/reports")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Reports
      </button>

      <PageHeader
        eyebrow="Weekly Reports"
        title={report.title}
        subtitle={`Week of ${report.week_of}${report.estate_name ? ` · ${report.estate_name}` : ""}`}
      />

      <SectionCard className="p-6">
        <div className="space-y-6">
          {report.summary && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
            </div>
          )}
          {report.actions_taken && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Actions Taken
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{report.actions_taken}</p>
            </div>
          )}
          {report.photos && report.photos.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Photos</p>
              <div className="grid grid-cols-2 gap-3">
                {report.photos.map((url, i) => (
                  <Image key={i} src={url} alt={`Report photo ${i + 1}`} className="rounded-lg aspect-video object-cover" />
                ))}
              </div>
            </div>
          )}
          {!report.summary && !report.actions_taken && !(report.photos && report.photos.length) && (
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> No details recorded for this report.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}