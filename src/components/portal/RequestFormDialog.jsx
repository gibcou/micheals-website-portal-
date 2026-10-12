import React, { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Shared "New Service Request" dialog for the client portal.
export default function RequestFormDialog({ estate, open, onOpenChange, onCreated }) {
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("Maintenance");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.target);
    let photo_url;
    const fileInput = e.target.elements.photo;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const { data, error } = await supabase.storage.from('request-photos').upload(`${estate.id}/${file.name}`, file);
      if (error) console.error("Error uploading photo", error);
      else photo_url = data.path;
    }
    const { error } = await supabase.from('service_requests').insert([{
      title: form.get("title"),
      description: form.get("description"),
      category,
      priority,
      estate_id: estate.id,
      estate_name: estate.name,
      client_id: estate.client_id,
      status: "open",
      photo_url: photo_url,
    }]);
    if (error) console.error("Error creating service request", error);
    setSubmitting(false);
    setCategory("Maintenance");
    setPriority("medium");
    onOpenChange(false);
    if (onCreated) onCreated();
  };

  if (!open || !estate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New Service Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Kitchen faucet repair" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Property">Property</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} placeholder="Tell us what needs attention..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" className="text-muted-foreground file:mr-3 file:border-0 file:bg-secondary file:text-foreground file:text-xs file:px-3 file:py-1.5 file:rounded-md file:cursor-pointer" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}