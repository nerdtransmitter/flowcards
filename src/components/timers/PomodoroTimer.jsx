const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PomodoroTimer({ task, onComplete, isDark = false }) {
  const [user, setUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionNote, setSessionNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
      setTimeLeft((userData.pomodoro_work_minutes || 25) * 60);
    };
    loadUser();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const createEntryMutation = useMutation({
    mutationFn: (data) => db.entities.TimeEntry.create(data),
    onSuccess: (data) => {
      setCurrentEntryId(data.id);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.TimeEntry.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const handleStart = async () => {
    setIsRunning(true);
    if (!currentEntryId && task) {
      const entry = await createEntryMutation.mutateAsync({
        task_id: task.id,
        started_at: new Date().toISOString(),
        entry_type: 'pomodoro',
        block_strength: 'medium'
      });
      setCurrentEntryId(entry.id);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? (user?.pomodoro_break_minutes || 5) * 60 : (user?.pomodoro_work_minutes || 25) * 60);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Work session complete
      setShowNoteInput(true);
    } else {
      // Break complete
      setIsBreak(false);
      setTimeLeft((user?.pomodoro_work_minutes || 25) * 60);
    }
  };

  const handleSaveNote = async () => {
    if (currentEntryId) {
      await updateEntryMutation.mutateAsync({
        id: currentEntryId,
        data: {
          ended_at: new Date().toISOString(),
          duration_minutes: Math.round((user?.pomodoro_work_minutes || 25)),
          session_note: sessionNote
        }
      });
    }
    
    setShowNoteInput(false);
    setSessionNote("");
    setIsBreak(true);
    setTimeLeft((user?.pomodoro_break_minutes || 5) * 60);
    setCurrentEntryId(null);
  };

  const handleCompleteTask = () => {
    if (onComplete && task) {
      onComplete(task);
    }
    handleSaveNote();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak
    ? (1 - timeLeft / ((user?.pomodoro_break_minutes || 5) * 60)) * 100
    : (1 - timeLeft / ((user?.pomodoro_work_minutes || 25) * 60)) * 100;

  if (showNoteInput) {
    return (
      <Card className={`border-2 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-200'
      }`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Session Complete! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={isDark ? 'text-slate-300' : 'text-gray-700'}>
            What did you accomplish?
          </p>
          <Textarea
            value={sessionNote}
            onChange={(e) => setSessionNote(e.target.value)}
            placeholder="Quick note about what you did..."
            className={`${isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}`}
            rows={3}
          />
          <div className="flex gap-3">
            <Button
              onClick={handleSaveNote}
              variant="outline"
              className="flex-1"
            >
              Save & Take Break
            </Button>
            <Button
              onClick={handleCompleteTask}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
            >
              Task Complete!
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-rose-200'
    }`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Timer className="w-5 h-5 text-rose-600" />
          {isBreak ? 'Break Time' : 'Focus Session'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {task && (
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Working on: <strong>{task.title}</strong>
          </p>
        )}

        <div className="relative">
          <svg className="w-full h-4 rounded-full" style={{ transform: 'scaleY(-1)' }}>
            <rect width="100%" height="100%" fill={isDark ? '#334155' : '#f1f5f9'} rx="8" />
            <rect 
              width={`${progress}%`} 
              height="100%" 
              fill={isBreak ? '#10b981' : '#f43f5e'} 
              rx="8"
              className="transition-all duration-300"
            />
          </svg>
        </div>

        <motion.div
          className="text-center"
          animate={{ scale: timeLeft <= 10 && isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: timeLeft <= 10 && isRunning ? Infinity : 0 }}
        >
          <p className={`text-6xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {formatTime(timeLeft)}
          </p>
        </motion.div>

        <div className="flex gap-3">
          <Button
            onClick={isRunning ? handlePause : handleStart}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500"
            size="lg"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}