const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TimeTracking() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('7days');
  const [selectedProject, setSelectedProject] = useState('all');
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries', user?.email, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const allEntries = await db.entities.TimeEntry.filter({
        created_by: user.email
      }, '-started_at');
      
      const daysAgo = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 365;
      const cutoff = subDays(new Date(), daysAgo);
      
      return allEntries.filter(e => new Date(e.started_at) >= cutoff);
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-for-tracking'],
    queryFn: async () => {
      if (!user) return [];
      return db.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-tracking'],
    queryFn: async () => {
      if (!user) return [];
      return db.entities.Project.filter({ created_by: user.email });
    },
    enabled: !!user,
  });

  // Filter entries by project
  const filteredEntries = entries.filter(entry => {
    if (selectedProject === 'all') return true;
    const task = tasks.find(t => t.id === entry.task_id);
    return task?.project_id === selectedProject;
  });

  // Calculate totals
  const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessions = filteredEntries.length;

  // Group by date
  const entriesByDate = filteredEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.started_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const handleExport = () => {
    const csv = [
      ['Date', 'Task', 'Project', 'Duration (min)', 'Type', 'Note'],
      ...filteredEntries.map(e => {
        const task = tasks.find(t => t.id === e.task_id);
        const project = projects.find(p => p.id === task?.project_id);
        return [
          format(new Date(e.started_at), 'yyyy-MM-dd HH:mm'),
          task?.title || 'Unknown',
          project?.name || 'None',
          e.duration_minutes,
          e.entry_type,
          e.session_note || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Clock className={`w-10 h-10 ${
                isDark ? 'text-pink-400' : 'text-pink-500'
              }`} />
              <div>
                <h1 className={`text-6xl font-serif-display font-black tracking-tight italic ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  Time Tracking
                </h1>
                <p className={`text-lg ${
                  isDark ? 'text-slate-300' : 'text-gray-600'
                }`}>
                  Review your time entries and productivity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className={`w-32 ${
                  isDark ? 'bg-slate-800 border-slate-600' : ''
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className={`w-40 ${
                  isDark ? 'bg-slate-800 border-slate-600' : ''
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleExport}
                variant="outline"
                className={`plm-button-pill bg-white text-black hover:bg-gray-100 ${isDark ? 'border-slate-600' : 'border-black'}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`plm-card ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <CardHeader className="pb-3 border-b-2 border-black">
                <CardTitle className={`text-sm uppercase tracking-wider font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Total Time
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                  {totalHours}h
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {totalMinutes} minutes
                </p>
              </CardContent>
            </Card>

            <Card className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {totalSessions}
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Work sessions logged
                </p>
              </CardContent>
            </Card>

            <Card className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  Avg Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0}m
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Average duration
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Entries List */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Loading...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className={`text-center py-16 ${
            isDark ? 'bg-slate-800 border-slate-700' : ''
          }`}>
            <CardContent>
              <Clock className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-slate-600' : 'text-gray-300'
              }`} />
              <p className={`text-xl ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                No time entries yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(entriesByDate).reverse().map(([date, dateEntries]) => (
              <div key={date}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <Calendar className="w-5 h-5" />
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2">
                  {dateEntries.map((entry) => {
                    const task = tasks.find(t => t.id === entry.task_id);
                    const project = projects.find(p => p.id === task?.project_id);
                    
                    return (
                      <Card key={entry.id} className={
                        isDark ? 'bg-slate-800 border-slate-700' : ''
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`font-medium ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {task?.emoji} {task?.title || 'Unknown task'}
                                </p>
                                {project && (
                                  <Badge variant="outline" className="text-xs">
                                    {project.emoji} {project.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                  ⏰ {format(new Date(entry.started_at), 'HH:mm')}
                                  {entry.ended_at && ` - ${format(new Date(entry.ended_at), 'HH:mm')}`}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {entry.entry_type}
                                </Badge>
                              </div>
                              {entry.session_note && (
                                <p className={`text-sm mt-2 ${
                                  isDark ? 'text-slate-300' : 'text-gray-700'
                                }`}>
                                  📝 {entry.session_note}
                                </p>
                              )}
                            </div>
                            <div className={`text-right font-bold ${
                              isDark ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                              {entry.duration_minutes}m
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}