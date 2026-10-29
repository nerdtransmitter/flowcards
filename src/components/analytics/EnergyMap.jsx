const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

import { format, startOfWeek, addDays, isWithinInterval } from "date-fns";

export default function EnergyMap({ user, isDark = false }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['energy-map-entries', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const allEntries = await db.entities.TimeEntry.filter({
        created_by: user.email
      }, '-started_at', 500);
      
      return allEntries.filter(entry => {
        const entryDate = new Date(entry.started_at);
        return isWithinInterval(entryDate, {
          start: addDays(weekStart, -28),
          end: new Date()
        });
      });
    },
    enabled: !!user,
  });

  // Create 24-hour x 7-day heatmap
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatForHour = (dayIdx, hour) => {
    const entriesAtTime = timeEntries.filter(entry => {
      const date = new Date(entry.started_at);
      const entryDay = (date.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      const entryHour = date.getHours();
      return entryDay === dayIdx && entryHour === hour;
    });

    if (entriesAtTime.length === 0) return 0;

    // Calculate average block strength
    const strengthScores = entriesAtTime.map(e => 
      e.block_strength === 'hard' ? 3 : e.block_strength === 'medium' ? 2 : 1
    );
    const avgStrength = strengthScores.reduce((a, b) => a + b, 0) / strengthScores.length;
    
    return avgStrength;
  };

  const getHeatColor = (heat) => {
    if (heat === 0) return isDark ? 'bg-slate-800' : 'bg-gray-100';
    if (heat < 1.5) return isDark ? 'bg-blue-900/50' : 'bg-blue-200';
    if (heat < 2.5) return isDark ? 'bg-amber-900/50' : 'bg-amber-300';
    return isDark ? 'bg-red-900/50' : 'bg-red-400';
  };

  return (
    <Card className={`border-2 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'
    }`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          🔥 Energy Map
        </CardTitle>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Your focus patterns over the last 4 weeks
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `40px repeat(24, 20px)` }}>
            {/* Header row */}
            <div />
            {hours.map(hour => (
              <div
                key={hour}
                className={`text-[10px] text-center ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}
              >
                {hour % 3 === 0 ? hour : ''}
              </div>
            ))}

            {/* Data rows */}
            {days.map((day, dayIdx) => (
              <React.Fragment key={day}>
                <div className={`text-xs flex items-center ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {day}
                </div>
                {hours.map(hour => {
                  const heat = getHeatForHour(dayIdx, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`w-5 h-5 rounded ${getHeatColor(heat)} transition-all hover:scale-110 cursor-pointer`}
                      title={`${day} ${hour}:00 - ${heat > 0 ? `${heat.toFixed(1)} intensity` : 'No activity'}`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs">
          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Less</span>
          <div className="flex gap-1">
            <div className={`w-4 h-4 rounded ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`} />
            <div className={`w-4 h-4 rounded ${isDark ? 'bg-blue-900/50' : 'bg-blue-200'}`} />
            <div className={`w-4 h-4 rounded ${isDark ? 'bg-amber-900/50' : 'bg-amber-300'}`} />
            <div className={`w-4 h-4 rounded ${isDark ? 'bg-red-900/50' : 'bg-red-400'}`} />
          </div>
          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>More</span>
        </div>
      </CardContent>
    </Card>
  );
}