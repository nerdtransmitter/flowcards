const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Sparkles,
  Zap,
  Brain,
  FolderKanban,
  Archive,
  Calendar,
  BookOpen,
  Trophy,
  MessageCircle,
  Keyboard,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function About() {
  const [user, setUser] = useState(null);
  const [expandedSection, setExpandedSection] = useState('overview');
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const sections = [
    {
      id: 'overview',
      title: 'What is Flowcards?',
      icon: <Info className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Flowcards is an ADHD-friendly task management app that helps you focus on what matters most without overwhelming you with choices.</p>
          <p>Unlike traditional todo apps, Flowcards:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Surfaces</strong> only 3 tasks at a time in "Focus Now"</li>
            <li><strong>Respects</strong> your energy levels and context</li>
            <li><strong>Integrates AI</strong> coaching for planning and reflection</li>
            <li><strong>Tracks time</strong> with Pomodoro and flexible blocking</li>
            <li><strong>Celebrates</strong> tiny wins to build momentum</li>
          </ul>
        </div>
      )
    },
    {
      id: 'focus-now',
      title: 'Focus Now - Your Command Center',
      icon: <Sparkles className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Focus Now shows you the 3 most relevant tasks based on:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Hard deadlines and important flags</li>
            <li>Tasks with clear next steps</li>
            <li>Your current energy level (adjust with slider)</li>
            <li>Time of day (no deep work after 4pm)</li>
            <li>Context tags (home, laptop, 15min, etc.)</li>
          </ul>
          <Badge className="mt-2">Pro tip: Use "Customize" to manually reorder your Do Next list</Badge>
        </div>
      )
    },
    {
      id: 'brain-dump',
      title: 'Brain Dump - Quick Capture',
      icon: <Brain className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Capture tasks quickly without overthinking. Each task can include:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Title:</strong> What needs to be done</li>
            <li><strong>Why:</strong> One-line purpose (helps motivation)</li>
            <li><strong>Next Step:</strong> Tiny first action (≤120 chars)</li>
            <li><strong>Effort:</strong> Tiny/Small/Medium/Large</li>
            <li><strong>Energy:</strong> Low/Medium/High</li>
            <li><strong>Context Tags:</strong> Where/when/how it can be done</li>
          </ul>
          <Badge className="mt-2">Keyboard: ⌥Space to quick-capture from anywhere</Badge>
        </div>
      )
    },
    {
      id: 'projects',
      title: 'Projects - Big Picture Thinking',
      icon: <FolderKanban className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Projects help you group related tasks and see the bigger picture:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>North Star:</strong> One guiding sentence for clarity</li>
            <li><strong>Desired Outcomes:</strong> What success looks like</li>
            <li><strong>Pinboard:</strong> Embed Spotify, YouTube, images, PDFs</li>
            <li><strong>Areas:</strong> Apartment, Career, Health, Creative, etc.</li>
          </ul>
          <p>Tasks linked to projects show up with a project badge and help you maintain focus on what matters.</p>
        </div>
      )
    },
    {
      id: 'shelf',
      title: 'Shelf - Defer & Archive',
      icon: <Archive className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>The Shelf has 4 columns you can drag-and-drop between:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Waiting:</strong> Blocked or on hold</li>
            <li><strong>Someday:</strong> Ideas and aspirations</li>
            <li><strong>Done:</strong> Completed tasks (celebrate!)</li>
            <li><strong>Archived:</strong> Historical reference</li>
          </ul>
          <p>Use "Ask AI for Shelf Review" to get personalized recommendations on when/how to tackle waiting tasks.</p>
        </div>
      )
    },
    {
      id: 'time-blocks',
      title: 'Time Blocks - Calendar Planning',
      icon: <Calendar className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Time blocking helps you plan realistically:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Views:</strong> Day / 3-Day / Week / Month</li>
            <li><strong>Zoom:</strong> Adjust hour density for more/less detail</li>
            <li><strong>Current time line:</strong> Red indicator shows now</li>
            <li><strong>Drag & drop:</strong> Move blocks to reschedule</li>
            <li><strong>Block strength:</strong> Light/Medium/Hard commitment</li>
          </ul>
          <Badge className="mt-2">Quick Schedule: Use chips on task cards → "Add to Time Block"</Badge>
        </div>
      )
    },
    {
      id: 'logbook',
      title: 'Logbook - Reflection & Patterns',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Review your progress and spot patterns:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>See completed tasks by day/week/month</li>
            <li>Track Pomodoro sessions and time entries</li>
            <li>View Flow Coach conversation history</li>
            <li>Edit task details from past entries</li>
            <li>Generate weekly/monthly digests</li>
          </ul>
          <p>The Logbook helps you understand your rhythms and adjust your system.</p>
        </div>
      )
    },
    {
      id: 'done-gallery',
      title: 'Done Gallery - Celebrate Wins',
      icon: <Trophy className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Your personal victory wall! See:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Weekly completion streaks</li>
            <li>Tiny wins counter (⚡ for tasks ≤15min)</li>
            <li>Monthly completion trends</li>
            <li>Most productive days/times</li>
            <li>Project completion milestones</li>
          </ul>
          <p>Momentum matters. Celebrate every win, no matter how small! 🎉</p>
        </div>
      )
    },
    {
      id: 'flow-coach',
      title: 'Flow Coach - Your AI Partner',
      icon: <MessageCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p>Flow Coach is your ADHD-friendly thinking partner:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Brainstorm:</strong> Break down overwhelming tasks</li>
            <li><strong>Plan:</strong> Schedule tasks based on energy/context</li>
            <li><strong>Reflect:</strong> Review patterns and insights</li>
            <li><strong>Atomize:</strong> Goblin Tools-style task breakdown</li>
            <li><strong>Time Block AI:</strong> Get optimal scheduling suggestions</li>
          </ul>
          <p>Access via floating chat button (bottom-right) on any page with contextual prompts!</p>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: <Keyboard className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Navigation</h4>
              <ul className="space-y-1 text-sm">
                <li><Badge variant="outline">⌘/Ctrl+1</Badge> Focus Now</li>
                <li><Badge variant="outline">⌘/Ctrl+2</Badge> Brain Dump</li>
                <li><Badge variant="outline">⌘/Ctrl+3</Badge> Projects</li>
                <li><Badge variant="outline">⌥Space</Badge> Quick Capture</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Actions</h4>
              <ul className="space-y-1 text-sm">
                <li><Badge variant="outline">⌘/Ctrl+K</Badge> Global Search</li>
                <li><Badge variant="outline">Esc</Badge> Close Modal</li>
                <li><Badge variant="outline">Enter</Badge> Save Dialog</li>
                <li><Badge variant="outline">⌘/Ctrl+Z</Badge> Undo (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className={`w-12 h-12 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <h1 className={`text-5xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Flowcards
            </h1>
          </div>
          <p className={`text-xl ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            ADHD-friendly task management that works with your brain, not against it
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Badge className="text-base py-2 px-4">Version 1.4</Badge>
            <Badge variant="outline" className="text-base py-2 px-4">Focus-First Design</Badge>
          </div>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card
              key={section.id}
              className={`border-2 cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-purple-100 hover:border-purple-300'
              } ${expandedSection === section.id ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => toggleSection(section.id)}
            >
              <CardHeader>
                <CardTitle className={`flex items-center justify-between ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <div className="flex items-center gap-3">
                    {section.icon}
                    {section.title}
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CardTitle>
              </CardHeader>
              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className={
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }>
                      {section.content}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>

        <Card className={`border-2 ${
          isDark
            ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700'
            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
        }`}>
          <CardContent className="p-6 text-center">
            <Sparkles className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <h3 className={`text-2xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Start Small, Build Momentum
            </h3>
            <p className={`text-lg ${
              isDark ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Focus on one tiny win at a time. Progress compounds. 🚀
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}