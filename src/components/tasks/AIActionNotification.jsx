import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Eye, Undo2, X } from "lucide-react";

export default function AIActionNotification({ 
  show, 
  action, 
  summary, 
  onView, 
  onUndo, 
  onDismiss, 
  isDark = false 
}) {
  if (!show) return null;

  const getActionIcon = () => {
    if (action === 'atomize') return '🧠';
    if (action === 'schedule') return '📅';
    return '✨';
  };

  const getActionTitle = () => {
    if (action === 'atomize') return 'Tasks Created';
    if (action === 'schedule') return 'Time Block Added';
    return 'Action Complete';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <Card className={`border-2 shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-purple-700' 
              : 'bg-white border-purple-200'
          }`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <span className="text-2xl">{getActionIcon()}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className={`w-4 h-4 ${
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                    <h4 className={`font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {getActionTitle()}
                    </h4>
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {summary}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-3">
                    {onView && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onView}
                        className={`text-xs ${
                          isDark 
                            ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' 
                            : ''
                        }`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    )}
                    {onUndo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onUndo}
                        className={`text-xs ${
                          isDark 
                            ? 'bg-slate-700 hover:bg-slate-600 border-slate-600' 
                            : ''
                        }`}
                      >
                        <Undo2 className="w-3 h-3 mr-1" />
                        Undo
                      </Button>
                    )}
                  </div>
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onDismiss}
                  className="h-6 w-6 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}