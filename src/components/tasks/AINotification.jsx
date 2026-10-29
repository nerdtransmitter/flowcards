import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Clock, Zap, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AINotification({ 
  type, 
  data, 
  taskTitle,
  onApply, 
  onDismiss, 
  onView,
  isDark = false 
}) {
  const getNotificationContent = () => {
    switch (type) {
      case 'time_block_suggestion':
        return {
          icon: <Clock className="w-5 h-5" />,
          title: 'AI Time Block Suggestion',
          description: `Best time: ${data.suggested_hour}:00 (${data.block_strength} focus)`,
          rationale: data.rationale,
          badge: `${data.duration_minutes} min`
        };
      case 'atomize_complete':
        return {
          icon: <Zap className="w-5 h-5" />,
          title: 'Task Atomized',
          description: `Created ${data.subtask_count} subtasks`,
          rationale: 'Broken down into actionable steps',
          badge: `${data.subtask_count} steps`
        };
      case 'auto_plan':
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          title: 'Auto-Plan Complete',
          description: `Scheduled ${data.scheduled_count} tasks`,
          rationale: data.summary,
          badge: `${data.scheduled_count} blocks`
        };
      default:
        return {
          icon: <Sparkles className="w-5 h-5" />,
          title: 'AI Action',
          description: 'Action completed',
          rationale: '',
          badge: ''
        };
    }
  };

  const content = getNotificationContent();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, x: 100 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-6 right-6 z-50 max-w-md"
      >
        <Card className={`border-2 shadow-2xl ${
          isDark 
            ? 'bg-slate-800 border-purple-700' 
            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                isDark ? 'bg-purple-900/50' : 'bg-purple-100'
              }`}>
                {content.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {content.title}
                    </h4>
                    {taskTitle && (
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        {taskTitle}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    className="h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className={`text-sm mb-2 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {content.description}
                </p>

                {content.rationale && (
                  <p className={`text-xs mb-3 flex items-start gap-1 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                    {content.rationale}
                  </p>
                )}

                {content.badge && (
                  <Badge variant="outline" className="mb-3">
                    {content.badge}
                  </Badge>
                )}

                <div className="flex gap-2">
                  {onView && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onView}
                      className="flex-1"
                    >
                      View
                    </Button>
                  )}
                  {onApply && (
                    <Button
                      size="sm"
                      onClick={onApply}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}