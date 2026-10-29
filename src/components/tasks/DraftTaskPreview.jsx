import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, X, Check } from "lucide-react";

export default function DraftTaskPreview({ task, onEdit, onRemove, isDark = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const handleSave = () => {
    onEdit({ ...task, title: editedTitle });
    setIsEditing(false);
  };

  return (
    <Card className={`plm-card ${
      isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-white'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={`plm-input flex-1 ${isDark ? 'bg-slate-800 border-slate-600' : ''}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <Button
                  size="icon"
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <p className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {task.title}
                </p>
                {task.why && (
                  <p className={`text-xs mb-2 ${
                    isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    💭 {task.why}
                  </p>
                )}
                {task.next_step && (
                  <p className={`text-xs mb-2 ${
                    isDark ? 'text-slate-400' : 'text-blue-700'
                  }`}>
                    ⚡ {task.next_step}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`text-xs ${
                    isDark ? 'bg-slate-800 border-slate-600' : ''
                  }`}>
                    {task.effort}
                  </Badge>
                  {task.energy && (
                    <Badge variant="outline" className="text-xs">
                      {task.energy === "high" ? "🔥" : task.energy === "medium" ? "⚡" : "🌱"} {task.energy}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}