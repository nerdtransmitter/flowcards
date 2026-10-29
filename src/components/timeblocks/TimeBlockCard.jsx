import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";

const strengthColors = {
  light: {
    bg: "bg-pink-50",
    border: "border-black",
    text: "text-black",
    badge: "bg-white text-black border-black border-2"
  },
  medium: {
    bg: "bg-pink-100",
    border: "border-black",
    text: "text-black",
    badge: "bg-white text-black border-black border-2"
  },
  hard: {
    bg: "bg-pink-200",
    border: "border-black",
    text: "text-black",
    badge: "bg-white text-black border-black border-2"
  }
};

const strengthColorsDark = {
  light: {
    bg: "bg-blue-900/20",
    border: "border-blue-700",
    text: "text-blue-300",
    badge: "bg-blue-900/50 text-blue-200"
  },
  medium: {
    bg: "bg-amber-900/20",
    border: "border-amber-700",
    text: "text-amber-300",
    badge: "bg-amber-900/50 text-amber-200"
  },
  hard: {
    bg: "bg-red-900/20",
    border: "border-red-700",
    text: "text-red-300",
    badge: "bg-red-900/50 text-red-200"
  }
};

const blockTypeIcons = {
  focus: "🎯",
  admin: "📋",
  break: "☕",
  meeting: "👥",
  flex: "✨"
};

export default function TimeBlockCard({ block, tasks = [], onDelete, isDark = false, compact = false, height = null }) {
  const colors = isDark ? strengthColorsDark[block.strength] : strengthColors[block.strength];
  const startTime = new Date(block.start_time);
  const endTime = new Date(startTime.getTime() + block.duration_minutes * 60000);

  return (
    <Card 
      className={`plm-card ${colors.bg} ${colors.border} group h-full hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
      style={height ? { height: `${height}px`, minHeight: `${height}px` } : {}}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{blockTypeIcons[block.block_type]}</span>
              <h4 className={`font-semibold text-sm ${colors.text}`}>
                {block.title}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span className={colors.text}>
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <Badge variant="outline" className={`text-xs ${colors.badge}`}>
          {block.strength}
        </Badge>

        {tasks.length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1">
            {tasks.map((task) => (
              <div key={task.id} className={`text-xs ${colors.text}`}>
                • {task.title}
              </div>
            ))}
          </div>
        )}

        {block.notes && (
          <p className={`text-xs mt-2 ${colors.text}`}>
            {block.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}