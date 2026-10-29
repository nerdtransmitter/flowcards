const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Wand2, Lightbulb, Plus, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import QuickCoachButton from "../components/chat/QuickCoachButton";
import DraftTaskPreview from "../components/tasks/DraftTaskPreview";
import AIActionNotification from "../components/tasks/AIActionNotification";
import SmartAddDialog from "../components/inbox/SmartAddDialog";

export default function BrainDump() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [draftTasks, setDraftTasks] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [lastCreatedTasks, setLastCreatedTasks] = useState([]);
  const [showSmartAdd, setShowSmartAdd] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const createTaskMutation = useMutation({
    mutationFn: (task) => db.entities.Task.create(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
    },
  });

  const handleAtomize = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Take this brain dump and split it into 5-7 tiny, actionable tasks. For each task, provide:
- A clear, concise title (5-10 words max)
- A one-line "why" (purpose/benefit)
- A suggested next step (≤120 chars)
- Suggested effort level (tiny/small/medium/large)
- Suggested energy level (low/medium/high)
- 2-3 relevant context tags from: home, errands, laptop, phone, quiet, 15min, 30min, 60min, deep_work

Brain dump:
${input}

Return as JSON array. Use encouraging, ADHD-friendly language. Keep tasks small and non-overwhelming.`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  why: { type: "string" },
                  next_step: { type: "string" },
                  effort: { type: "string", enum: ["tiny", "small", "medium", "large"] },
                  energy: { type: "string", enum: ["low", "medium", "high"] },
                  context_tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setDraftTasks(result.tasks || []);
    } catch (error) {
      console.error("Error atomizing:", error);
    }
    setIsProcessing(false);
  };

  const handleClarify = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Read this task/idea and write a clear, motivating one-line "why" that explains the purpose or benefit. Keep it under 15 words, encouraging, and ADHD-friendly.

Task/idea:
${input}`,
        response_json_schema: {
          type: "object",
          properties: {
            why: { type: "string" }
          }
        }
      });

      setInput(`${input}\n\nWhy: ${result.why}`);
    } catch (error) {
      console.error("Error clarifying:", error);
    }
    setIsProcessing(false);
  };

  const handleQuickAdd = async () => {
    if (!input.trim()) return;
    
    await createTaskMutation.mutateAsync({
      title: input,
      source: 'quick',
      status: 'active'
    });
    
    setInput("");
  };

  const handleConfirmDrafts = async () => {
    const tasksToCreate = draftTasks.map(t => ({
      ...t,
      source: 'inbox',
      status: 'active'
    }));

    const created = await db.entities.Task.bulkCreate(tasksToCreate);
    setLastCreatedTasks(created);
    setInput("");
    setDraftTasks([]);
    
    // Show notification
    setNotificationData({
      action: 'atomize',
      summary: `${tasksToCreate.length} tasks created from your brain dump`
    });
    setShowNotification(true);
    
    setTimeout(() => setShowNotification(false), 8000);
  };

  const handleEditDraft = (index, updatedTask) => {
    const newDrafts = [...draftTasks];
    newDrafts[index] = updatedTask;
    setDraftTasks(newDrafts);
  };

  const handleRemoveDraft = (index) => {
    setDraftTasks(draftTasks.filter((_, i) => i !== index));
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(input ? `${input}\n${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Brain className={`w-8 h-8 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h1 className={`text-4xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Brain Dump
            </h1>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Empty your mind. We'll help you organize it.
          </p>
        </motion.div>

        <Card className={`plm-card ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center justify-between font-black uppercase tracking-tight ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              <span>What's on your mind?</span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isListening}
                className={`plm-button ${
                  isListening ? 'bg-red-100 border-red-300' : ''
                } ${isDark ? 'border-slate-600' : 'bg-white'}`}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-red-600 animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your todo list, brain dump, meeting notes, or just type freely... No pressure to be organized!"
              className={`plm-input min-h-64 text-lg resize-none leading-relaxed p-6 ${
                isDark 
                  ? 'border-slate-600 text-white placeholder:text-slate-500' 
                  : 'text-black placeholder:text-gray-400 bg-white/50 backdrop-blur-sm'
              }`}
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleAtomize}
                disabled={!input.trim() || isProcessing}
                className="plm-button flex-1 md:flex-none bg-pink-500 hover:bg-pink-600 text-white border-black"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Atomize into Tasks
              </Button>

              <Button
                onClick={handleClarify}
                disabled={!input.trim() || isProcessing}
                variant="outline"
                className={`plm-button flex-1 md:flex-none bg-white text-black hover:bg-gray-100 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300' 
                    : ''
                }`}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Clarify Why
              </Button>

              <Button
                onClick={handleQuickAdd}
                disabled={!input.trim()}
                variant="outline"
                className={`plm-button flex-1 md:flex-none bg-white text-black hover:bg-gray-100 ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-300' 
                    : ''
                }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
              
              <Button
                onClick={() => setShowSmartAdd(true)}
                disabled={!input.trim()}
                className="plm-button flex-1 md:flex-none bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-black"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Smart Add
              </Button>
            </div>

            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-slate-900/50' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${
                isDark ? 'text-slate-300' : 'text-blue-900'
              }`}>
                💡 <strong>Tip:</strong> "Atomize" breaks big blobs into tiny, doable tasks. 
                "Clarify Why" helps you understand the purpose. Use the 🎤 button for voice input!
              </p>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {draftTasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={`border-2 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white/80 backdrop-blur-sm border-purple-100'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>
                      Draft Tasks ({draftTasks.length})
                    </span>
                    <Button
                      onClick={handleConfirmDrafts}
                      className="bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      Create All Tasks
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {draftTasks.map((task, index) => (
                    <DraftTaskPreview
                      key={index}
                      task={task}
                      onEdit={(updated) => handleEditDraft(index, updated)}
                      onRemove={() => handleRemoveDraft(index)}
                      isDark={isDark}
                    />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuickCoachButton context="braindump" isDark={isDark} />

      <AIActionNotification
        show={showNotification}
        action={notificationData?.action}
        summary={notificationData?.summary}
        onView={() => navigate(createPageUrl("FocusNow"))}
        onUndo={async () => {
          if (lastCreatedTasks.length > 0) {
            await Promise.all(lastCreatedTasks.map(t => db.entities.Task.delete(t.id)));
            queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
            setShowNotification(false);
          }
        }}
        onDismiss={() => setShowNotification(false)}
        isDark={isDark}
      />

      <SmartAddDialog 
        open={showSmartAdd}
        onClose={() => setShowSmartAdd(false)}
        initialInput={input}
        isDark={isDark}
      />
    </div>
  );
}