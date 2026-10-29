import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CompletionCelebration({ show, taskTitle, isDark = false }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className={`border-2 shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-green-700' 
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
          }`}>
            <CardContent className="p-6 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <PartyPopper className={`w-8 h-8 ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`} />
              </motion.div>
              <div>
                <p className={`font-bold text-lg ${
                  isDark ? 'text-green-300' : 'text-green-900'
                }`}>
                  Amazing! Task Complete! 🎉
                </p>
                <p className={`text-sm ${
                  isDark ? 'text-green-400' : 'text-green-700'
                }`}>
                  {taskTitle}
                </p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Sparkles className={`w-6 h-6 ${
                  isDark ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}