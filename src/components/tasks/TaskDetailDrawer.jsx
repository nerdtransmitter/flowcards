const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sparkles, 
  Plus, 
  X, 
  Calendar,
  Link2,
  Paperclip,
  ListTree,
  Loader2,
  CheckCircle2,
  Save,
  Eye,
  FileEdit
} from "lucide-react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { parseNaturalLanguage, formatParsedPreview } from "../utils/NaturalLanguageParser";

const contextTags = [
  { value: "home", label: "🏠 Home" },
  { value: "errands", label: "🏃 Errands" },
  { value: "laptop", label: "💻 Laptop" },
  { value: "phone", label: "📱 Phone" },
  { value: "quiet", label: "🤫 Quiet" },
  { value: "15min", label: "⚡ 15min" },
  { value: "30min", label: "⏱️ 30min" },
  { value: "60min", label: "⏰ 60min" },
  { value: "deep_work", label: "🧠 Deep Work" }
];

export default function TaskDetailDrawer({ task, open, onClose, isDark = false }) {
  const [formData, setFormData] = useState({});
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [proposedSubtasks, setProposedSubtasks] = useState([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState([]);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [nlPreview, setNlPreview] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-drawer'],
    queryFn: async () => {
      const user = await db.auth.me();
      return db.entities.Project.filter({ created_by: user.email }, '-created_date');
    },
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        notes: task.notes || "",
        why: task.why || "",
        next_step: task.next_step || "",
        project_id: task.project_id || "",
        effort: task.effort || "small",
        energy: task.energy || "medium",
        deadline_type: task.deadline_type || "none",
        aim_by: task.aim_by || "",
        context_tags: task.context_tags || [],
        links: task.links || [],
        emoji: task.emoji || "",
        is_important: task.is_important || false,
        is_pinned: task.is_pinned || false
      });
      setProposedSubtasks([]);
      setSelectedSubtasks([]);
      setShowMarkdownPreview(false);
      setNlPreview(null);
    }
  }, [task, open]);

  // Parse NL when title/notes change
  useEffect(() => {
    if (formData.title) {
      const parsed = parseNaturalLanguage(formData.title);
      const preview = formatParsedPreview(parsed);
      setNlPreview(preview);
      
      // Auto-apply if we detect NL patterns
      if (parsed.date && !formData.aim_by) {
        setFormData(prev => ({ ...prev, aim_by: parsed.date.toISOString().split('T')[0] }));
      }
      if (parsed.priority && !formData.is_important) {
        setFormData(prev => ({ ...prev, is_important: parsed.priority === 'high' }));
      }
      if (parsed.effort && !formData.effort) {
        setFormData(prev => ({ ...prev, effort: parsed.effort }));
      }
    } else {
      setNlPreview(null);
    }
  }, [formData.title]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log("Updating task:", id, data);
      const result = await db.entities.Task.update(id, data);
      console.log("Update result:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Update successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['shelf-tasks'] });
      toast.success('Task updated! ✨');
      onClose();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error('Failed to update task. Please try again.');
    }
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (subtaskData) => db.entities.Task.create(subtaskData),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Subtasks created! 🎯');
    },
  });

  const handleGenerateSubtasks = async () => {
    if (!task) return;
    
    setIsGeneratingSubtasks(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Break down this task into 5-7 tiny, concrete subtasks (Goblin Tools style).
        
Task: ${task.title}
${task.notes ? `Notes: ${task.notes}` : ''}
${task.why ? `Why: ${task.why}` : ''}

For each subtask:
- Make it a single, clear action (≤10 words)
- Include the very first step to start it
- Keep it bite-sized and non-overwhelming

Return as JSON array.`,
        response_json_schema: {
          type: "object",
          properties: {
            subtasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  next_step: { type: "string" },
                  effort: { type: "string", enum: ["tiny", "small"] }
                }
              }
            }
          }
        }
      });

      setProposedSubtasks(result.subtasks || []);
      setSelectedSubtasks(result.subtasks.map((_, idx) => idx));
    } catch (error) {
      console.error("Error generating subtasks:", error);
      toast.error('Failed to generate subtasks');
    }
    setIsGeneratingSubtasks(false);
  };

  const handleCreateSelectedSubtasks = async () => {
    const subtasksToCreate = selectedSubtasks.map(idx => proposedSubtasks[idx]);
    
    for (const subtask of subtasksToCreate) {
      await createSubtaskMutation.mutateAsync({
        ...subtask,
        parent_task_id: task.id,
        project_id: task.project_id,
        status: 'active',
        source: 'ai'
      });
    }

    setProposedSubtasks([]);
    setSelectedSubtasks([]);
  };

  const handleSave = () => {
    if (!task) return;
    
    console.log("Saving task with data:", formData);
    
    // Clean up the data before sending
    const cleanData = { ...formData };
    
    // Remove empty strings
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === "") {
        delete cleanData[key];
      }
    });
    
    // Ensure arrays are arrays
    if (!Array.isArray(cleanData.context_tags)) {
      cleanData.context_tags = [];
    }
    if (!Array.isArray(cleanData.links)) {
      cleanData.links = [];
    }
    
    updateMutation.mutate({ id: task.id, data: cleanData });
  };

  const toggleContextTag = (tag) => {
    const current = formData.context_tags || [];
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    setFormData({ ...formData, context_tags: updated });
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className={`w-full sm:max-w-2xl overflow-y-auto border-l-2 border-black ${
          isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white'
        }`}
      >
        <SheetHeader className="border-b-2 border-black pb-4">
          <SheetTitle className={`text-3xl font-serif-display font-black italic tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            Edit Task
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title & Emoji */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Title (try: "tomorrow 9am P1 ~45m")</Label>
            <div className="flex gap-2">
              <Input
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="😊"
                className={`plm-input w-16 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              />
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title..."
                className={`plm-input flex-1 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              />
            </div>
            {nlPreview && (
              <div className={`text-xs p-2 rounded ${
                isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                🤖 Detected: {nlPreview}
              </div>
            )}
          </div>

          {/* Why */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Why (Purpose)</Label>
            <Input
              value={formData.why}
              onChange={(e) => setFormData({ ...formData, why: e.target.value })}
              placeholder="Why does this matter?"
              className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
            />
          </div>

          {/* Next Step */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Next Step</Label>
            <Input
              value={formData.next_step}
              onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
              placeholder="First tiny action..."
              className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Notes (Markdown supported)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={6}
              className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Project</Label>
            <Select
              value={formData.project_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? null : value })}
            >
              <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.emoji} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Effort & Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={isDark ? 'text-slate-300' : ''}>Effort</Label>
              <Select
                value={formData.effort}
                onValueChange={(value) => setFormData({ ...formData, effort: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
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
              <Label className={isDark ? 'text-slate-300' : ''}>Energy</Label>
              <Select
                value={formData.energy}
                onValueChange={(value) => setFormData({ ...formData, energy: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
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

          {/* Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={isDark ? 'text-slate-300' : ''}>Deadline Type</Label>
              <Select
                value={formData.deadline_type}
                onValueChange={(value) => setFormData({ ...formData, deadline_type: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Deadline</SelectItem>
                  <SelectItem value="soft">Soft Aim</SelectItem>
                  <SelectItem value="hard">Hard Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deadline_type !== 'none' && (
              <div className="space-y-2">
                <Label className={isDark ? 'text-slate-300' : ''}>Aim By</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : ''
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.aim_by ? format(new Date(formData.aim_by), 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <CalendarPicker
                      mode="single"
                      selected={formData.aim_by ? new Date(formData.aim_by) : undefined}
                      onSelect={(date) => setFormData({ ...formData, aim_by: date?.toISOString().split('T')[0] })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Priority & Pinned */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_important}
                onCheckedChange={(checked) => setFormData({ ...formData, is_important: checked })}
              />
              <Label className={isDark ? 'text-slate-300' : ''}>High Priority</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
              <Label className={isDark ? 'text-slate-300' : ''}>Pinned</Label>
            </div>
          </div>

          {/* Context Tags */}
          <div className="space-y-2">
            <Label className={isDark ? 'text-slate-300' : ''}>Context Tags</Label>
            <div className="flex flex-wrap gap-2">
              {contextTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={formData.context_tags?.includes(tag.value) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    formData.context_tags?.includes(tag.value)
                      ? 'bg-blue-500 text-white'
                      : isDark
                        ? 'border-slate-600 hover:bg-slate-700'
                        : ''
                  }`}
                  onClick={() => toggleContextTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className={`text-lg ${isDark ? 'text-slate-300' : ''}`}>Subtasks</Label>
              <Button
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubtasks}
                className="plm-button-pill bg-white text-black hover:bg-gray-100 border-black h-8 text-xs gap-2"
              >
                {isGeneratingSubtasks ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Break Down
              </Button>
            </div>

            {proposedSubtasks.length > 0 && (
              <div className={`space-y-2 p-4 rounded-lg border-2 ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : ''}`}>
                  Select subtasks to create:
                </p>
                {proposedSubtasks.map((subtask, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSubtasks.includes(idx)}
                      onCheckedChange={(checked) => {
                        setSelectedSubtasks(checked 
                          ? [...selectedSubtasks, idx]
                          : selectedSubtasks.filter(i => i !== idx)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${isDark ? 'text-slate-200' : ''}`}>{subtask.title}</p>
                      {subtask.next_step && (
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          ⚡ {subtask.next_step}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  onClick={handleCreateSelectedSubtasks}
                  disabled={selectedSubtasks.length === 0}
                  className="plm-button-pill w-full mt-3 bg-green-500 hover:bg-green-600 text-white border-black"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create {selectedSubtasks.length} Subtask{selectedSubtasks.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-inherit pb-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              className="plm-button-pill flex-1 bg-pink-500 hover:bg-pink-600 text-white border-black"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}