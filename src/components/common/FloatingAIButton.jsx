const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Sparkles, Send, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MessageBubble from "../chat/MessageBubble";

export default function FloatingAIButton({ user, isDark = false, currentPage }) {
  const [showChat, setShowChat] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (!conversation && showChat) {
      createConversation();
    }
  }, [showChat]);

  useEffect(() => {
    if (!conversation) return;

    const unsubscribe = db.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        setConversation(prev => ({
          ...prev,
          messages: data.messages
        }));
      }
    );

    return () => unsubscribe();
  }, [conversation?.id]);

  const createConversation = async () => {
    try {
      const newConv = await db.agents.createConversation({
        agent_name: 'flow_coach',
        metadata: {
          name: `Quick Chat ${new Date().toLocaleTimeString()}`,
          description: 'Quick chat from floating button',
          context_page: currentPage
        }
      });
      setConversation(newConv);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;

    const userInput = input;
    setInput("");

    try {
      await db.agents.addMessage(conversation, {
        role: "user",
        content: userInput
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setInput(userInput);
    }
  };

  const getContextualPrompts = () => {
    switch(currentPage) {
      case 'FocusNow':
        return [
          "Help me prioritize these tasks",
          "This feels overwhelming",
          "Break this down smaller",
          "What should I do first?"
        ];
      case 'BrainDump':
        return [
          "Help me clarify why this matters",
          "Suggest subtasks for this",
          "What's a good first step?",
          "Make this more actionable"
        ];
      case 'Projects':
        return [
          "Help me plan this project",
          "What outcomes make sense?",
          "How do I get started?",
          "Break into milestones"
        ];
      case 'Shelf':
        return [
          "When should I do these?",
          "Help review my waiting tasks",
          "What can I archive?",
          "Prioritize my someday list"
        ];
      case 'TimeBlocks':
        return [
          "Suggest optimal times",
          "Plan my tomorrow",
          "Review my week",
          "Balance my schedule"
        ];
      default:
        return [
          "Help me think through this",
          "I'm feeling stuck",
          "What should I focus on?",
          "Review my progress"
        ];
    }
  };

  const prompts = getContextualPrompts();

  const handlePromptClick = async (prompt) => {
    if (!conversation) {
      await createConversation();
    }
    setInput(prompt);
    setShowPrompts(false);
    setShowChat(true);
  };

  const handleOpenFullChat = () => {
    navigate(createPageUrl("Chat"));
    setShowChat(false);
  };

  const isProcessing = conversation?.messages?.some(
    m => m.role === 'assistant' && m.tool_calls?.some(tc => tc.status === 'running' || tc.status === 'in_progress')
  );

  return (
    <>
      {/* Floating Chat Window */}
      <AnimatePresence>
        {showChat && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] z-50 shadow-2xl"
          >
            <Card className={`plm-card h-full flex flex-col ${
              isDark 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white'
            }`}>
              <CardHeader className={`flex-row items-center justify-between space-y-0 pb-3 border-b-2 ${
                isDark ? 'border-slate-700' : 'border-black'
              }`}>
                <CardTitle className={`text-lg font-black uppercase tracking-tight flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  <Sparkles className="w-5 h-5 text-pink-500 fill-pink-500" />
                  Flow Coach
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(true)}
                    className="h-8 w-8"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenFullChat}
                    className="h-8 w-8"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChat(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!conversation ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : conversation.messages?.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <p className="text-sm mb-4">Hi! I'm your Flow Coach. How can I help?</p>
                    <div className="space-y-2">
                      {prompts.slice(0, 3).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePromptClick(prompt)}
                          className={`block w-full text-left p-3 border-2 border-black font-medium text-sm transition-all hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            isDark
                              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
                              : 'bg-white text-black hover:bg-pink-50'
                          }`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {conversation.messages.map((msg, idx) => (
                      <MessageBubble key={idx} message={msg} isDark={isDark} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className={`p-4 border-t-2 ${isDark ? 'border-slate-700' : 'border-black'}`}>
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask Flow Coach..."
                    className={`plm-input flex-1 resize-none min-h-[60px] max-h-[120px] ${
                      isDark 
                        ? 'bg-slate-900 border-slate-600 text-white placeholder:text-slate-500' 
                        : 'bg-white'
                    }`}
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    className="plm-button bg-pink-500 text-white hover:bg-pink-600 h-auto self-end border-black"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Prompts Popup */}
      <AnimatePresence>
        {showPrompts && !showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 space-y-2 max-w-xs"
          >
            {prompts.map((prompt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className={`plm-card cursor-pointer hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white hover:bg-pink-50'
                  }`}
                  onClick={() => handlePromptClick(prompt)}
                >
                  <CardContent className="p-3 flex items-start gap-2">
                    <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isDark ? 'text-purple-400' : 'text-pink-600'
                    }`} />
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-black'}`}>
                      {prompt}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            if (showChat) {
              if (isMinimized) {
                setIsMinimized(false);
              } else {
                setShowChat(false);
              }
            } else if (showPrompts) {
              setShowPrompts(false);
            } else {
              setShowChat(true);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowPrompts(!showPrompts);
            setShowChat(false);
          }}
          className={`rounded-none w-16 h-16 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            showChat || showPrompts
              ? isDark
                ? 'bg-slate-700 hover:bg-slate-600' 
                : 'bg-black text-white hover:bg-gray-800'
              : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
          title="Left-click: Open chat | Right-click: Show prompts"
        >
          {showChat || showPrompts ? (
            <X className="w-7 h-7" />
          ) : (
            <MessageCircle className="w-7 h-7" />
          )}
        </Button>
      </div>
    </>
  );
}