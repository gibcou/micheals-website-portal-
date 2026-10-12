import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/portal/MobileSelect";
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
    let photo_uri;
    const fileInput = e.target.elements.photo;
    if (fileInput.files && fileInput.files[0]) {
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: fileInput.files[0] });
      photo_uri = uploaded.file_uri;
    }
    await base44.entities.ServiceRequest.create({
      title: form.get("title"),
      description: form.get("description"),
      category,
      priority,
      estate_id: estate.id,
      estate_name: estate.name,
      client_id: estate.client_id,
      status: "open",
      photo: photo_uri,
    });
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
              <MobileSelect
                value={category}
                onValueChange={setCategory}
                placeholder="Category"
                options={[
                  { value: "Maintenance", label: "Maintenance" },
                  { value: "Cleaning", label: "Cleaning" },
                  { value: "Property", label: "Property" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <MobileSelect
                value={priority}
                onValueChange={setPriority}
                placeholder="Priority"
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
              />
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