const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Play, Pause, RotateCcw, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function FloatingTimer({ user, isDark }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    setTimeLeft((user.pomodoro_work_minutes || 25) * 60);
  }, [user]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Listen for timer start events
  useEffect(() => {
    const handleStartTimer = (event) => {
      const { task } = event.detail;
      setCurrentTask(task);
      setIsVisible(true);
      setIsExpanded(true);
      handleStart(task);
    };

    window.addEventListener('startFloatingTimer', handleStartTimer);
    return () => window.removeEventListener('startFloatingTimer', handleStartTimer);
  }, []);

  const createEntryMutation = useMutation({
    mutationFn: (data) => db.entities.TimeEntry.create(data),
    onSuccess: (data) => {
      setCurrentEntryId(data.id);
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const handleStart = async (task = currentTask) => {
    setIsRunning(true);
    if (!currentEntryId && task) {
      createEntryMutation.mutate({
        task_id: task.id,
        started_at: new Date().toISOString(),
        entry_type: 'pomodoro',
        block_strength: 'medium'
      });
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft((user?.pomodoro_work_minutes || 25) * 60);
  };

  const handleStop = async () => {
    if (currentEntryId) {
      const duration = Math.round(((user?.pomodoro_work_minutes || 25) * 60 - timeLeft) / 60);
      await updateEntryMutation.mutateAsync({
        id: currentEntryId,
        data: {
          ended_at: new Date().toISOString(),
          duration_minutes: duration
        }
      });
    }
    setIsVisible(false);
    setIsRunning(false);
    setCurrentTask(null);
    setCurrentEntryId(null);
    setTimeLeft((user?.pomodoro_work_minutes || 25) * 60);
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (currentEntryId) {
      await updateEntryMutation.mutateAsync({
        id: currentEntryId,
        data: {
          ended_at: new Date().toISOString(),
          duration_minutes: user?.pomodoro_work_minutes || 25
        }
      });
    }
    toast.success('Session complete! 🎉', {
      description: 'Great work on ' + (currentTask?.title || 'your task'),
    });
    setCurrentTask(null);
    setCurrentEntryId(null);
    setTimeLeft((user?.pomodoro_work_minutes || 25) * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-24 right-6 z-40"
      >
        <Card className={`border-2 shadow-2xl ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-rose-200'
        } ${isExpanded ? 'w-72' : 'w-20'}`}>
          <CardContent className="p-3">
            {isExpanded ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-rose-600" />
                    <span className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Focus Timer
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(false)}
                      className="h-6 w-6"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStop}
                      className="h-6 w-6"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {currentTask && (
                  <p className={`text-xs truncate ${
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {currentTask.emoji} {currentTask.title}
                  </p>
                )}

                <div className={`text-3xl font-bold text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatTime(timeLeft)}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isRunning ? handlePause : () => handleStart()}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500"
                  >
                    {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button
                    onClick={handleReset}
                    size="sm"
                    variant="outline"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                className="w-full h-full"
              >
                <div className="flex flex-col items-center gap-1">
                  <Timer className="w-5 h-5 text-rose-600" />
                  <span className="text-xs font-mono">{formatTime(timeLeft)}</span>
                </div>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}