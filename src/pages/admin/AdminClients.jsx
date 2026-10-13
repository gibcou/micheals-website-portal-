import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Users, Mail, MessageSquare, Building2, Eye } from "lucide-react";

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [estatesByClient, setEstatesByClient] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles, error: profilesError }, { data: estates, error: estatesError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }),
        supabase.from('estates').select('id, name, client_id'),
      ]);
      if (profilesError) console.error("Error loading clients", profilesError);
      if (estatesError) console.error("Error loading estates", estatesError);

      const map = {};
      (estates || []).forEach((e) => {
        if (!map[e.client_id]) map[e.client_id] = [];
        map[e.client_id].push(e);
      });

      setClients(profiles || []);
      setEstatesByClient(map);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="h-8 w-8 border-2 border-border border-t-primary rounded-full animate-spin" />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Clients"
        subtitle="Everyone with a client account. Use these to assign estates and message clients."
      />

      {clients.length === 0 ? (
        <SectionCard>
          <EmptyState icon={Users} title="No clients yet" description="Clients will appear here once they create an account." />
        </SectionCard>
      ) : (
        <SectionCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Estates</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => {
                  const estates = estatesByClient[c.id] || [];
                  return (
                    <tr key={c.id}>
                      <td className="px-6 py-4 text-foreground">{c.full_name || "—"}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{c.email || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {estates.length > 0 ? estates.map((e) => e.name).join(", ") : <span className="italic">None assigned</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/portal/dashboard", { state: { viewAsClient: { id: c.id, full_name: c.full_name, email: c.email } } })}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />View Portal
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/messages", { state: { presetClientId: c.id } })}
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />Message
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/estates", { state: { presetClientId: c.id } })}
                          >
                            <Building2 className="h-3.5 w-3.5 mr-1" />Add Estate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
