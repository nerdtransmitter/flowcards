import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CalendarPlus, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MicroSessionCard({ session, onStartSession, onScheduleSession, isDark }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total estimated time
  const totalMinutes = session.tasks.reduce((acc, t) => {
    // Estimate if not set: tiny=5, small=15, medium=30, large=60
    let est = 15;
    if (t.effort === 'tiny') est = 5;
    if (t.effort === 'medium') est = 30;
    if (t.effort === 'large') est = 60;
    if (t.estimated_minutes) est = t.estimated_minutes;
    return acc + est;
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-6"
    >
      <Card className={`plm-card-dashed border-2 ${isDark ? 'bg-slate-800 border-indigo-400' : 'bg-indigo-50 border-indigo-300'}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full border-2 border-black ${isDark ? 'bg-indigo-900 text-indigo-300' : 'bg-white text-indigo-600'}`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-tight text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
                  {session.title}
                  <Badge variant="secondary" className="ml-2 bg-indigo-200 text-indigo-800 hover:bg-indigo-200 border-none">
                    {session.tasks.length} tasks
                  </Badge>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`flex items-center gap-1 ${isDark ? 'border-indigo-700 text-indigo-300' : 'border-indigo-200 text-indigo-700'}`}>
                    <Clock className="w-3 h-3" />
                    ~{totalMinutes} min
                  </Badge>
                  <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    {session.rationale}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={isDark ? 'text-indigo-300 hover:bg-indigo-900/50' : 'text-indigo-700 hover:bg-indigo-100'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className={`rounded-xl p-3 space-y-2 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'}`}>
                  {session.tasks.map((task, idx) => (
                    <div key={task.id} className="flex items-center gap-3 text-sm p-2 rounded hover:bg-black/5">
                      <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-indigo-300 text-xs font-bold text-indigo-500">
                        {idx + 1}
                      </div>
                      <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>
                        {task.emoji} {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-2">
            <Button
              onClick={() => onStartSession(session)}
              className="plm-button-pill flex-1 bg-indigo-500 hover:bg-indigo-600 text-white border-none"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              Start Session
            </Button>
            <Button
              variant="outline"
              onClick={() => onScheduleSession(session)}
              className={`plm-button-pill flex-1 border-2 ${isDark ? 'border-indigo-400 text-indigo-300 hover:bg-indigo-900' : 'border-indigo-600 text-indigo-700 hover:bg-indigo-50'}`}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Schedule Block
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}