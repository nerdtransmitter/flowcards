import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const starterPacks = {
  home: [
    { title: "5-min drawer reset", emoji: "🧺", effort: "tiny" },
    { title: "Hang one frame", emoji: "🖼️", effort: "tiny" },
    { title: "Water plants", emoji: "🌱", effort: "tiny" }
  ],
  errands: [
    { title: "Quick grocery run", emoji: "🛒", effort: "small" },
    { title: "Drop off package", emoji: "📦", effort: "tiny" },
    { title: "Pick up prescription", emoji: "💊", effort: "tiny" }
  ],
  laptop: [
    { title: "Answer one email", emoji: "📧", effort: "tiny" },
    { title: "Update one document", emoji: "📝", effort: "small" },
    { title: "Review one file", emoji: "📂", effort: "tiny" }
  ],
  office: [
    { title: "Schedule one meeting", emoji: "📅", effort: "tiny" },
    { title: "Organize desktop", emoji: "🖥️", effort: "small" },
    { title: "File one document", emoji: "📂", effort: "tiny" }
  ]
};

export default function ContextStarterPack({ context, onSelect, isDark = false }) {
  const packs = starterPacks[context] || starterPacks.home;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`border-2 ${
        isDark 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <span className={isDark ? 'text-white' : 'text-gray-900'}>
              Quick Wins for {context}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className={`text-sm mb-4 ${
            isDark ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Need a tiny momentum boost? Try one of these:
          </p>
          {packs.map((pack, idx) => (
            <Button
              key={idx}
              variant="outline"
              className={`w-full justify-start text-left ${
                isDark 
                  ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
                  : 'bg-white/80 hover:bg-white'
              }`}
              onClick={() => onSelect(pack)}
            >
              <span className="mr-3 text-2xl">{pack.emoji}</span>
              <div>
                <p className="font-medium">{pack.title}</p>
                <p className="text-xs opacity-70">{pack.effort} effort</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}