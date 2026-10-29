import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickCoachButton({ context, isDark = false }) {
  const [showPrompts, setShowPrompts] = useState(false);
  const navigate = useNavigate();

  const contextPrompts = {
    focusnow: [
      "Help me prioritize these tasks",
      "This feels overwhelming",
      "Break this down smaller"
    ],
    braindump: [
      "Help me clarify why this matters",
      "Suggest subtasks for this",
      "What's a good first step?"
    ],
    projects: [
      "Help me plan this project",
      "What outcomes make sense?",
      "How do I get started?"
    ]
  };

  const prompts = contextPrompts[context] || [
    "Help me think through this",
    "I'm feeling stuck",
    "What should I focus on?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showPrompts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 space-y-2"
          >
            {prompts.map((prompt, idx) => (
              <Card
                key={idx}
                className={`plm-card p-3 cursor-pointer hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                    : 'bg-white hover:bg-pink-50'
                }`}
                onClick={() => {
                  navigate(createPageUrl("Chat"));
                }}
              >
                <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-black'}`}>
                  {prompt}
                </p>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setShowPrompts(!showPrompts)}
        className={`rounded-none w-14 h-14 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
          showPrompts 
            ? 'bg-black text-white hover:bg-gray-800' 
            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
        }`}
      >
        {showPrompts ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}