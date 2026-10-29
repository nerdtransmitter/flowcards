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
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import AIActionNotification from "../tasks/AIActionNotification";
import { toast } from "sonner";

export default function CreateTimeBlockDialog({ 
  open, 
  onClose, 
  tasks = [], 
  initialDate = new Date(),
  isDark = false,
  initialTask = null
}) {
  const [formData, setFormData] = useState({
    title: "",
    start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
    end_time: null,
    duration_minutes: 60,
    strength: "medium",
    block_type: "focus",
    task_ids: [],
    notes: "",
    is_all_day: false,
    recurrence_rule: {
      frequency: "none",
      interval: 1,
      days_of_week: [],
      end_date: null,
      occurrences: null
    }
  });
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastCreatedBlock, setLastCreatedBlock] = useState(null);
  const queryClient = useQueryClient();

  // Pre-select task if provided and get AI suggestion
  // Listen for custom event to open dialog with tasks
  useEffect(() => {
    const handleOpenEvent = (e) => {
      const { taskIds, title } = e.detail;
      if (taskIds && taskIds.length > 0) {
        setFormData(prev => ({
          ...prev,
          title: title || "New Session",
          task_ids: taskIds,
          duration_minutes: 60 // Default, can be adjusted
        }));
        // Since we don't have this prop exposed to open the dialog from event, 
        // we rely on the parent to handle the open state or this dialog needs to be global.
        // For now, assuming the parent (FocusNow) also sets 'open=true' when dispatching.
      }
    };
    window.addEventListener('openTimeBlockDialog', handleOpenEvent);
    return () => window.removeEventListener('openTimeBlockDialog', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (initialTask && open) {
      setFormData(prev => ({
        ...prev,
        title: initialTask.title,
        task_ids: [initialTask.id]
      }));
      getAISuggestion(initialTask);
    }
  }, [initialTask, open]);

  const getAISuggestion = async (task) => {
    setIsLoadingAI(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Given this task: "${task.title}" with effort: ${task.effort}, energy: ${task.energy}, and estimated time: ${task.estimated_minutes || 'unknown'} minutes.

Suggest:
1. Best time of day (morning/afternoon/evening) with specific reasoning
2. Recommended block duration in minutes
3. Suggested commitment strength (light/medium/hard) and why

Return JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            best_time: { type: "string" },
            duration_minutes: { type: "number" },
            strength: { type: "string" },
            rationale: { type: "string" }
          }
        }
      });
      
      setAiSuggestion(result);
      setShowAISuggestion(true);
    } catch (error) {
      console.error('AI suggestion failed:', error);
    }
    setIsLoadingAI(false);
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({
        ...prev,
        duration_minutes: aiSuggestion.duration_minutes,
        strength: aiSuggestion.strength
      }));
      setShowAISuggestion(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // If recurring, create parent block
      if (data.recurrence_rule.frequency !== 'none') {
        const parentBlock = await db.entities.TimeBlock.create(data);
        return parentBlock;
      }
      return db.entities.TimeBlock.create(data);
    },
    onSuccess: (createdBlock, variables) => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['shelf-tasks'] });
      
      setLastCreatedBlock(createdBlock);
      
      // Show notification
      const taskNames = variables.task_ids?.length > 0 
        ? tasks.filter(t => variables.task_ids.includes(t.id)).map(t => t.title).join(', ')
        : '';
      
      setShowNotification(true);
      toast.success('Time block created!');
      
      setTimeout(() => setShowNotification(false), 8000);
      
      onClose();
      setFormData({
        title: "",
        start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: null,
        duration_minutes: 60,
        strength: "medium",
        block_type: "focus",
        task_ids: [],
        notes: "",
        is_all_day: false,
        recurrence_rule: {
          frequency: "none",
          interval: 1,
          days_of_week: [],
          end_date: null,
          occurrences: null
        }
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    // Check for Deep Work after 16:00
    const startTime = new Date(formData.start_time);
    const hour = startTime.getHours();
    
    if (formData.block_type === 'focus' && formData.task_ids.length > 0) {
      const hasDeepWork = tasks.some(t => 
        formData.task_ids.includes(t.id) && 
        t.context_tags?.includes('deep_work')
      );
      
      if (hasDeepWork && hour >= 16) {
        if (!confirm('⚠️ You\'re scheduling Deep Work after 16:00. This goes against your energy patterns. Continue anyway?')) {
          return;
        }
      }
    }

    // Calculate end_time if multi-day or if not set
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.end_time && !dataToSubmit.is_all_day) {
      const endTime = new Date(startTime.getTime() + dataToSubmit.duration_minutes * 60000);
      dataToSubmit.end_time = endTime.toISOString();
    } else if (dataToSubmit.end_time) {
      // Calculate duration from start to end
      const end = new Date(dataToSubmit.end_time);
      dataToSubmit.duration_minutes = Math.round((end - startTime) / 60000);
    }
    
    createMutation.mutate(dataToSubmit);
  };

  const toggleTask = (taskId) => {
    const newTaskIds = formData.task_ids.includes(taskId)
      ? formData.task_ids.filter(id => id !== taskId)
      : [...formData.task_ids, taskId];
    setFormData({ ...formData, task_ids: newTaskIds });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-serif-display font-black italic tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            Create Time Block
          </DialogTitle>
        </DialogHeader>

        {showAISuggestion && aiSuggestion && (
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <p className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                🤖 AI Suggestion
              </p>
              <Button
                type="button"
                size="sm"
                onClick={applyAISuggestion}
                className="plm-button-pill bg-blue-600 hover:bg-blue-700 text-white border-none h-8 text-xs"
              >
                Apply
              </Button>
            </div>
            <p className={`text-sm mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              <strong>Time:</strong> {aiSuggestion.best_time}
            </p>
            <p className={`text-sm mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              <strong>Duration:</strong> {aiSuggestion.duration_minutes} minutes
            </p>
            <p className={`text-sm mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              <strong>Strength:</strong> {aiSuggestion.strength}
            </p>
            <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {aiSuggestion.rationale}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className={isDark ? 'text-slate-300' : ''}>
              Block Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning focus session"
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_all_day"
                checked={formData.is_all_day}
                onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_all_day" className={isDark ? 'text-slate-300' : ''}>
                All-day event
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time" className={isDark ? 'text-slate-300' : ''}>
                Start Time *
              </Label>
              <Input
                id="start_time"
                type={formData.is_all_day ? "date" : "datetime-local"}
                value={formData.is_all_day ? formData.start_time.split('T')[0] : formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: formData.is_all_day ? e.target.value + 'T00:00' : e.target.value })}
                className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time" className={isDark ? 'text-slate-300' : ''}>
                {formData.is_all_day ? 'End Date (optional for multi-day)' : 'Duration'}
              </Label>
              {formData.is_all_day ? (
                <Input
                  id="end_time"
                  type="date"
                  value={formData.end_time ? formData.end_time.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value ? e.target.value + 'T23:59' : null })}
                  className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                />
              ) : (
                <Select
                  value={String(formData.duration_minutes)}
                  onValueChange={(value) => setFormData({ ...formData, duration_minutes: Number(value), end_time: null })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strength" className={isDark ? 'text-slate-300' : ''}>
                Commitment Level
              </Label>
              <Select
                value={formData.strength}
                onValueChange={(value) => setFormData({ ...formData, strength: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">💙 Light (flexible)</SelectItem>
                  <SelectItem value="medium">🧡 Medium (preferred)</SelectItem>
                  <SelectItem value="hard">❤️ Hard (fixed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block_type" className={isDark ? 'text-slate-300' : ''}>
                Block Type
              </Label>
              <Select
                value={formData.block_type}
                onValueChange={(value) => setFormData({ ...formData, block_type: value })}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="focus">🎯 Focus</SelectItem>
                  <SelectItem value="admin">📋 Admin</SelectItem>
                  <SelectItem value="break">☕ Break</SelectItem>
                  <SelectItem value="meeting">👥 Meeting</SelectItem>
                  <SelectItem value="flex">✨ Flex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(tasks.length > 0 || initialTask) && (
            <div className="space-y-2">
              <Label className={isDark ? 'text-slate-300' : ''}>
                {initialTask ? 'Task to Schedule' : 'Attach Tasks (optional)'}
              </Label>
              <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 ${
                isDark ? 'border-slate-600 bg-slate-900' : 'border-gray-200'
              }`}>
                {(initialTask ? [initialTask] : tasks.slice(0, 20)).map((task) => (
                  <div key={task.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={formData.task_ids.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-sm cursor-pointer ${
                        isDark ? 'text-slate-300' : 'text-gray-700'
                      }`}
                    >
                      {task.emoji} {task.title}
                      {task.context_tags?.includes('deep_work') && (
                        <span className="ml-2 text-xs text-purple-600">🧠 Deep Work</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className={isDark ? 'text-slate-300' : ''}>
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
              rows={3}
            />
          </div>

          <div className="space-y-3 p-4 rounded-lg border" style={{
            borderColor: isDark ? '#475569' : '#e5e7eb',
            backgroundColor: isDark ? '#1e293b' : '#f9fafb'
          }}>
            <Label className={isDark ? 'text-slate-300' : 'text-gray-900'}>
              🔁 Recurrence (optional)
            </Label>

            <Select
              value={formData.recurrence_rule.frequency}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                recurrence_rule: { ...formData.recurrence_rule, frequency: value }
              })}
            >
              <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            {formData.recurrence_rule.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Repeat on days:
                </Label>
                <div className="flex gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                    const isSelected = formData.recurrence_rule.days_of_week?.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const days = formData.recurrence_rule.days_of_week || [];
                          const newDays = isSelected 
                            ? days.filter(d => d !== idx)
                            : [...days, idx].sort();
                          setFormData({
                            ...formData,
                            recurrence_rule: { ...formData.recurrence_rule, days_of_week: newDays }
                          });
                        }}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isDark
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.recurrence_rule.frequency !== 'none' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="end_date" className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Until date (optional)
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.recurrence_rule.end_date || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence_rule: { ...formData.recurrence_rule, end_date: e.target.value, occurrences: null }
                    })}
                    className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occurrences" className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Or # of times
                  </Label>
                  <Input
                    id="occurrences"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurrence_rule.occurrences || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence_rule: { ...formData.recurrence_rule, occurrences: e.target.value ? Number(e.target.value) : null, end_date: null }
                    })}
                    className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                  />
                </div>
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
              className="plm-button-pill bg-pink-500 hover:bg-pink-600 text-white border-black"
            >
              Create Block
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <AIActionNotification
        show={showNotification && !open}
        action="schedule"
        summary={`Time block created: ${lastCreatedBlock?.title || ''}`}
        onView={() => {
          setShowNotification(false);
        }}
        onUndo={async () => {
          if (lastCreatedBlock) {
            await db.entities.TimeBlock.delete(lastCreatedBlock.id);
            queryClient.invalidateQueries();
            setShowNotification(false);
            toast.success('Time block removed');
          }
        }}
        onDismiss={() => setShowNotification(false)}
        isDark={isDark}
      />
    </>
  );
}