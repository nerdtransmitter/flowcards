const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, CheckCircle2, Trophy, ArrowRight, Minimize2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

export default function SessionMode({ session, onClose, onComplete, isDark }) {
  const [tasks, setTasks] = useState(session?.tasks || []);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25m
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  
  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      toast.success("Timer finished! Take a break or keep going.");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteTask = async (task) => {
    // Optimistic update
    setCompletedTaskIds([...completedTaskIds, task.id]);
    
    // Call API
    await db.entities.Task.update(task.id, { 
      status: 'done',
      completed_at: new Date().toISOString()
    });

    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      toast.success("Task done! Next up...");
    } else {
      setShowSummary(true);
      setIsActive(false);
    }
  };

  const handleFinishEarly = () => {
    setShowSummary(true);
    setIsActive(false);
  };

  if (!session) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <div className={`p-4 border-b-2 border-black flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div>
          <h2 className="text-xl font-serif-display font-black italic tracking-tight">{session.title}</h2>
          <p className="text-sm opacity-70">{completedTaskIds.length}/{tasks.length} completed</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Minimize2 className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Task List */}
        <div className={`w-80 border-r-2 border-black p-4 overflow-y-auto hidden md:block ${isDark ? 'border-slate-700 bg-slate-900' : 'bg-gray-50'}`}>
          <h3 className="font-bold uppercase tracking-wider mb-4 text-sm opacity-50">Session Tasks</h3>
          <div className="space-y-2">
            {tasks.map((task, idx) => (
              <div 
                key={task.id}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  completedTaskIds.includes(task.id)
                    ? isDark ? 'bg-green-900/20 border-green-800 opacity-50' : 'bg-green-50 border-green-200 opacity-50'
                    : idx === currentTaskIndex
                      ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-transparent hover:bg-gray-100'
                }`}
                onClick={() => setCurrentTaskIndex(idx)}
              >
                <div className="flex items-center gap-2">
                  {completedTaskIds.includes(task.id) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-xs font-bold w-4 h-4 flex items-center justify-center border border-current rounded-full">
                      {idx + 1}
                    </span>
                  )}
                  <span className={`text-sm font-medium ${completedTaskIds.includes(task.id) ? 'line-through' : ''}`}>
                    {task.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Focus Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {!showSummary ? (
            <div className="max-w-2xl w-full text-center space-y-8">
              {/* Timer */}
              <div className="inline-flex items-center gap-4 bg-black text-white px-8 py-4 rounded-full font-mono text-4xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                {formatTime(timeLeft)}
                <button onClick={() => setIsActive(!isActive)} className="hover:text-pink-400 transition-colors">
                  {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
              </div>

              {/* Current Task */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTask?.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="uppercase tracking-widest font-bold text-pink-500">Current Focus</div>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight">
                    {currentTask?.title}
                  </h1>
                  {currentTask?.notes && (
                    <p className="text-xl opacity-70 max-w-xl mx-auto">{currentTask.notes}</p>
                  )}
                  
                  <div className="flex gap-2 justify-center mt-4">
                     {currentTask?.effort && <Badge variant="outline" className="text-sm px-3 py-1 border-2 border-current">{currentTask.effort}</Badge>}
                     {currentTask?.project_id && <Badge variant="outline" className="text-sm px-3 py-1 border-2 border-current">Project Task</Badge>}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="pt-12 flex justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => handleCompleteTask(currentTask)}
                  className="plm-button-pill h-16 px-8 text-xl bg-green-500 hover:bg-green-600 text-white border-black"
                >
                  <Check className="w-6 h-6 mr-2" />
                  Complete Task
                </Button>
                {currentTaskIndex < tasks.length - 1 && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setCurrentTaskIndex(prev => prev + 1)}
                    className="plm-button-pill h-16 px-6 border-black bg-white text-black hover:bg-gray-100"
                  >
                    Skip
                  </Button>
                )}
              </div>
              
              <button 
                onClick={handleFinishEarly}
                className="mt-8 text-sm opacity-50 hover:opacity-100 underline"
              >
                End Session Early
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <Trophy className="w-32 h-32 mx-auto text-yellow-400 drop-shadow-lg" />
              <h1 className="text-5xl font-black italic">Session Complete!</h1>
              <div className="text-2xl opacity-80">
                You completed {completedTaskIds.length} out of {tasks.length} tasks.
              </div>
              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={onClose}
                  className="plm-button-pill h-16 px-12 text-xl bg-black text-white hover:bg-gray-800 border-transparent"
                >
                  Back to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}