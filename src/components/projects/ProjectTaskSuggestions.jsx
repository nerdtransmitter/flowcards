const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectTaskSuggestions({ project, tasks = [], isDark = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState(new Set());
  const queryClient = useQueryClient();

  const addTaskMutation = useMutation({
    mutationFn: ({ taskId }) => 
      db.entities.Task.update(taskId, { project_id: project.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-tasks'] });
      toast.success('Task added to project');
    },
  });

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const unassignedTasks = tasks.filter(t => !t.project_id && t.status === 'active');
      
      if (unassignedTasks.length === 0) {
        toast.info('No unassigned tasks to suggest');
        setIsLoading(false);
        return;
      }

      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Given this project:
Name: ${project.name}
Description: ${project.description || 'none'}
North Star: ${project.north_star || 'none'}
Area: ${project.area}

And these unassigned tasks:
${unassignedTasks.slice(0, 30).map(t => `- ${t.title} (${t.notes || 'no notes'})`).join('\n')}

Identify which tasks are most relevant to this project based on title, context, and theme similarity.
Return a relevance score (0-1) for each task. Only include tasks with score > 0.6.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_title: { type: "string" },
                  relevance_score: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      const matched = result.suggestions
        .map(s => {
          const task = unassignedTasks.find(t => t.title === s.task_title);
          return task ? { ...s, task } : null;
        })
        .filter(s => s !== null)
        .sort((a, b) => b.relevance_score - a.relevance_score);

      setSuggestions(matched);
    } catch (error) {
      toast.error('Failed to get suggestions');
    }
    setIsLoading(false);
  };

  const handleAdd = (taskId) => {
    addTaskMutation.mutate({ taskId });
    setSuggestions(prev => prev.filter(s => s.task.id !== taskId));
  };

  const handleIgnore = (taskId) => {
    setIgnoredIds(prev => new Set([...prev, taskId]));
    setSuggestions(prev => prev.filter(s => s.task.id !== taskId));
  };

  const visibleSuggestions = suggestions.filter(s => !ignoredIds.has(s.task.id));

  if (visibleSuggestions.length === 0 && !isLoading && suggestions.length === 0) {
    return (
      <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Suggested Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={getSuggestions}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding related tasks...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Tasks for This Project
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) return null;

  return (
    <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Suggested Tasks ({visibleSuggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map(({ task, relevance_score, reason }) => (
          <div
            key={task.id}
            className={`p-3 rounded-lg border ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.emoji} {task.title}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {reason}
                </p>
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs"
                >
                  {Math.round(relevance_score * 100)}% match
                </Badge>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleAdd(task.id)}
                  disabled={addTaskMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleIgnore(task.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}