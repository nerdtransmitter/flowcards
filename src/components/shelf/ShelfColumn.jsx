import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const effortColors = {
  tiny: "bg-green-100 text-green-800",
  small: "bg-blue-100 text-blue-800",
  medium: "bg-amber-100 text-amber-800",
  large: "bg-orange-100 text-orange-800"
};

export default function ShelfColumn({ 
  title, 
  tasks, 
  droppableId, 
  emptyMessage,
  isDark = false,
  isCollapsed = false,
  onToggleCollapse,
  onTaskClick,
  showCompleted = false
}) {
  return (
    <Card className={`plm-card h-full ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
          <Badge variant="secondary" className={isDark ? 'bg-slate-700' : 'bg-gray-100'}>
            {tasks.length}
          </Badge>
        </CardTitle>
        {tasks.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        )}
      </CardHeader>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              <Droppable droppableId={droppableId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver
                        ? isDark
                          ? 'bg-slate-700/50'
                          : 'bg-purple-50'
                        : ''
                    }`}
                  >
                    {tasks.length === 0 ? (
                      <p className={`text-center text-sm py-8 ${
                        isDark ? 'text-slate-400' : 'text-gray-500'
                      }`}>
                        {emptyMessage}
                      </p>
                    ) : (
                      tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => onTaskClick?.(task)}
                              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                snapshot.isDragging
                                  ? 'shadow-xl rotate-2'
                                  : ''
                              } ${
                                isDark
                                  ? 'bg-slate-700 border-slate-600 hover:border-slate-500'
                                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                              } ${showCompleted ? 'w-full' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                {showCompleted && (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium text-sm mb-1 ${
                                    showCompleted ? 'line-through' : ''
                                  } ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {task.emoji && <span className="mr-1">{task.emoji}</span>}
                                    {task.title}
                                  </p>
                                  {task.why && (
                                    <p className={`text-xs mb-2 ${
                                      isDark ? 'text-slate-400' : 'text-gray-600'
                                    }`}>
                                      💭 {task.why}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className={`text-xs ${effortColors[task.effort]}`}>
                                      {task.effort}
                                    </Badge>
                                    {task.energy && (
                                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                                        {task.energy === "high" ? "🔥" : task.energy === "medium" ? "⚡" : "🌱"}
                                      </Badge>
                                    )}
                                    {task.ai_rationale && (
                                      <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700">
                                        AI
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}