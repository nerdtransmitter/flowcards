import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmartSnippet({ snippet, isDark = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!snippet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`gap-1 h-6 px-2 ${
          isDark 
            ? 'text-yellow-400 hover:bg-yellow-900/20' 
            : 'text-yellow-600 hover:bg-yellow-50'
        }`}
      >
        <Lightbulb className="w-3 h-3" />
        <span className="text-xs">Smart tip</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`absolute z-10 mt-2 p-3 rounded-lg shadow-lg border max-w-xs ${
              isDark 
                ? 'bg-slate-800 border-yellow-700 text-yellow-300' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}
          >
            <p className="text-sm">{snippet}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}