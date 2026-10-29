const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Flag, 
  FolderKanban, 
  Calendar as CalendarIcon, 
  Clock,
  CalendarPlus,
  Sparkles,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import AINotification from "./AINotification";

export default function QuickActionsChips({ task, isDark = false, compact = false }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const createTimeBlockMutation = useMutation({
    mutationFn: (blockData) => db.entities.TimeBlock.create(blockData),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const handleTogglePriority = () => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { is_important: !task.is_important }
    });
    toast.success(task.is_important ? 'Priority removed' : 'Marked as priority');
  };

  const handleSetDueDate = (date) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { 
        aim_by: format(date, 'yyyy-MM-dd'),
        deadline_type: task.deadline_type === 'none' ? 'soft' : task.deadline_type
      }
    });
    setShowDatePicker(false);
    toast.success('Due date set');
  };

  const handleAITimeBlockSuggestion = async () => {
    setIsGeneratingSuggestion(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Suggest an optimal time slot for this task:
Task: ${task.title}
${task.why ? `Why: ${task.why}` : ''}
${task.effort ? `Effort: ${task.effort}` : ''}
${task.energy ? `Energy required: ${task.energy}` : ''}
${task.context_tags?.length ? `Context: ${task.context_tags.join(', ')}` : ''}

Current time: ${new Date().toISOString()}

Provide:
1. Best time slot (morning/afternoon/evening + specific hour range)
2. Block strength (light/medium/hard)
3. Duration in minutes
4. Brief rationale (one sentence)

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_hour: { type: "number" },
            block_strength: { type: "string", enum: ["light", "medium", "hard"] },
            duration_minutes: { type: "number" },
            rationale: { type: "string" }
          }
        }
      });

      setAiSuggestion(result);
    } catch (error) {
      toast.error("Failed to generate suggestion");
    }
    setIsGeneratingSuggestion(false);
  };

  const handleApplyAISuggestion = async () => {
    if (!aiSuggestion) return;

    const startTime = new Date();
    startTime.setHours(aiSuggestion.suggested_hour, 0, 0, 0);

    await createTimeBlockMutation.mutateAsync({
      title: task.title,
      start_time: startTime.toISOString(),
      duration_minutes: aiSuggestion.duration_minutes,
      strength: aiSuggestion.block_strength,
      block_type: 'focus',
      task_ids: [task.id]
    });

    setAiSuggestion(null);
    toast.success('Time block created!');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {/* Priority chip */}
      <Badge
        variant={task.is_important ? "default" : "outline"}
        className={`cursor-pointer ${
          task.is_important
            ? 'bg-amber-500 hover:bg-amber-600'
            : isDark
              ? 'hover:bg-slate-700'
              : 'hover:bg-gray-100'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          handleTogglePriority();
        }}
      >
        <Flag className="w-3 h-3 mr-1" />
        {task.is_important ? 'Priority' : 'Set Priority'}
      </Badge>

      {/* Project chip */}
      <Badge
        variant="outline"
        className={`cursor-pointer ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
        }`}
      >
        <FolderKanban className="w-3 h-3 mr-1" />
        {task.project_id ? 'In Project' : 'Add to Project'}
      </Badge>

      {/* Due date chip */}
      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="outline"
            className={`cursor-pointer ${
              task.aim_by
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isDark
                  ? 'hover:bg-slate-700'
                  : 'hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="w-3 h-3 mr-1" />
            {task.aim_by ? format(new Date(task.aim_by), 'MMM d') : 'Set Due'}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={task.aim_by ? new Date(task.aim_by) : undefined}
            onSelect={handleSetDueDate}
          />
        </PopoverContent>
      </Popover>

      {/* Estimated time chip */}
      <Badge
        variant="outline"
        className={isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}
      >
        <Clock className="w-3 h-3 mr-1" />
        {task.effort === 'tiny' ? '15m' : 
         task.effort === 'small' ? '30m' : 
         task.effort === 'medium' ? '1h' : '2h+'}
      </Badge>

      {/* Add to Time Block with AI */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Badge
            variant="outline"
            className={`cursor-pointer ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-purple-50 hover:border-purple-200'
            }`}
          >
            <CalendarPlus className="w-3 h-3 mr-1" />
            Schedule
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleAITimeBlockSuggestion} disabled={isGeneratingSuggestion}>
            {isGeneratingSuggestion ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggest Time
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Manual Schedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI Suggestion notification */}
      {aiSuggestion && (
        <AINotification
          type="time_block_suggestion"
          data={aiSuggestion}
          taskTitle={task.title}
          onApply={handleApplyAISuggestion}
          onDismiss={() => setAiSuggestion(null)}
          isDark={isDark}
        />
      )}
    </div>
  );
}