const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckCircle2,
  Circle,
  Clock, 
  Zap, 
  ChevronDown,
  Pin,
  AlertCircle,
  Archive,
  Timer,
  Flag,
  FolderKanban,
  CalendarPlus,
  MoreVertical,
  PlayCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuickEditChip from "./QuickEditChip";
import { useQuery } from "@tanstack/react-query";

const effortColors = {
  tiny: "bg-green-100 text-green-800 border-black border-2 font-bold",
  small: "bg-blue-100 text-blue-800 border-black border-2 font-bold",
  medium: "bg-amber-100 text-amber-800 border-black border-2 font-bold",
  large: "bg-orange-100 text-orange-800 border-black border-2 font-bold"
};

const contextIcons = {
  home: "🏠",
  errands: "🏃",
  laptop: "💻",
  phone: "📱",
  quiet: "🤫",
  "15min": "⚡",
  "30min": "⏱️",
  "60min": "⏰",
  deep_work: "🧠"
};

export default function TaskCard({ 
  task, 
  onComplete, 
  onExpand, 
  expanded = false,
  showContextChips = true,
  isDark = false,
  onSnooze,
  onShelf,
  onAskCoach,
  onStartPomodoro,
  onAddToTimeBlock,
  onOpenDetail,
  showQuickActions = false,
  isDoneState = false,
  isArchivedState = false,
  onUpdate
}) {
  const [isCompleting, setIsCompleting] = React.useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-chips'],
    queryFn: async () => {
      const user = await db.auth.me();
      return db.entities.Project.filter({ created_by: user.email }, '-created_date');
    },
  });

  const getDaysLeft = () => {
    if (!task.aim_by) return null;
    const days = differenceInDays(new Date(task.aim_by), new Date());
    if (days < 0) return { text: "Overdue", color: "text-amber-600", urgent: true };
    if (days === 0) return { text: "Today", color: "text-amber-500", urgent: true };
    if (days === 1) return { text: "Tomorrow", color: "text-blue-500", urgent: false };
    if (days <= 7) return { text: `${days} days`, color: "text-blue-500", urgent: false };
    return { text: `${days} days`, color: "text-gray-500", urgent: false };
  };

  const handleComplete = async (e) => {
    e.stopPropagation();
    setIsCompleting(true);
    await onComplete(task);
    setIsCompleting(false);
  };

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(task);
    }
  };

  const daysLeft = getDaysLeft();
  const isUrgent = (task.deadline_type === 'hard' && daysLeft?.urgent) || task.is_important;
  const isCompleted = task.status === 'done';
  const isTinyWin = task.effort === 'tiny' && isCompleted;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        layout
      >
        <Card 
          className={`plm-card relative overflow-hidden group cursor-pointer min-h-[180px] flex flex-col hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            isDark 
              ? 'bg-slate-800 border-slate-700' 
              : isUrgent
                ? 'bg-amber-50'
                : 'bg-white'
          }`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          aria-label={`Task: ${task.title}. ${isCompleted ? 'Completed' : 'Active'}. Click to view details.`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
        >
          {/* Tiny Win Badge - Upper Right Corner */}
          {isTinyWin && (
            <div className="absolute top-3 right-3 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm">
                    <Zap className="w-3 h-3 mr-1" />
                    Tiny Win!
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick 5-10 minute task completed! 🎉</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex gap-4">
              {/* Checkbox - Visual status indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className={`shrink-0 rounded-full w-10 h-10 transition-all duration-200 ${
                      isDark
                        ? 'hover:bg-green-500/20 text-green-400'
                        : 'hover:bg-green-50 text-green-600'
                    }`}
                    aria-label={isCompleted ? 'Mark as active' : 'Mark as completed'}
                    aria-pressed={isCompleted}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCompleted ? 'Mark as active (uncomplete)' : 'Mark as completed'}</p>
                </TooltipContent>
              </Tooltip>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className={`font-semibold text-lg leading-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  } ${isCompleted ? 'line-through opacity-60' : ''}`}>
                    {task.emoji && <span className="mr-2">{task.emoji}</span>}
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.is_pinned && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Pin className="w-4 h-4 text-purple-500" aria-label="Pinned task" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Pinned (won't auto-decay)</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {task.is_important && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Flag className="w-4 h-4 text-amber-500" aria-label="High priority" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>High priority task</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {showQuickActions && (
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label="More options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>More actions (⋮)</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          {onSnooze && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSnooze(task, 'later-today'); }}>
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze until later today
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSnooze(task, 'tomorrow'); }}>
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze until tomorrow
                              </DropdownMenuItem>
                            </>
                          )}
                          {onShelf && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShelf(task); }}>
                              <Archive className="w-4 h-4 mr-2" />
                              Move to Shelf
                            </DropdownMenuItem>
                          )}
                          {onStartPomodoro && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartPomodoro(task); }}>
                              <Timer className="w-4 h-4 mr-2" />
                              Start Pomodoro
                            </DropdownMenuItem>
                          )}
                          {onAddToTimeBlock && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddToTimeBlock(task); }}>
                              <CalendarPlus className="w-4 h-4 mr-2" />
                              Add to Time Block
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {task.why && (
                  <p className={`text-sm mb-3 ${
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  } ${isCompleted ? 'opacity-60' : ''}`}>
                    💭 {task.why}
                  </p>
                )}

                {task.next_step && (
                  <div className={`flex items-start gap-2 mb-3 p-3 rounded-lg ${
                    isDark ? 'bg-slate-700/50' : 'bg-blue-50'
                  } ${isCompleted ? 'opacity-60' : ''}`}>
                    <Zap className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDark ? 'text-slate-200' : 'text-blue-900'
                    }`}>
                      {task.next_step}
                    </p>
                  </div>
                )}

                {/* Spacer to push badges to bottom */}
                <div className="flex-1" />

                {/* Quick Edit Chips */}
                <div className="flex flex-wrap items-center gap-2 mt-3 mb-2" onClick={(e) => e.stopPropagation()}>
                  <QuickEditChip task={task} type="priority" isDark={isDark} projects={projects} onUpdate={onUpdate} />
                  <QuickEditChip task={task} type="project" isDark={isDark} projects={projects} onUpdate={onUpdate} />
                  <QuickEditChip task={task} type="due" isDark={isDark} projects={projects} onUpdate={onUpdate} />
                  <QuickEditChip task={task} type="duration" isDark={isDark} projects={projects} onUpdate={onUpdate} />
                </div>

                {/* Badges at bottom */}
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className={effortColors[task.effort]}>
                        {task.effort}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Effort: {task.effort}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {task.energy && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`${
                          isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-gray-100 text-gray-700 border-black border-2 font-bold'
                        }`}>
                          {task.energy === "high" ? "🔥" : task.energy === "medium" ? "⚡" : "🌱"} {task.energy}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Energy required: {task.energy}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {task.project_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`${
                          isDark ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-black border-2 font-bold'
                        }`}>
                          <FolderKanban className="w-3 h-3 mr-1" />
                          Project
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Part of a project</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {daysLeft && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={`flex items-center gap-1 border-2 border-black font-bold ${
                          daysLeft.urgent 
                            ? 'bg-amber-50 text-amber-700'
                            : isDark
                              ? 'bg-slate-700 text-slate-300 border-slate-600'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {daysLeft.text}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Due: {daysLeft.text}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {showContextChips && task.context_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.context_tags.map((context, idx) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <span
                            className={`text-xs px-2 py-1 rounded-full border-2 border-black font-bold ${
                              isDark
                                ? 'bg-slate-700 text-slate-300 border-slate-600'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            {contextIcons[context]} {context}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Context: {context}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}