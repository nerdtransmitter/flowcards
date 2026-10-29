import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const contexts = [
  { id: "home", label: "Home", emoji: "🏠" },
  { id: "errands", label: "Errands", emoji: "🏃" },
  { id: "laptop", label: "Laptop", emoji: "💻" },
  { id: "phone", label: "Phone", emoji: "📱" },
  { id: "quiet", label: "Quiet", emoji: "🤫" },
  { id: "15min", label: "15 min", emoji: "⚡" },
  { id: "30min", label: "30 min", emoji: "⏱️" },
  { id: "60min", label: "60 min", emoji: "⏰" },
  { id: "deep_work", label: "Deep Work", emoji: "🧠" }
];

export default function ContextSelector({ selected = [], onChange, isDark = false }) {
  const toggleContext = (contextId) => {
    if (selected.includes(contextId)) {
      onChange(selected.filter(c => c !== contextId));
    } else {
      onChange([...selected, contextId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {contexts.map((context) => (
        <motion.div
          key={context.id}
          whileTap={{ scale: 0.95 }}
        >
          <Badge
            variant={selected.includes(context.id) ? "default" : "outline"}
            className={`cursor-pointer transition-all duration-200 ${
              selected.includes(context.id)
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                : isDark
                  ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => toggleContext(context.id)}
          >
            <span className="mr-1">{context.emoji}</span>
            {context.label}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}