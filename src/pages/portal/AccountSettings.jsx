import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, SectionCard } from "@/components/portal/Shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, User } from "lucide-react";

export default function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user", error);
      } else {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profileError) {
          console.error("Error fetching profile", profileError);
        } else {
          setUser({ ...data.user, ...profile });
        }
      }
    };
    fetchUser();
  }, []);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/login";
    } catch (e) {
      setError("We couldn't complete the sign out. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Account Settings"
        subtitle="Your profile and account preferences."
      />

      <SectionCard className="p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <p className="text-sm text-foreground mt-0.5">{user ? (user.full_name || user.email) : "…"}</p>
            {user?.email && user.full_name && <p className="text-xs text-muted-foreground">{user.email}</p>}
            {user?.role && <p className="text-xs text-muted-foreground capitalize mt-1">{user.role === "admin" ? "Administrator" : "Client"}</p>}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-6 border-destructive/30">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-foreground font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Permanently deletes your account and all data associated with your estate — requests, reports, invoices, and messages. This cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => { setConfirmText(""); setError(""); setOpen(true); }}
              className="mt-4"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </SectionCard>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently removes your account and all of your estate data. To confirm, type <span className="text-foreground font-semibold">DELETE</span> below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || confirmText !== "DELETE"}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}