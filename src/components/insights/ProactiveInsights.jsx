import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, AlertTriangle, Clock, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProactiveInsights({ tasks, onAction, isDark }) {
  // Logic to generate insights
  const insights = React.useMemo(() => {
    const list = [];
    
    // Check for Overload
    const activeTasks = tasks.filter(t => t.status === 'active');
    if (activeTasks.length > 15) {
      list.push({
        id: 'overload',
        type: 'warning',
        title: 'Cognitive Overload Detected',
        description: `You have ${activeTasks.length} active tasks. This causes decision fatigue.`,
        actionLabel: 'Move Low Priority to Shelf',
        actionType: 'shelf_low_priority',
        icon: AlertTriangle,
        color: 'amber'
      });
    }

    // Check for Stagnant Tasks (surfaced many times)
    const stagnantTasks = tasks.filter(t => (t.surfaced_count || 0) > 5);
    if (stagnantTasks.length > 0) {
      list.push({
        id: 'stagnant',
        type: 'info',
        title: `${stagnantTasks.length} tasks are stuck`,
        description: 'These tasks keep appearing but aren\'t getting done.',
        actionLabel: 'Review & Reschedule',
        actionType: 'review_stagnant',
        icon: Clock,
        color: 'blue'
      });
    }

    // Check for "Snooze Loop" (not implementing track yet, but placeholder logic)
    // If we tracked snooze count, we'd use it here.
    
    return list;
  }, [tasks]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className={`plm-card-dashed border-2 ${
              isDark 
                ? `bg-slate-800 border-${insight.color}-500/50` 
                : `bg-${insight.color}-50 border-${insight.color}-200`
            }`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`p-2 rounded-full border-2 border-black bg-white text-${insight.color}-600`}>
                  <insight.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {insight.title}
                  </h4>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {insight.description}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onAction(insight)}
                    className={`plm-button-pill text-xs h-8 bg-white text-black hover:bg-gray-100 border-black`}
                  >
                    {insight.actionLabel}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}