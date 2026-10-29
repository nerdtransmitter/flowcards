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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, FolderKanban } from "lucide-react";
import { toast } from "sonner";

export default function GroupTasksDialog({ open, onClose, tasks = [], projects = [], isDark = false }) {
  const [groupings, setGroupings] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const queryClient = useQueryClient();

  const applyGroupingsMutation = useMutation({
    mutationFn: async (groups) => {
      const updates = [];
      
      for (const group of groups) {
        if (!selectedGroups.has(group.id)) continue;

        // Create parent task if needed
        let parentId = group.parent_task_id;
        if (group.create_parent) {
          const parent = await db.entities.Task.create({
            title: group.parent_title,
            status: 'active',
            effort: 'large'
          });
          parentId = parent.id;
        }

        // Update child tasks
        for (const childId of group.child_task_ids) {
          updates.push(
            db.entities.Task.update(childId, {
              parent_task_id: parentId,
              project_id: group.project_id || null
            })
          );
        }

        // Update parent with subtask_ids
        if (parentId) {
          const parent = tasks.find(t => t.id === parentId) || await db.entities.Task.filter({ id: parentId });
          const existingSubtasks = parent?.subtask_ids || [];
          await db.entities.Task.update(parentId, {
            subtask_ids: [...new Set([...existingSubtasks, ...group.child_task_ids])],
            project_id: group.project_id || parent.project_id
          });
        }
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Tasks grouped successfully');
      onClose();
    },
  });

  const analyzeAndGroupTasks = async () => {
    setIsAnalyzing(true);
    try {
      const activeTasks = tasks.filter(t => t.status === 'active' && !t.parent_task_id);
      
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze these tasks and suggest logical groupings based on theme, project area, or workflow:

${activeTasks.slice(0, 40).map(t => `- [${t.id}] ${t.title} (${t.notes || 'no context'})`).join('\n')}

Available projects:
${projects.map(p => `- [${p.id}] ${p.name} (${p.area})`).join('\n')}

Suggest groupings where:
1. Tasks can be nested under an existing task as subtasks
2. Tasks can be grouped under a NEW parent task (provide title)
3. Tasks should be assigned to a specific project

Return actionable groupings with clear reasoning.`,
        response_json_schema: {
          type: "object",
          properties: {
            groupings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  group_name: { type: "string" },
                  reason: { type: "string" },
                  create_parent: { type: "boolean" },
                  parent_title: { type: "string" },
                  parent_task_id: { type: "string" },
                  project_id: { type: "string" },
                  child_task_ids: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      const processedGroupings = result.groupings.map((g, idx) => ({
        ...g,
        id: `group-${idx}`,
        tasks: g.child_task_ids.map(id => activeTasks.find(t => t.id === id)).filter(Boolean)
      }));

      setGroupings(processedGroupings);
      setSelectedGroups(new Set(processedGroupings.map(g => g.id)));
    } catch (error) {
      toast.error('Failed to analyze tasks');
    }
    setIsAnalyzing(false);
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (open && groupings.length === 0 && !isAnalyzing) {
      analyzeAndGroupTasks();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${
        isDark ? 'bg-slate-800 border-slate-700' : ''
      }`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Sparkles className="w-5 h-5 text-purple-500" />
            Group Related Tasks
          </DialogTitle>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
            <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>
              Analyzing task relationships...
            </p>
          </div>
        ) : groupings.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              No groupings found. Tasks may already be well-organized.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Review and select groupings to apply. Task counts and relationships will update automatically.
            </p>

            {groupings.map((group) => {
              const project = projects.find(p => p.id === group.project_id);
              return (
                <div
                  key={group.id}
                  className={`p-4 rounded-lg border ${
                    selectedGroups.has(group.id)
                      ? isDark
                        ? 'bg-purple-900/20 border-purple-700'
                        : 'bg-purple-50 border-purple-200'
                      : isDark
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedGroups.has(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {group.group_name}
                      </h4>
                      <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {group.reason}
                      </p>

                      {group.create_parent && (
                        <Badge className="mb-2 bg-blue-100 text-blue-800">
                          Create parent: "{group.parent_title}"
                        </Badge>
                      )}

                      {project && (
                        <Badge className="mb-2 bg-purple-100 text-purple-800">
                          <FolderKanban className="w-3 h-3 mr-1" />
                          {project.name}
                        </Badge>
                      )}

                      <div className={`mt-2 pl-4 border-l-2 space-y-1 ${
                        isDark ? 'border-slate-700' : 'border-gray-300'
                      }`}>
                        {group.tasks.map(task => (
                          <div key={task.id} className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            • {task.emoji} {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => applyGroupingsMutation.mutate(groupings)}
                disabled={selectedGroups.size === 0 || applyGroupingsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {applyGroupingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    Apply {selectedGroups.size} Grouping{selectedGroups.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}