const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, Circle, RotateCcw, MessageCircle, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";
import TaskDetailDrawer from "../components/tasks/TaskDetailDrawer";

export default function Logbook() {
  const [user, setUser] = useState(null);
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

  const { data: allTasks = [] } = useQuery({
    queryKey: ['logbook-tasks', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.Task.filter({ 
        created_by: user.email 
      }, '-updated_date', 500);
    },
    enabled: !!user,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['logbook-chats', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        const conversations = await db.agents.listConversations({
          agent_name: 'flow_coach'
        });
        
        // Flatten all messages from all conversations
        const allMessages = conversations.flatMap(conv => 
          (conv.messages || []).map(msg => ({
            ...msg,
            conversationId: conv.id,
            date: msg.created_at || conv.created_date
          }))
        );
        
        return allMessages.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
      } catch (error) {
        console.error("Error loading chat messages:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const uncompleteMutation = useMutation({
    mutationFn: async (task) => {
      await db.entities.Task.update(task.id, {
        status: 'active',
        completed_at: null,
        uncompleted_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Task restored to active!');
    },
  });

  // Combine tasks and chat messages into a unified timeline
  const timelineItems = [
    ...allTasks.map(task => ({
      type: 'task',
      date: task.updated_date || task.created_date,
      data: task
    })),
    ...chatMessages.map(msg => ({
      type: 'chat',
      date: msg.date,
      data: msg
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const groupedByDate = timelineItems.reduce((acc, item) => {
    const date = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const showRestoredBadge = (task) => {
    if (!task.uncompleted_at) return false;
    const hoursSinceRestore = differenceInHours(new Date(), new Date(task.uncompleted_at));
    return hoursSinceRestore < 24;
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className={`w-10 h-10 ${
              isDark ? 'text-pink-400' : 'text-pink-500'
            }`} />
            <h1 className={`text-6xl font-serif-display font-black tracking-tight italic ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              Logbook
            </h1>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Your journey and progress over time (tasks + conversations)
          </p>
        </motion.div>

        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h3 className={`text-xl font-black uppercase tracking-tight mb-3 sticky top-0 z-10 py-2 border-b-2 border-black ${
                isDark ? 'text-slate-200 bg-slate-900' : 'text-black bg-white'
              }`}>
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {groupedByDate[date].map((item, idx) => (
                    <motion.div
                      key={`${item.type}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {item.type === 'task' ? (
                        <Card className={`plm-card group hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700' 
                            : 'bg-white'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {item.data.status === 'done' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className={`font-medium ${
                                      item.data.status === 'done' ? 'line-through' : ''
                                    } ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                                      {item.data.emoji && <span className="mr-2">{item.data.emoji}</span>}
                                      {item.data.title}
                                    </p>
                                    {item.data.why && (
                                      <p className={`text-sm mt-1 ${
                                        isDark ? 'text-slate-400' : 'text-gray-600'
                                      }`}>
                                        💭 {item.data.why}
                                      </p>
                                    )}
                                    {showRestoredBadge(item.data) && (
                                      <span className={`inline-block text-xs mt-2 px-2 py-1 rounded-full ${
                                        isDark 
                                          ? 'bg-blue-900/50 text-blue-300' 
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        Restored from Logbook ✨
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs ${
                                      isDark ? 'text-slate-500' : 'text-gray-400'
                                    }`}>
                                      {format(new Date(item.data.updated_date || item.data.created_date), 'HH:mm')}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedTask(item.data)}
                                      className="h-8 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      Edit
                                    </Button>
                                    {item.data.status === 'done' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => uncompleteMutation.mutate(item.data)}
                                        className="h-8 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        Uncomplete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className={`border ${
                          isDark 
                            ? 'bg-slate-800/50 border-slate-700' 
                            : 'bg-cyan-50/50 border-cyan-100'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <MessageCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                                isDark ? 'text-cyan-400' : 'text-cyan-600'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <p className={`text-xs font-medium mb-1 ${
                                      isDark ? 'text-cyan-400' : 'text-cyan-700'
                                    }`}>
                                      {item.data.role === 'user' ? 'You' : 'Flow Coach'}
                                    </p>
                                    <p className={`text-sm line-clamp-2 ${
                                      isDark ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                      {item.data.content}
                                    </p>
                                  </div>
                                  <span className={`text-xs ${
                                    isDark ? 'text-slate-500' : 'text-gray-400'
                                  }`}>
                                    {format(new Date(item.date), 'HH:mm')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isDark={isDark}
      />
    </div>
  );
}