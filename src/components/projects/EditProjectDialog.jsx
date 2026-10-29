const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const areas = [
  { value: "apartment", label: "🏠 Apartment", emoji: "🏠" },
  { value: "admin", label: "📋 Admin", emoji: "📋" },
  { value: "health", label: "🏃 Health", emoji: "🏃" },
  { value: "career", label: "💼 Career", emoji: "💼" },
  { value: "learning", label: "📚 Learning", emoji: "📚" },
  { value: "creative", label: "🎨 Creative", emoji: "🎨" },
  { value: "social", label: "👥 Social", emoji: "👥" },
  { value: "misc", label: "✨ Misc", emoji: "✨" }
];

export default function EditProjectDialog({ open, onClose, project, isDark = false }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    area: "misc",
    north_star: "",
    emoji: "",
    outcomes: []
  });
  const [outcomesText, setOutcomesText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        area: project.area || "misc",
        north_star: project.north_star || "",
        emoji: project.emoji || "",
        outcomes: project.outcomes || []
      });
      setOutcomesText((project.outcomes || []).join('\n'));
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !project) return;
    
    const outcomes = outcomesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    updateMutation.mutate({
      id: project.id,
      data: {
        ...formData,
        outcomes,
        emoji: formData.emoji || areas.find(a => a.value === formData.area)?.emoji
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : ''}>
            Edit Project
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={isDark ? 'text-slate-300' : ''}>
              Project Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Apartment Reset"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area" className={isDark ? 'text-slate-300' : ''}>
              Area
            </Label>
            <Select
              value={formData.area}
              onValueChange={(value) => setFormData({ ...formData, area: value })}
            >
              <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="north_star" className={isDark ? 'text-slate-300' : ''}>
              North Star (guiding purpose)
            </Label>
            <Input
              id="north_star"
              value={formData.north_star}
              onChange={(e) => setFormData({ ...formData, north_star: e.target.value })}
              placeholder="e.g., Create a calm, organized living space"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={isDark ? 'text-slate-300' : ''}>
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcomes" className={isDark ? 'text-slate-300' : ''}>
              Desired Outcomes (one per line)
            </Label>
            <Textarea
              id="outcomes"
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              placeholder="Organized closet&#10;Comfortable living room&#10;Efficient kitchen"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-blue-500"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}