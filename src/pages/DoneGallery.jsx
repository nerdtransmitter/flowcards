const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Download, Share2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";

export default function DoneGallery() {
  const [user, setUser] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = this week, 1 = last week, etc.
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const weekStart = startOfWeek(subWeeks(new Date(), selectedWeek), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { data: completedTasks = [] } = useQuery({
    queryKey: ['done-gallery', user?.email, selectedWeek],
    queryFn: async () => {
      if (!user) return [];
      
      const allCompleted = await db.entities.Task.filter({
        status: 'done',
        created_by: user.email
      }, '-completed_at', 200);
      
      return allCompleted.filter(task => {
        if (!task.completed_at) return false;
        const completedDate = new Date(task.completed_at);
        return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
      });
    },
    enabled: !!user,
  });

  const handleExport = () => {
    // Create a simple image/screenshot representation
    const content = completedTasks.map(t => `${t.emoji || '✅'} ${t.title}`).join('\n');
    const blob = new Blob([`My wins for ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}:\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wins-${format(weekStart, 'yyyy-MM-dd')}.txt`;
    a.click();
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className={`w-8 h-8 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
              <h1 className={`text-5xl font-serif-display font-black tracking-tight italic ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Done Gallery
              </h1>
            </div>
            <p className={`text-lg ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              Celebrate your accomplishments! 🎉
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className={`plm-button-pill bg-white text-black hover:bg-gray-100 ${isDark ? 'border-slate-600' : 'border-black'}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        <Card className={`border-2 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-100'
        }`}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className={`flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Calendar className="w-5 h-5" />
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(selectedWeek + 1)}
                  className={isDark ? 'border-slate-600' : ''}
                >
                  ← Previous Week
                </Button>
                {selectedWeek > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeek(selectedWeek - 1)}
                    className={isDark ? 'border-slate-600' : ''}
                  >
                    Next Week →
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <div className={`text-5xl font-bold mb-2 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                {completedTasks.length}
              </div>
              <div className={`text-lg ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Tasks Completed
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {completedTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`border ${
                      isDark 
                        ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-md'
                    } transition-all cursor-pointer`}>
                      <CardContent className="p-4 text-center">
                        <div className="text-4xl mb-2">
                          {task.emoji || '✅'}
                        </div>
                        <p className={`text-sm font-medium line-clamp-2 ${
                          isDark ? 'text-slate-200' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                        {task.effort === 'tiny' && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              ⚡ Tiny Win
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {completedTasks.length === 0 && (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 mx-auto mb-4 opacity-30 ${
                  isDark ? 'text-slate-600' : 'text-gray-300'
                }`} />
                <p className={`text-lg ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  No completed tasks this week yet.
                </p>
                <p className={`text-sm ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Keep going! Every small step counts. ✨
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}