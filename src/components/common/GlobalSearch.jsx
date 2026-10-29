const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  FolderKanban,
  Calendar,
  MessageCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalSearch({ open, onClose, user, isDark = false }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // all, tasks, projects, timeblocks
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', query, user?.email, activeTab],
    queryFn: async () => {
      if (!query.trim() || !user) return { tasks: [], projects: [], conversations: [], timeBlocks: [] };
      
      setIsSearching(true);
      const searchLower = query.toLowerCase();
      
      // Search tasks
      const allTasks = await db.entities.Task.filter({
        created_by: user.email
      }, '-updated_date', 100);
      
      const tasks = allTasks.filter(task => 
        task.title?.toLowerCase().includes(searchLower) ||
        task.notes?.toLowerCase().includes(searchLower) ||
        task.why?.toLowerCase().includes(searchLower)
      ).slice(0, activeTab === 'tasks' ? 20 : 10);

      // Search projects
      const allProjects = await db.entities.Project.filter({
        created_by: user.email
      }, '-updated_date');
      
      const projects = allProjects.filter(project =>
        project.name?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.north_star?.toLowerCase().includes(searchLower)
      ).slice(0, activeTab === 'projects' ? 20 : 5);

      // Search time blocks
      const allBlocks = await db.entities.TimeBlock.filter({
        created_by: user.email
      }, '-start_time', 100);
      
      const timeBlocks = allBlocks.filter(block =>
        block.title?.toLowerCase().includes(searchLower) ||
        block.notes?.toLowerCase().includes(searchLower)
      ).slice(0, activeTab === 'timeblocks' ? 20 : 5);

      // Search conversations (if they exist)
      let conversations = [];
      try {
        const allConvs = await db.agents.listConversations({
          agent_name: 'flow_coach'
        });
        conversations = (allConvs || []).filter(conv =>
          conv.metadata?.name?.toLowerCase().includes(searchLower)
        ).slice(0, 5);
      } catch (err) {
        conversations = [];
      }

      setIsSearching(false);
      return { tasks, projects, conversations, timeBlocks };
    },
    enabled: !!user && query.trim().length > 0,
    staleTime: 1000,
  });

  const handleTaskClick = (task) => {
    navigate(createPageUrl("FocusNow"));
    onClose();
  };

  const handleProjectClick = (project) => {
    navigate(`${createPageUrl("ProjectDetail")}?id=${project.id}`);
    onClose();
  };

  const handleConversationClick = (conversation) => {
    navigate(createPageUrl("Chat"));
    onClose();
  };

  const handleTimeBlockClick = (block) => {
    navigate(createPageUrl("TimeBlocks"));
    onClose();
  };

  const results = searchResults || { tasks: [], projects: [], conversations: [], timeBlocks: [] };
  const hasResults = results.tasks.length > 0 || results.projects.length > 0 || results.conversations.length > 0 || results.timeBlocks.length > 0;

  // Flatten results for keyboard navigation
  const allResults = [
    ...results.tasks.map(t => ({ type: 'task', data: t })),
    ...results.projects.map(p => ({ type: 'project', data: p })),
    ...results.timeBlocks.map(b => ({ type: 'timeblock', data: b })),
    ...results.conversations.map(c => ({ type: 'conversation', data: c }))
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        const item = allResults[selectedIndex];
        if (item.type === 'task') handleTaskClick(item.data);
        else if (item.type === 'project') handleProjectClick(item.data);
        else if (item.type === 'timeblock') handleTimeBlockClick(item.data);
        else if (item.type === 'conversation') handleConversationClick(item.data);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, allResults]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`plm-card max-w-2xl max-h-[80vh] overflow-hidden ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
      }`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            <div className="flex items-center gap-2 font-serif-display font-black italic tracking-tight text-2xl">
              <Search className="w-6 h-6" />
              Search Everything
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-5 h-5 ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`} />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search everything... (↑↓ to navigate, Enter to open)"
              className={`pl-10 plm-input ${
                isDark ? 'bg-slate-900 border-slate-600 text-white' : ''
              }`}
              autoFocus
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {['all', 'tasks', 'projects', 'timeblocks'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIndex(0);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border-2 transition-all ${
                  activeTab === tab
                    ? isDark
                      ? 'bg-pink-500 text-white border-black'
                      : 'bg-pink-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className={`max-h-96 overflow-y-auto ${
            isDark ? 'text-slate-300' : 'text-gray-700'
          }`}>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}

            {!isLoading && query.trim() && !hasResults && (
              <div className="text-center py-8">
                <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                  No results found for "{query}"
                </p>
              </div>
            )}

            {!query.trim() && (
              <div className="text-center py-8">
                <Search className={`w-12 h-12 mx-auto mb-2 ${
                  isDark ? 'text-slate-600' : 'text-gray-300'
                }`} />
                <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                  Start typing to search...
                </p>
                <p className={`text-xs mt-2 ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Tip: Use ⌘K (Mac) or Ctrl+K (Windows) to open search anytime
                </p>
              </div>
            )}

            <AnimatePresence>
              {results.tasks.length > 0 && (activeTab === 'all' || activeTab === 'tasks') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Tasks ({results.tasks.length})
                  </h3>
                  <div className="space-y-2">
                    {results.tasks.map((task, idx) => {
                      const globalIdx = allResults.findIndex(r => r.type === 'task' && r.data.id === task.id);
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedIndex === globalIdx
                              ? isDark
                                ? 'bg-slate-600 ring-2 ring-blue-500'
                                : 'bg-blue-50 ring-2 ring-blue-400'
                              : isDark 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                        <div className="flex items-start gap-3">
                          {task.status === 'done' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              task.status === 'done' ? 'line-through' : ''
                            }`}>
                              {task.emoji && <span className="mr-2">{task.emoji}</span>}
                              {task.title}
                            </p>
                            {task.why && (
                              <p className={`text-xs mt-1 truncate ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                {task.why}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {task.effort && (
                                <Badge variant="outline" className="text-xs">
                                  {task.effort}
                                </Badge>
                              )}
                              {task.status && (
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {results.projects.length > 0 && (activeTab === 'all' || activeTab === 'projects') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Projects ({results.projects.length})
                  </h3>
                  <div className="space-y-2">
                    {results.projects.map((project) => {
                      const globalIdx = allResults.findIndex(r => r.type === 'project' && r.data.id === project.id);
                      return (
                        <button
                          key={project.id}
                          onClick={() => handleProjectClick(project)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedIndex === globalIdx
                              ? isDark
                                ? 'bg-slate-600 ring-2 ring-blue-500'
                                : 'bg-blue-50 ring-2 ring-blue-400'
                              : isDark 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                        <div className="flex items-start gap-3">
                          <FolderKanban className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {project.emoji && <span className="mr-2">{project.emoji}</span>}
                              {project.name}
                            </p>
                            {project.north_star && (
                              <p className={`text-xs mt-1 truncate ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                🌟 {project.north_star}
                              </p>
                            )}
                            {project.area && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {project.area}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {results.timeBlocks.length > 0 && (activeTab === 'all' || activeTab === 'timeblocks') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Time Blocks ({results.timeBlocks.length})
                  </h3>
                  <div className="space-y-2">
                    {results.timeBlocks.map((block) => {
                      const globalIdx = allResults.findIndex(r => r.type === 'timeblock' && r.data.id === block.id);
                      return (
                        <button
                          key={block.id}
                          onClick={() => handleTimeBlockClick(block)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedIndex === globalIdx
                              ? isDark
                                ? 'bg-slate-600 ring-2 ring-blue-500'
                                : 'bg-blue-50 ring-2 ring-blue-400'
                              : isDark 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {block.title}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                {format(new Date(block.start_time), 'MMM d, HH:mm')} • {block.duration_minutes}min
                              </p>
                              <Badge variant="outline" className="text-xs mt-2">
                                {block.strength}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {results.conversations.length > 0 && activeTab === 'all' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className={`text-sm font-semibold mb-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Conversations ({results.conversations.length})
                  </h3>
                  <div className="space-y-2">
                    {results.conversations.map((conv) => {
                      const globalIdx = allResults.findIndex(r => r.type === 'conversation' && r.data.id === conv.id);
                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleConversationClick(conv)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedIndex === globalIdx
                              ? isDark
                                ? 'bg-slate-600 ring-2 ring-blue-500'
                                : 'bg-blue-50 ring-2 ring-blue-400'
                              : isDark 
                                ? 'hover:bg-slate-700' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                        <div className="flex items-start gap-3">
                          <MessageCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {conv.metadata?.name || 'Conversation'}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isDark ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              {conv.messages?.length || 0} messages
                            </p>
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}