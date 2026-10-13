import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { FileText, Calendar } from "lucide-react";
import PullToRefresh from "@/components/portal/PullToRefresh";

export default function ClientReports() {
  const navigate = useNavigate();
  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: ["portal", "reports"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: estates, error: estateError } = await supabase.from('estates').select('id').eq('client_id', user.id);
      if (estateError) console.error("Error fetching estates", estateError);
      if (!estates || estates.length === 0) return [];
      const { data: reps, error: repsError } = await supabase.from('weekly_reports').select('*').in('estate_id', estates.map((e) => e.id)).order('week_of', { ascending: false }).limit(50);
      if (repsError) console.error("Error fetching reports", repsError);
      return reps || [];
    },
  });



  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Reports"
        title="The Weekly Report"
        subtitle="A single summary of every action taken on your behalf."
      />

      <PullToRefresh>
      {reports.length === 0 ? (
        <SectionCard>
          <EmptyState icon={FileText} title="No reports yet" description="Your weekly reports will be published here every Friday." />
        </SectionCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {reports.map((r) => (
            <SectionCard
              key={r.id}
              onClick={() => navigate(`/portal/reports/${r.id}`)}
              className="p-6 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Calendar className="h-3.5 w-3.5" />
                Week of {r.week_of}
              </div>
              <h3 className="font-display text-xl text-foreground mb-2">{r.title}</h3>
              {r.estate_name && <p className="text-xs text-primary mb-2">{r.estate_name}</p>}
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
      </PullToRefresh>
    </div>
  );
}