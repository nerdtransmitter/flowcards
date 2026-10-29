const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, startOfWeek, isSameDay, startOfDay, addWeeks, subWeeks, setHours, isWithinInterval, eachDayOfInterval } from "date-fns";
import TimeBlockCard from "../components/timeblocks/TimeBlockCard";
import CreateTimeBlockDialog from "../components/timeblocks/CreateTimeBlockDialog";
import GoogleCalendarIntegration from "../components/timeblocks/GoogleCalendarIntegration";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TimeBlocks() {
  const [user, setUser] = useState(null);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState('week');
  const [hourScale, setHourScale] = useState(60); // pixels per hour
  const [createDialogData, setCreateDialogData] = useState(null);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);
  const queryClient = useQueryClient();
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
      setViewMode(userData.default_calendar_view || 'week');
    };
    loadUser();
  }, []);

  // Auto-scroll to current hour
  useEffect(() => {
    const currentHour = new Date().getHours();
    const scrollTarget = document.getElementById(`hour-${currentHour}`);
    if (scrollTarget) {
      setTimeout(() => {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [viewMode]);

  const daysToShow = viewMode === 'day' ? 1 : viewMode === '3day' ? 3 : viewMode === 'week' ? 7 : 30;
  const viewDays = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i));

  const { data: allBlocks = [], isLoading } = useQuery({
    queryKey: ['time-blocks', user?.email, format(weekStart, 'yyyy-MM-dd'), viewMode],
    queryFn: async () => {
      if (!user) return [];
      
      const daysToFetch = viewMode === 'day' ? 1 : viewMode === '3day' ? 3 : viewMode === 'week' ? 7 : 30;
      const endDate = addDays(weekStart, daysToFetch);
      
      const allBlocks = await db.entities.TimeBlock.filter({
        created_by: user.email
      }, '-start_time');
      
      return allBlocks.filter(block => {
        const blockDate = new Date(block.start_time);
        return blockDate >= weekStart && blockDate < endDate;
      });
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['active-tasks', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.Task.filter({
        status: 'active',
        created_by: user.email
      }, '-created_date');
    },
    enabled: !!user,
  });

  // Expand recurring blocks
  const blocks = useMemo(() => {
    const expanded = [];
    const viewEnd = viewDays[viewDays.length - 1];

    allBlocks.forEach(block => {
      if (!block.recurrence_rule || block.recurrence_rule.frequency === 'none') {
        expanded.push(block);
        return;
      }

      const rule = block.recurrence_rule;
      const blockStart = new Date(block.start_time);
      let currentDate = new Date(blockStart);
      const maxDate = rule.end_date ? new Date(rule.end_date) : addDays(viewEnd, 180);

      let count = 0;
      const maxOccurrences = rule.occurrences || 365;

      while (currentDate <= maxDate && count < maxOccurrences) {
        if (currentDate >= weekStart && currentDate <= addDays(viewEnd, 1)) {
          if (rule.frequency === 'weekly' && rule.days_of_week?.length > 0) {
            if (rule.days_of_week.includes(currentDate.getDay())) {
              expanded.push({
                ...block,
                id: `${block.id}_${currentDate.toISOString()}`,
                start_time: currentDate.toISOString(),
                recurrence_parent_id: block.id
              });
              count++;
            }
          } else {
            expanded.push({
              ...block,
              id: `${block.id}_${currentDate.toISOString()}`,
              start_time: currentDate.toISOString(),
              recurrence_parent_id: block.id
            });
            count++;
          }
        }

        if (rule.frequency === 'daily') {
          currentDate = addDays(currentDate, rule.interval || 1);
        } else if (rule.frequency === 'weekly') {
          if (rule.days_of_week && rule.days_of_week.length > 0) {
            currentDate = addDays(currentDate, 1);
          } else {
            // Weekly without specific days -> repeat same day every N weeks
            currentDate = addWeeks(currentDate, rule.interval || 1);
          }
        } else if (rule.frequency === 'monthly') {
          currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + (rule.interval || 1)));
        }
      }
    });

    return expanded;
  }, [allBlocks, viewDays, weekStart]);

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => db.entities.TimeBlock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.TimeBlock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (blockData) => db.entities.TimeBlock.create(blockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });

  const getBlocksForDayAndHour = (day, hour) => {
    return blocks.filter(block => {
      const blockStart = new Date(block.start_time);
      if (block.end_time && block.is_all_day) {
        const blockEnd = new Date(block.end_time);
        return isSameDay(blockStart, day) || isSameDay(blockEnd, day) ||
               (blockStart < day && blockEnd > day);
      }
      return isSameDay(blockStart, day) && blockStart.getHours() === hour;
    });
  };

  const getGoogleEventsForDayAndHour = (day, hour) => {
    return googleCalendarEvents.filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, day) && eventStart.getHours() === hour;
    });
  };

  const handleSlotClick = (day, hour) => {
    const startTime = setHours(day, hour);
    setCreateDialogData({
      start_time: startTime.toISOString(),
      duration_minutes: 60
    });
    setShowCreateDialog(true);
  };

  const handleZoomIn = () => {
    setHourScale(prev => Math.min(prev + 20, 120));
  };

  const handleZoomOut = () => {
    setHourScale(prev => Math.max(prev - 20, 40));
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * hourScale;
  };

  const currentTimeTop = getCurrentTimePosition();
  const currentHour = new Date().getHours();

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className={`w-10 h-10 ${
                isDark ? 'text-pink-400' : 'text-pink-500'
              }`} />
              <h1 className={`text-6xl font-serif-display font-black tracking-tight italic ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Time Blocks
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="rounded-none hover:bg-gray-100"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="rounded-none hover:bg-gray-100"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-32 border-none shadow-none focus:ring-0 rounded-none h-8 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="3day">3 Days</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                  className="rounded-none hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  className="rounded-none hover:bg-gray-100 font-bold"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  className="rounded-none hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => {
                  setCreateDialogData(null);
                  setShowCreateDialog(true);
                }}
                className="plm-button bg-pink-500 text-white hover:bg-pink-600 border-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Block
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-lg ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              Plan your day with time blocking
            </p>
            
            <GoogleCalendarIntegration
              user={user}
              isDark={isDark}
              onEventsChange={setGoogleCalendarEvents}
            />
          </div>
        </motion.div>

          <div className="relative">
            <div className={`grid gap-2 ml-16 ${
              viewMode === 'day' ? 'grid-cols-1' : 
              viewMode === '3day' ? 'grid-cols-3' : 
              viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
            }`}>
              {/* Header row */}
              {viewDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`sticky top-0 z-10 p-3 text-center font-bold border-b-2 border-black ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white text-black'
                  } ${isSameDay(day, new Date()) ? 'bg-pink-100' : ''}`}
                >
                  <div className="text-sm uppercase tracking-wider">{format(day, 'EEE')}</div>
                  <div className="text-3xl font-black">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="relative overflow-auto max-h-[70vh]">
              {/* Hour labels - sticky left gutter */}
              <div className={`sticky left-0 z-30 w-16 float-left ${
                isDark ? 'bg-slate-900' : 'bg-gray-50'
              }`}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    className={`text-xs font-medium text-right pr-2 border-b ${
                      isDark ? 'text-slate-400 border-slate-700' : 'text-gray-500 border-gray-200'
                    }`}
                    style={{ height: `${hourScale}px`, lineHeight: `${hourScale}px` }}
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              <div className="ml-16">
                {Array.from({ length: 24 }, (_, hour) => (
                  <div
                    key={hour}
                    id={`hour-${hour}`}
                    className="relative"
                    style={{ height: `${hourScale}px` }}
                  >
                    {/* Current time indicator */}
                    {hour === currentHour && (
                      <div
                        className="absolute left-0 right-0 z-20 border-t-2 border-red-500"
                        style={{ top: `${currentTimeTop - hour * hourScale}px` }}
                      >
                        <div className="absolute -left-16 -top-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(new Date(), 'HH:mm')}
                        </div>
                      </div>
                    )}

                  <div className={`grid gap-2 ${
                    viewMode === 'day' ? 'grid-cols-1' : 
                    viewMode === '3day' ? 'grid-cols-3' : 
                    viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
                  }`}>

                    {/* Time slots for each day */}
                    {viewDays.map((day, dayIdx) => {
                      const dayBlocks = getBlocksForDayAndHour(day, hour);
                      const droppableId = `day-${format(day, 'yyyy-MM-dd')}-hour-${hour}`;

                      return (
                        <div
                          key={droppableId}
                          onClick={() => handleSlotClick(day, hour)}
                          className={`border cursor-pointer transition-colors relative ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ minHeight: `${hourScale}px` }}
                        >
                          {dayBlocks.map((block) => {
                            const blockHeight = (block.duration_minutes / 60) * hourScale;
                            const isRecurring = block.recurrence_parent_id;
                            return (
                              <div
                                key={block.id}
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute left-1 right-1 rounded overflow-hidden z-10 ${isRecurring ? 'opacity-90' : ''}`}
                                style={{ height: `${blockHeight}px`, top: 0 }}
                              >
                                <TimeBlockCard
                                  block={block}
                                  onDelete={() => deleteBlockMutation.mutate(block.recurrence_parent_id || block.id)}
                                  isDark={isDark}
                                  compact={hourScale < 80}
                                  height={blockHeight}
                                />
                                {isRecurring && (
                                  <div className="absolute top-1 right-1 text-xs">🔁</div>
                                )}
                              </div>
                            );
                          })}

                          {/* Google Calendar events overlay */}
                          {getGoogleEventsForDayAndHour(day, hour).map((event, idx) => (
                            <div
                              key={`gcal-${idx}`}
                              className="absolute left-1 right-1 rounded overflow-hidden opacity-60 border-2 border-blue-400"
                              style={{
                                height: `${(event.duration_minutes / 60) * hourScale}px`,
                                top: 0,
                                backgroundColor: isDark ? '#1e3a8a' : '#bfdbfe'
                              }}
                            >
                              <div className="p-2 text-xs">
                                <div className="font-medium text-blue-900">📅 {event.title}</div>
                                <div className="text-blue-700">Google Calendar</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>

        <CreateTimeBlockDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setCreateDialogData(null);
          }}
          tasks={tasks}
          isDark={isDark}
          initialData={createDialogData}
        />
      </div>
    </div>
  );
}