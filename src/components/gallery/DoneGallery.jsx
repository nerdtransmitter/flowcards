import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export default function DoneGallery({ tasks = [], isDark = false, onExport, onShare }) {
  return (
    <Card className={`border-2 ${
      isDark 
        ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700' 
        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className={`w-6 h-6 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={isDark ? 'text-white' : 'text-gray-900'}>
              This Week's Wins
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tasks.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl text-center ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`}
            >
              <div className="text-4xl mb-2">
                {task.emoji || '✅'}
              </div>
              <p className={`text-sm font-medium line-clamp-2 ${
                isDark ? 'text-slate-300' : 'text-gray-700'
              }`}>
                {task.title}
              </p>
            </motion.div>
          ))}
        </div>
        {tasks.length === 0 && (
          <p className={`text-center py-8 ${
            isDark ? 'text-slate-400' : 'text-gray-500'
          }`}>
            Complete some tasks to see them here! 🌟
          </p>
        )}
      </CardContent>
    </Card>
  );
}