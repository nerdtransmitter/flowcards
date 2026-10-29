const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

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
import ContextSelector from "./ContextSelector";

export default function CreateTaskDialog({ open, onClose, projectId = null, isDark = false }) {
  const [formData, setFormData] = useState({
    title: "",
    why: "",
    next_step: "",
    effort: "small",
    energy: "medium",
    context_tags: [],
    deadline_type: "none",
    aim_by: "",
    project_id: projectId || ""
  });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-tasks'] });
      onClose();
      setFormData({
        title: "",
        why: "",
        next_step: "",
        effort: "small",
        energy: "medium",
        context_tags: [],
        deadline_type: "none",
        aim_by: "",
        project_id: projectId || ""
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const taskData = {
      ...formData,
      status: 'active',
      source: 'inbox'
    };
    
    if (!taskData.aim_by) {
      delete taskData.aim_by;
    }
    
    if (!taskData.project_id) {
      delete taskData.project_id;
    }
    
    createMutation.mutate(taskData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : ''}>
            Create New Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className={isDark ? 'text-slate-300' : ''}>
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="why" className={isDark ? 'text-slate-300' : ''}>
              Why (one-line purpose)
            </Label>
            <Input
              id="why"
              value={formData.why}
              onChange={(e) => setFormData({ ...formData, why: e.target.value })}
              placeholder="Why does this matter?"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_step" className={isDark ? 'text-slate-300' : ''}>
              Next Step (≤120 chars)
            </Label>
            <Input
              id="next_step"
              value={formData.next_step}
              onChange={(e) => setFormData({ ...formData, next_step: e.target.value.slice(0, 120) })}
              placeholder="What's the first tiny action?"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effort" className={isDark ? 'text-slate-300' : ''}>
                Effort
              </Label>
              <Select
                value={formData.effort}
                onValueChange={(value) => setFormData({ ...formData, effort: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">Tiny (5-10 min)</SelectItem>
                  <SelectItem value="small">Small (15-30 min)</SelectItem>
                  <SelectItem value="medium">Medium (1-2 hrs)</SelectItem>
                  <SelectItem value="large">Large (3+ hrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy" className={isDark ? 'text-slate-300' : ''}>
                Energy Required
              </Label>
              <Select
                value={formData.energy}
                onValueChange={(value) => setFormData({ ...formData, energy: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🌱 Low</SelectItem>
                  <SelectItem value="medium">⚡ Medium</SelectItem>
                  <SelectItem value="high">🔥 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>
              Context Tags
            </Label>
            <ContextSelector
              selected={formData.context_tags}
              onChange={(tags) => setFormData({ ...formData, context_tags: tags })}
              isDark={isDark}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline_type" className={isDark ? 'text-slate-300' : ''}>
                Deadline Type
              </Label>
              <Select
                value={formData.deadline_type}
                onValueChange={(value) => setFormData({ ...formData, deadline_type: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (flexible)</SelectItem>
                  <SelectItem value="soft">Soft (aim for this)</SelectItem>
                  <SelectItem value="hard">Hard (must complete)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deadline_type !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="aim_by" className={isDark ? 'text-slate-300' : ''}>
                  Aim By (optional)
                </Label>
                <Input
                  id="aim_by"
                  type="date"
                  value={formData.aim_by}
                  onChange={(e) => setFormData({ ...formData, aim_by: e.target.value })}
                  className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}