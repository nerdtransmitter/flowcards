import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function WeeklyDigest({ data, isDark = false, onExport }) {
  const {
    tasksCompleted = 0,
    avgFocusTime = 0,
    topContexts = [],
    insights = [],
    tinyWins = 0
  } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className={`border-2 ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' 
          : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-6 h-6 ${
                isDark ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Your Week in Review
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
              <p className={`text-3xl font-bold ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                {tasksCompleted}
              </p>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Tasks Done
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
              <p className={`text-3xl font-bold ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {Math.round(avgFocusTime)}h
              </p>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Avg Daily Focus
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
              <p className={`text-3xl font-bold ${
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {tinyWins}⚡
              </p>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Tiny Wins
              </p>
            </div>
          </div>

          {/* Top Contexts */}
          {topContexts.length > 0 && (
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Target className="w-4 h-4" />
                Most Active Contexts
              </h4>
              <div className="flex gap-2 flex-wrap">
                {topContexts.map((context, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-2 rounded-lg ${
                      isDark ? 'bg-slate-800' : 'bg-white'
                    }`}
                  >
                    <span className={`font-medium ${
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {context.name}
                    </span>
                    <span className={`ml-2 text-sm ${
                      isDark ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      ({context.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <TrendingUp className="w-4 h-4" />
                Insights & Patterns
              </h4>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      isDark ? 'bg-slate-800' : 'bg-white'
                    }`}
                  >
                    <p className={`text-sm ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`p-4 rounded-lg border ${
            isDark 
              ? 'bg-purple-900/20 border-purple-700' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <p className={`text-sm ${
              isDark ? 'text-purple-300' : 'text-purple-900'
            }`}>
              💜 Keep going! You're building momentum. Small steps add up to big changes.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}