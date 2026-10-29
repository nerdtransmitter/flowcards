const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Pin, X, Eye } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";

export default function CustomizeDoNextDialog({ open, onClose, tasks, isDark = false }) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(localTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalTasks(items);
  };

  const handleTogglePin = async (task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { is_pinned: !task.is_pinned }
    });
    
    setLocalTasks(localTasks.map(t => 
      t.id === task.id ? { ...t, is_pinned: !t.is_pinned } : t
    ));
  };

  const handleRemoveFromFocus = async (task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { status: 'waiting' }
    });
    
    setLocalTasks(localTasks.filter(t => t.id !== task.id));
    toast.success('Task moved to Shelf');
  };

  const handleSave = async () => {
    // Save custom order
    for (let i = 0; i < localTasks.length; i++) {
      await updateTaskMutation.mutateAsync({
        id: localTasks[i].id,
        data: { custom_order: i }
      });
    }
    
    toast.success('Do Next customized!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'
      }`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Customize Do Next
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-slate-400' : 'text-gray-600'}>
            Reorder, pin, or remove tasks from your Focus Now list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`border-2 ${
                            snapshot.isDragging
                              ? 'shadow-lg'
                              : isDark
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-white border-gray-200'
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className={`w-5 h-5 ${
                                  isDark ? 'text-slate-500' : 'text-gray-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {task.emoji && <span className="mr-2">{task.emoji}</span>}
                                  {task.title}
                                </p>
                                {task.ai_rationale && (
                                  <p className={`text-xs mt-1 ${
                                    isDark ? 'text-slate-400' : 'text-gray-600'
                                  }`}>
                                    <Eye className="w-3 h-3 inline mr-1" />
                                    {task.ai_rationale}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleTogglePin(task)}
                                  className={task.is_pinned ? 'text-purple-500' : ''}
                                >
                                  <Pin className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveFromFocus(task)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {localTasks.length === 0 && (
            <p className={`text-center py-8 ${
              isDark ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No tasks in Focus Now
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
              Save Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}