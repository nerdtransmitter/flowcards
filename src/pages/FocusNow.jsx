const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sparkles, RefreshCw, Plus, Smile, Meh, Frown, Settings, Trophy, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TaskCard from "../components/tasks/TaskCard";
import CompletionCelebration from "../components/tasks/CompletionCelebration";
import TinyWinsCounter from "../components/tasks/TinyWinsCounter";
import TaskDetailDrawer from "../components/tasks/TaskDetailDrawer";
import ContextStarterPack from "../components/context/ContextStarterPack";
import PomodoroTimer from "../components/timers/PomodoroTimer";
import CustomizeDoNextDialog from "../components/tasks/CustomizeDoNextDialog";
import QuickActionsChips from "../components/tasks/QuickActionsChips";
import MicroSessionCard from "../components/focus/MicroSessionCard";
import ProactiveInsights from "../components/insights/ProactiveInsights";
import SessionMode from "../components/focus/SessionMode";
import StuckTaskCoach from "../components/focus/StuckTaskCoach";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function FocusNow() {
  const [user, setUser] = useState(null);
  const [energy, setEnergy] = useState(50);
  const [expandedTask, setExpandedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTaskTitle, setCompletedTaskTitle] = useState("");
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [microSessions, setMicroSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [stuckTaskToCoach, setStuckTaskToCoach] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Listen for openTaskDrawer event from StuckTaskCoach
  useEffect(() => {
    const handleOpenTaskDrawer = (e) => {
      setSelectedTask(e.detail);
      setStuckTaskToCoach(null); // Close stuck coach when opening drawer
    };
    window.addEventListener('openTaskDrawer', handleOpenTaskDrawer);
    return () => window.removeEventListener('openTaskDrawer', handleOpenTaskDrawer);
  }, []);

  const isDark = user?.theme === "dark";

  // PLM style overrides for this page
  const cardStyle = `plm-card-dashed shadow-md transition-all ${
    isDark ? 'bg-slate-800 text-white border-slate-600' : 'bg-white'
  }`;
  
  const buttonStyle = `plm-button-pill px-6 py-2 bg-[#dcfce7] text-black hover:bg-[#bbf7d0]`;

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
      const energyMap = { low: 25, medium: 50, high: 75 };
      setEnergy(energyMap[userData.current_energy] || 50);
    };
    loadUser();
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['focus-now-tasks', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const allTasks = await db.entities.Task.filter({
        status: 'active',
        created_by: user.email
      }, '-surfaced_count');
      
      const now = new Date();
      const currentHour = now.getHours();
      
      return allTasks
        .filter(task => {
          if (task.snoozed_until && new Date(task.snoozed_until) > now) return false;
          if (task.context_tags?.includes('deep_work') && currentHour >= 16) return false;
          return true;
        })
        .sort((a, b) => {
          if (a.custom_order !== undefined && b.custom_order !== undefined) {
            return a.custom_order - b.custom_order;
          }
          
          let scoreA = 0, scoreB = 0;
          
          if (a.deadline_type === 'hard' && a.aim_by) {
            const daysLeft = Math.ceil((new Date(a.aim_by) - now) / (1000 * 60 * 60 * 24));
            scoreA += Math.max(0, 100 - daysLeft * 10);
          }
          if (b.deadline_type === 'hard' && b.aim_by) {
            const daysLeft = Math.ceil((new Date(b.aim_by) - now) / (1000 * 60 * 60 * 24));
            scoreB += Math.max(0, 100 - daysLeft * 10);
          }
          
          if (a.is_pinned) scoreA += 50;
          if (b.is_pinned) scoreB += 50;
          if (a.is_important) scoreA += 30;
          if (b.is_important) scoreB += 30;
          
          if (a.next_step) scoreA += 20;
          if (b.next_step) scoreB += 20;
          
          // ENERGY FILTERING LOGIC
          // Low Energy: Boost tiny/small tasks and low energy tasks
          if (energy < 40) {
            if (a.effort === 'tiny') scoreA += 50;
            if (b.effort === 'tiny') scoreB += 50;
            if (a.effort === 'small') scoreA += 30;
            if (b.effort === 'small') scoreB += 30;
            if (a.energy === 'low') scoreA += 40;
            if (b.energy === 'low') scoreB += 40;
            if (a.energy === 'high') scoreA -= 50; // Penalty for high energy tasks
            if (b.energy === 'high') scoreB -= 50;
          } 
          // High Energy: Boost high energy/deep work
          else if (energy > 70) {
             if (a.energy === 'high') scoreA += 50;
             if (b.energy === 'high') scoreB += 50;
             if (a.context_tags?.includes('deep_work')) scoreA += 40;
             if (b.context_tags?.includes('deep_work')) scoreB += 40;
          }

          scoreA -= (a.surfaced_count || 0) * 5;
          scoreB -= (b.surfaced_count || 0) * 5;
          
          return scoreB - scoreA;
        })
        .slice(0, user?.max_surfaced || 3);
    },
    enabled: !!user,
  });

  // Calculate Micro-sessions
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Simple logic to find groupings
    const sessions = [];
    
    // 1. Quick Wins (3+ tiny/small tasks)
    const quickWins = tasks.filter(t => t.effort === 'tiny' || t.effort === 'small');
    if (quickWins.length >= 3) {
      sessions.push({
        id: 'quick-wins',
        title: 'Quick Wins Power Hour',
        rationale: 'Knock out 3+ small tasks to build momentum',
        tasks: quickWins.slice(0, 4),
        type: 'momentum'
      });
    }

    // 2. Context Batches
    const contextGroups = {};
    tasks.forEach(t => {
      t.context_tags?.forEach(tag => {
        if (!contextGroups[tag]) contextGroups[tag] = [];
        contextGroups[tag].push(t);
      });
    });

    Object.entries(contextGroups).forEach(([tag, groupTasks]) => {
      if (groupTasks.length >= 3) {
        sessions.push({
          id: `context-${tag}`,
          title: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Session`,
          rationale: `Batching similar ${tag} tasks saves mental energy`,
          tasks: groupTasks.slice(0, 4),
          type: 'batch'
        });
      }
    });

    setMicroSessions(sessions.slice(0, 2)); // Show max 2 suggestions
  }, [tasks]);

  const handleStartSession = (session) => {
    setActiveSession(session);
  };

  const handleScheduleSession = (session) => {
    // Open TimeBlock dialog with tasks pre-selected
    const taskIds = session.tasks.map(t => t.id);
    const event = new CustomEvent('openTimeBlockDialog', { detail: { taskIds, title: session.title } });
    window.dispatchEvent(event);
  };

  const handleInsightAction = async (insight) => {
    if (insight.actionType === 'shelf_low_priority') {
      const lowPriTasks = tasks.filter(t => t.priority === 'low' || !t.priority);
      if (lowPriTasks.length > 0) {
        await Promise.all(lowPriTasks.slice(0, 5).map(t => db.entities.Task.update(t.id, { status: 'waiting' })));
        queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
        toast.success(`Moved ${Math.min(lowPriTasks.length, 5)} tasks to Shelf`);
      } else {
        toast.info("No low priority tasks found to move.");
      }
    } else if (insight.actionType === 'review_stagnant') {
      // Find the first stagnant task to coach
      const stagnantTask = tasks.find(t => (t.surfaced_count || 0) > 5);
      if (stagnantTask) {
        setStuckTaskToCoach(stagnantTask);
      } else {
        navigate(createPageUrl('Shelf'));
      }
    }
  };

  const { data: todayCompletions = 0 } = useQuery({
    queryKey: ['today-completions', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completed = await db.entities.Task.filter({
        status: 'done',
        created_by: user.email
      }, '-completed_at', 100);
      
      return completed.filter(t => {
        if (!t.completed_at) return false;
        const completedDate = new Date(t.completed_at);
        return completedDate >= today;
      }).length;
    },
    enabled: !!user,
  });

  const { data: tinyWinsToday = 0 } = useQuery({
    queryKey: ['tiny-wins-today', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completed = await db.entities.Task.filter({
        status: 'done',
        created_by: user.email,
        effort: 'tiny'
      }, '-completed_at', 100);
      
      return completed.filter(t => {
        if (!t.completed_at) return false;
        const completedDate = new Date(t.completed_at);
        return completedDate >= today;
      }).length;
    },
    enabled: !!user,
  });

  const completeMutation = useMutation({
    mutationFn: async (task) => {
      const previousData = { ...task };
      const newStatus = task.status === 'done' ? 'active' : 'done';
      const taskData = {
        ...task,
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        uncompleted_at: newStatus === 'active' ? new Date().toISOString() : null
      };
      await db.entities.Task.update(task.id, taskData);
      return { task: taskData, previousData };
    },
    onSuccess: ({ task, previousData }) => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-completions'] });
      queryClient.invalidateQueries({ queryKey: ['tiny-wins-today'] });
      
      if (task.status === 'done') {
        setCompletedTaskTitle(task.title);
        setShowCelebration(true);
        
        let undoExecuted = false;
        
        const undoAction = async () => {
          if (undoExecuted) return;
          undoExecuted = true;
          
          await db.entities.Task.update(previousData.id, previousData);
          queryClient.invalidateQueries();
          toast.success('Task restored! ↩️');
        };

        // Enhanced 5-second undo toast
        toast.success(
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-semibold">Task completed! 🎉</p>
              <p className="text-sm opacity-90">{task.title}</p>
            </div>
          </div>,
          {
            duration: 5000,
            action: {
              label: 'Undo (5s)',
              onClick: undoAction
            },
            className: 'bg-green-600 text-white border-green-700'
          }
        );
        
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      } else {
        toast.success('Task reactivated! ✨');
      }
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ task, duration }) => {
      const now = new Date();
      let snoozeUntil = new Date(now);
      
      if (duration === 'later-today') {
        snoozeUntil.setHours(now.getHours() + 4);
      } else if (duration === 'tomorrow') {
        snoozeUntil.setDate(now.getDate() + 1);
        snoozeUntil.setHours(9, 0, 0, 0);
      } else if (duration === 'next-week') {
        snoozeUntil.setDate(now.getDate() + 7);
        snoozeUntil.setHours(9, 0, 0, 0);
      }
      
      await db.entities.Task.update(task.id, {
        snoozed_until: snoozeUntil.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      toast.success('Task snoozed 💤');
    },
  });

  const shelfMutation = useMutation({
    mutationFn: async (task) => {
      await db.entities.Task.update(task.id, {
        status: 'waiting'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      toast.success('Moved to Shelf 📦');
    },
  });

  const updateSurfacedMutation = useMutation({
    mutationFn: async (taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await db.entities.Task.update(taskId, {
          surfaced_count: (task.surfaced_count || 0) + 1
        });
      }
    },
  });

  useEffect(() => {
    if (tasks.length > 0 && user) {
      tasks.forEach(task => {
        updateSurfacedMutation.mutate(task.id);
      });
    }
  }, [tasks.map(t => t.id).join(','), user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleEnergyChange = async (value) => {
    setEnergy(value[0]);
    const energyLevel = value[0] < 40 ? 'low' : value[0] < 70 ? 'medium' : 'high';
    await db.auth.updateMe({ current_energy: energyLevel });
    // Trigger a refresh/re-sort implicitly by invalidating query if we were using it in query key
    // For now, the sort logic below uses this local energy state
    queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
  };

  const getEnergyEmoji = () => {
    if (energy < 40) return <Frown className="w-5 h-5 text-blue-500" />;
    if (energy < 70) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Smile className="w-5 h-5 text-green-500" />;
  };

  const handleAskCoach = (task) => {
    navigate(`${createPageUrl("Chat")}?task=${task.id}`);
  };

  const handleStartPomodoro = (task) => {
    setPomodoroTask(task);
    setShowPomodoro(true);
  };

  const handleOpenDetail = (task) => {
    setSelectedTask(task);
  };

  const handleStarterPackSelect = async (pack) => {
    await db.entities.Task.create({
      title: pack.title,
      emoji: pack.emoji,
      effort: pack.effort,
      status: 'active',
      source: 'quick'
    });
    queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
  };

  return (
    <>
    <div className={`min-h-screen p-4 md:p-8 bg-plm-grid`}>
    <div className="max-w-4xl mx-auto space-y-6">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-10 py-12 bg-plm-pink-grid rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
    >
      <div className="inline-block bg-white px-8 py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 rotate-1 rounded-full">
        <h1 className="text-6xl font-serif-display font-black tracking-tight italic text-black flex items-center gap-3">
          <Sparkles className="w-10 h-10 text-pink-500 fill-pink-500" />
          Focus Now
        </h1>
      </div>
      <div className="block mt-4">
        <p className="text-xl font-bold bg-[#dcfce7] inline-block px-6 py-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1">
          Your 3 most meaningful tasks for this moment
        </p>
      </div>
    </motion.div>

        {todayCompletions > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={cardStyle}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 border-2 border-black rounded-none">
                    <Trophy className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <p className="font-black text-xl uppercase tracking-tight">
                      Your Wins Today
                    </p>
                    <p className="font-medium text-gray-600">
                      {todayCompletions} {todayCompletions === 1 ? 'task' : 'tasks'} completed! 🎉
                    </p>
                  </div>
                </div>
                <TinyWinsCounter count={tinyWinsToday} isDark={isDark} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card className={cardStyle}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="font-black text-lg uppercase tracking-tight">
                  How's your energy?
                </span>
                <div className="scale-125">{getEnergyEmoji()}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPomodoro(!showPomodoro)}
                className={buttonStyle + " gap-2"}
              >
                <Timer className="w-4 h-4" />
                {showPomodoro ? 'HIDE TIMER' : 'POMODORO'}
              </Button>
            </div>
            <div className="space-y-6">
              <Slider
                value={[energy]}
                onValueChange={handleEnergyChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
                <span>Low energy</span>
                <span>High energy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProactiveInsights 
          tasks={tasks} 
          onAction={handleInsightAction}
          isDark={isDark}
        />

        {microSessions.length > 0 && (
          <div className="space-y-4">
             <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
               Suggested Sessions
             </h2>
             {microSessions.map(session => (
               <MicroSessionCard 
                 key={session.id} 
                 session={session} 
                 onStartSession={handleStartSession}
                 onScheduleSession={handleScheduleSession}
                 isDark={isDark}
               />
             ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Do Next
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Tasks are pulled from Brain Dump & Projects based on priority, deadline, and your current energy level.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCustomize(true)}
              className="plm-button-pill bg-white text-black hover:bg-gray-50 gap-2 px-6"
            >
              <Settings className="w-4 h-4" />
              Customize
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="plm-button-pill bg-white text-black hover:bg-gray-50 gap-2 px-6"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-48 rounded-2xl animate-pulse ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`} />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center py-16">
                <Sparkles className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-slate-600' : 'text-gray-300'
                }`} />
                <p className={`text-xl font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Nothing here right now ✨
                </p>
                <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} mb-6`}>
                  Time for a break? Or explore the Shelf for a 15-min task?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate(createPageUrl('BrainDump'))}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('Shelf'))}
                    className={isDark ? 'border-slate-600' : ''}
                  >
                    Browse Shelf
                  </Button>
                </div>
              </div>
              
              {user?.current_location && (
                <ContextStarterPack
                  context={user.current_location}
                  onSelect={handleStarterPackSelect}
                  isDark={isDark}
                />
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={completeMutation.mutate}
                  onExpand={(t) => setExpandedTask(expandedTask?.id === t.id ? null : t)}
                  expanded={expandedTask?.id === task.id}
                  showContextChips={user?.show_emoji}
                  isDark={isDark}
                  showQuickActions={true}
                  onSnooze={(task, duration) => snoozeMutation.mutate({ task, duration })}
                  onShelf={shelfMutation.mutate}
                  onAskCoach={handleAskCoach}
                  onStartPomodoro={handleStartPomodoro}
                  onOpenDetail={handleOpenDetail}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] })}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>

      <CompletionCelebration 
        show={showCelebration} 
        taskTitle={completedTaskTitle}
        isDark={isDark}
      />

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isDark={isDark}
      />

      <CustomizeDoNextDialog
        open={showCustomize}
        onClose={() => setShowCustomize(false)}
        tasks={tasks}
        isDark={isDark}
      />

      <AnimatePresence>
        {showPomodoro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <PomodoroTimer 
              task={pomodoroTask || tasks[0]} 
              onComplete={completeMutation.mutate}
              isDark={isDark}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SessionMode 
        session={activeSession}
        onClose={() => setActiveSession(null)}
        isDark={isDark}
      />

      <StuckTaskCoach 
        task={stuckTaskToCoach}
        open={!!stuckTaskToCoach}
        onClose={() => setStuckTaskToCoach(null)}
        isDark={isDark}
      />
    </>
  );
}