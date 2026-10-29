const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { startOfWeek, addDays, format, isSameDay } from "date-fns";

export default function EnergyMap() {
  const [user, setUser] = useState(null);
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: completedTasks = [] } = useQuery({
    queryKey: ['completed-tasks-30days', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const tasks = await db.entities.Task.filter({
        status: 'done',
        created_by: user.email
      }, '-completed_at', 500);
      
      return tasks.filter(t => 
        t.completed_at && new Date(t.completed_at) >= thirtyDaysAgo
      );
    },
    enabled: !!user,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries-30days', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const entries = await db.entities.TimeEntry.filter({
        created_by: user.email
      }, '-started_at', 500);
      
      return entries.filter(e => 
        e.started_at && new Date(e.started_at) >= thirtyDaysAgo
      );
    },
    enabled: !!user,
  });

  // Build energy heatmap by hour and day
  const buildHeatmap = () => {
    const heatmap = {};
    
    // Initialize with zeros
    for (let day = 0; day < 7; day++) {
      heatmap[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        heatmap[day][hour] = { count: 0, duration: 0, energy: [] };
      }
    }

    // Add completed tasks
    completedTasks.forEach(task => {
      const date = new Date(task.completed_at);
      const day = date.getDay();
      const hour = date.getHours();
      
      heatmap[day][hour].count++;
      if (task.energy) {
        heatmap[day][hour].energy.push(task.energy);
      }
    });

    // Add time entries
    timeEntries.forEach(entry => {
      const date = new Date(entry.started_at);
      const day = date.getDay();
      const hour = date.getHours();
      
      heatmap[day][hour].duration += entry.duration_minutes || 0;
      if (entry.energy_level) {
        heatmap[day][hour].energy.push(entry.energy_level);
      }
    });

    return heatmap;
  };

  const heatmap = buildHeatmap();

  const getIntensityColor = (count, duration) => {
    const score = count * 10 + duration / 10;
    if (score === 0) return isDark ? 'bg-slate-800' : 'bg-gray-100';
    if (score < 20) return 'bg-green-200';
    if (score < 40) return 'bg-green-300';
    if (score < 60) return 'bg-green-400';
    if (score < 80) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getAverageEnergy = (energyLevels) => {
    if (energyLevels.length === 0) return null;
    const energyMap = { low: 1, medium: 2, high: 3 };
    const sum = energyLevels.reduce((acc, e) => acc + (energyMap[e] || 2), 0);
    const avg = sum / energyLevels.length;
    if (avg < 1.5) return 'low';
    if (avg < 2.5) return 'medium';
    return 'high';
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate best/worst productivity hours
  const getProductivityInsights = () => {
    const hourScores = {};
    
    hours.forEach(hour => {
      let totalCount = 0;
      let totalDuration = 0;
      
      days.forEach((_, day) => {
        totalCount += heatmap[day][hour].count;
        totalDuration += heatmap[day][hour].duration;
      });
      
      hourScores[hour] = totalCount * 10 + totalDuration / 10;
    });

    const sortedHours = Object.entries(hourScores)
      .sort((a, b) => b[1] - a[1]);

    const bestHours = sortedHours.slice(0, 3).map(([hour]) => parseInt(hour));
    const worstHours = sortedHours.slice(-3).map(([hour]) => parseInt(hour));

    return { bestHours, worstHours };
  };

  const { bestHours, worstHours } = getProductivityInsights();

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className={`w-8 h-8 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
            <h1 className={`text-4xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Energy Map
            </h1>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Discover your productivity patterns (last 30 days)
          </p>
        </motion.div>

        {/* Insights cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="w-5 h-5" />
                Peak Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bestHours.map(hour => (
                  <div key={hour} className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                  </div>
                ))}
              </div>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Your most productive times
              </p>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Minus className="w-5 h-5" />
                Low Energy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {worstHours.map(hour => (
                  <div key={hour} className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                  </div>
                ))}
              </div>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Save easy tasks for these times
              </p>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Activity className="w-5 h-5" />
                Total Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completedTasks.length}
              </div>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Tasks completed in 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Hour labels */}
                <div className="flex">
                  <div className="w-16"></div>
                  {hours.filter(h => h % 3 === 0).map(hour => (
                    <div
                      key={hour}
                      className={`flex-1 text-center text-xs ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}
                      style={{ minWidth: '40px' }}
                    >
                      {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {days.map((day, dayIdx) => (
                  <div key={day} className="flex items-center">
                    <div className={`w-16 text-sm font-medium ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    <div className="flex flex-1 gap-1">
                      {hours.map(hour => {
                        const cell = heatmap[dayIdx][hour];
                        const avgEnergy = getAverageEnergy(cell.energy);
                        
                        return (
                          <div
                            key={hour}
                            className={`aspect-square rounded transition-all hover:scale-110 hover:ring-2 ring-blue-500 cursor-pointer ${
                              getIntensityColor(cell.count, cell.duration)
                            }`}
                            style={{ minWidth: '12px', minHeight: '12px' }}
                            title={`${day} ${hour}:00\n${cell.count} tasks\n${Math.round(cell.duration)}min\nEnergy: ${avgEnergy || 'N/A'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                    Less
                  </span>
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <div className="w-4 h-4 bg-green-300 rounded"></div>
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                    More
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}