import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function TinyWinsCounter({ count, isDark = false }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-2"
    >
      <Zap className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
      <Badge className={`${
        isDark 
          ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' 
          : 'bg-yellow-100 text-yellow-800 border-yellow-300'
      }`}>
        {count} Tiny Win{count > 1 ? 's' : ''} ⚡
      </Badge>
    </motion.div>
  );
}