const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Archive, Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShelfColumn from "../components/shelf/ShelfColumn";
import CreateTimeBlockDialog from "../components/timeblocks/CreateTimeBlockDialog";
import TaskDetailDrawer from "../components/tasks/TaskDetailDrawer";
import { DragDropContext } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from "date-fns";

export default function Shelf() {
  const [user, setUser] = useState(null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [aiReview, setAiReview] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showTimeBlockDialog, setShowTimeBlockDialog] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['shelf-tasks', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.Task.filter({
        created_by: user.email
      }, '-updated_date');
    },
    enabled: !!user,
  });

  const { data: timeBlocks = [] } = useQuery({
    queryKey: ['time-blocks', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.TimeBlock.filter({
        created_by: user.email
      }, '-start_time');
    },
    enabled: !!user,
  });

  // Get tasks with time blocks (scheduled)
  const tasksWithBlocks = new Set();
  timeBlocks.forEach(block => {
    if (block.task_ids && Array.isArray(block.task_ids)) {
      block.task_ids.forEach(taskId => tasksWithBlocks.add(taskId));
    }
  });

  const scheduled = allTasks.filter(t => tasksWithBlocks.has(t.id));
  const inbox = allTasks.filter(t => t.status === 'active' && !tasksWithBlocks.has(t.id));
  const waiting = allTasks.filter(t => t.status === 'waiting' && !tasksWithBlocks.has(t.id));
  const someday = allTasks.filter(t => t.status === 'someday' && !tasksWithBlocks.has(t.id));
  const done = allTasks.filter(t => t.status === 'done');
  const archived = allTasks.filter(t => t.status === 'archived');

  const moveMutation = useMutation({
    mutationFn: ({ taskId, newStatus }) => 
      db.entities.Task.update(taskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf-tasks'] });
    },
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    // Moving TO Scheduled column
    if (destination.droppableId === 'scheduled-column') {
      const task = allTasks.find(t => t.id === draggableId);
      if (task) {
        setTaskToSchedule(task);
        setShowTimeBlockDialog(true);
      }
      return;
    }

    // Moving FROM Scheduled column
    if (source.droppableId === 'scheduled-column') {
      // Find and delete the time block(s) containing this task
      const blocksToDelete = timeBlocks.filter(block => 
        block.task_ids && block.task_ids.includes(draggableId)
      );
      
      blocksToDelete.forEach(block => {
        db.entities.TimeBlock.delete(block.id);
      });
      
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      toast.success('Removed from schedule');
      return;
    }

    const statusMap = {
      'inbox-column': 'active',
      'waiting-column': 'waiting',
      'someday-column': 'someday',
      'done-column': 'done',
      'archived-column': 'archived'
    };

    const newStatus = statusMap[destination.droppableId];
    if (!newStatus) return;

    moveMutation.mutate({ taskId: draggableId, newStatus });
    toast.success(`Task moved to ${newStatus}`);
  };

  const handleAskAIReview = async () => {
    setIsGeneratingReview(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Review these shelf tasks and provide recommendations for each:

Waiting tasks: ${waiting.map(t => `- ${t.id}: ${t.title} (${t.effort} effort, ${t.energy} energy)`).join('\n')}
Someday tasks: ${someday.map(t => `- ${t.id}: ${t.title} (${t.effort} effort, ${t.energy} energy)`).join('\n')}

For each task, suggest:
1. When to tackle it - specify as "today", "tomorrow", or a specific day like "next Monday"
2. Estimated time needed in minutes
3. Number of pomodoros
4. One practical tip based on effort/energy level

Return as JSON with task recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_id: { type: "string" },
                  task_title: { type: "string" },
                  best_time: { type: "string" },
                  estimated_minutes: { type: "number" },
                  pomodoros: { type: "number" },
                  tip: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiReview(result.recommendations);
    } catch (error) {
      toast.error("Failed to generate AI review");
    }
    setIsGeneratingReview(false);
  };

  const [undoStack, setUndoStack] = React.useState([]);

  const handleApplyRecommendation = async (rec) => {
    const task = allTasks.find(t => t.id === rec.task_id);
    if (!task) return;

    // Store original state for undo
    const originalState = {
      task_id: task.id,
      ai_rationale: task.ai_rationale,
      estimated_minutes: task.estimated_minutes,
      aim_by: task.aim_by,
      effort: task.effort
    };

    // Parse the best_time and create aim_by date
    const parseNLDate = (timeStr) => {
      const lower = timeStr.toLowerCase();
      if (lower.includes('today')) return new Date();
      if (lower.includes('tomorrow')) return addDays(new Date(), 1);
      if (lower.includes('next monday')) return nextMonday(new Date());
      if (lower.includes('next tuesday')) return nextTuesday(new Date());
      if (lower.includes('next wednesday')) return nextWednesday(new Date());
      if (lower.includes('next thursday')) return nextThursday(new Date());
      if (lower.includes('next friday')) return nextFriday(new Date());
      if (lower.includes('next saturday')) return nextSaturday(new Date());
      if (lower.includes('next sunday')) return nextSunday(new Date());
      return null;
    };

    const targetDate = parseNLDate(rec.best_time);
    const newAimBy = targetDate ? targetDate.toISOString().split('T')[0] : null;

    // Determine effort based on estimated_minutes
    let newEffort = task.effort;
    if (rec.estimated_minutes <= 15) newEffort = 'tiny';
    else if (rec.estimated_minutes <= 45) newEffort = 'small';
    else if (rec.estimated_minutes <= 120) newEffort = 'medium';
    else newEffort = 'large';

    // Apply changes
    await db.entities.Task.update(rec.task_id, {
      ai_rationale: rec.rationale,
      estimated_minutes: rec.estimated_minutes,
      aim_by: newAimBy,
      effort: newEffort
    });

    queryClient.invalidateQueries({ queryKey: ['shelf-tasks'] });
    
    // Add to undo stack
    setUndoStack(prev => [...prev, originalState]);

    toast.success("Recommendation applied!", {
      action: {
        label: "Undo",
        onClick: () => handleUndo(originalState)
      }
    });
  };

  const handleUndo = async (originalState) => {
    await db.entities.Task.update(originalState.task_id, {
      ai_rationale: originalState.ai_rationale || null,
      estimated_minutes: originalState.estimated_minutes || null,
      aim_by: originalState.aim_by || null,
      effort: originalState.effort
    });
    
    queryClient.invalidateQueries({ queryKey: ['shelf-tasks'] });
    setUndoStack(prev => prev.filter(s => s.task_id !== originalState.task_id));
    toast.success("Changes reverted!");
  };

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Archive className={`w-10 h-10 ${
                isDark ? 'text-pink-400' : 'text-pink-500'
              }`} />
              <h1 className={`text-6xl font-serif-display font-black tracking-tight italic ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Shelf
              </h1>
            </div>
            <Button
              onClick={handleAskAIReview}
              disabled={isGeneratingReview}
              className="plm-button-pill bg-pink-500 text-white hover:bg-pink-600 border-black"
            >
              {isGeneratingReview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ask AI for Shelf Review
                </>
              )}
            </Button>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Organize all your tasks – new inbox items, waiting, someday, and archive
          </p>
        </motion.div>

        {aiReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-6 rounded-xl ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-purple-200 shadow-lg'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              AI Recommendations
            </h3>
            <div className="space-y-3">
              {aiReview.map((rec, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-slate-700' : 'bg-purple-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {rec.task_title}
                      </p>
                      <div className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        <p>⏰ Best time: {rec.best_time}</p>
                        <p>⏱️ Estimated: {rec.estimated_minutes} min ({rec.pomodoros} pomodoros)</p>
                        <p>💡 Tip: {rec.tip}</p>
                        <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {rec.rationale}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyRecommendation(rec)}
                      className="plm-button-pill bg-[#dcfce7] text-black hover:bg-[#bbf7d0] h-8 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className={`w-8 h-8 animate-spin ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`} />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
              <ShelfColumn
                title="Inbox"
                tasks={inbox}
                droppableId="inbox-column"
                emptyMessage="No tasks in inbox"
                isDark={isDark}
                isCollapsed={collapsedSections['inbox']}
                onToggleCollapse={() => toggleSection('inbox')}
                onTaskClick={setSelectedTask}
                color="blue"
              />
              <ShelfColumn
                title="Scheduled"
                tasks={scheduled}
                droppableId="scheduled-column"
                emptyMessage="No scheduled tasks"
                isDark={isDark}
                isCollapsed={collapsedSections['scheduled']}
                onToggleCollapse={() => toggleSection('scheduled')}
                onTaskClick={setSelectedTask}
                color="rose"
              />
              <ShelfColumn
                title="Waiting"
                tasks={waiting}
                droppableId="waiting-column"
                emptyMessage="No tasks waiting"
                isDark={isDark}
                isCollapsed={collapsedSections['waiting']}
                onToggleCollapse={() => toggleSection('waiting')}
                onTaskClick={setSelectedTask}
                color="amber"
              />
              <ShelfColumn
                title="Someday"
                tasks={someday}
                droppableId="someday-column"
                emptyMessage="No someday tasks"
                isDark={isDark}
                isCollapsed={collapsedSections['someday']}
                onToggleCollapse={() => toggleSection('someday')}
                onTaskClick={setSelectedTask}
                color="purple"
              />
              <ShelfColumn
                title="Done"
                tasks={done}
                droppableId="done-column"
                emptyMessage="No completed tasks"
                isDark={isDark}
                isCollapsed={collapsedSections['done']}
                onToggleCollapse={() => toggleSection('done')}
                onTaskClick={setSelectedTask}
                showCompleted={true}
                color="green"
              />
              <ShelfColumn
                title="Archived"
                tasks={archived}
                droppableId="archived-column"
                emptyMessage="No archived tasks"
                isDark={isDark}
                isCollapsed={collapsedSections['archived']}
                onToggleCollapse={() => toggleSection('archived')}
                onTaskClick={setSelectedTask}
                color="gray"
              />
            </div>
          </DragDropContext>
        )}
      </div>

      <CreateTimeBlockDialog
        open={showTimeBlockDialog}
        onClose={() => {
          setShowTimeBlockDialog(false);
          setTaskToSchedule(null);
        }}
        tasks={taskToSchedule ? [taskToSchedule] : []}
        isDark={isDark}
        initialTask={taskToSchedule}
      />

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isDark={isDark}
      />
    </div>
  );
}