const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Sparkles, Plus, Loader2, AlertCircle, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "../components/chat/MessageBubble";
import { toast } from "sonner";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [editingConv, setEditingConv] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef(null);
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await db.auth.me();
        setUser(userData);
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load user data");
      }
    };
    loadUser();
  }, []);

  const { data: conversations = [], refetch, isLoading: conversationsLoading } = useQuery({
    queryKey: ['flow-coach-conversations', user?.email],
    queryFn: async () => {
      if (!user) return [];
      try {
        const convs = await db.agents.listConversations({
          agent_name: 'flow_coach'
        });
        return convs || [];
      } catch (err) {
        console.error("Error loading conversations:", err);
        setError("Failed to load conversations. The Flow Coach agent may need to be activated.");
        return [];
      }
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations]);

  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = db.agents.subscribeToConversation(
      selectedConversation.id,
      (data) => {
        setSelectedConversation(prev => ({
          ...prev,
          messages: data.messages
        }));
      }
    );

    return () => unsubscribe();
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const generateConversationTitle = async (messages) => {
    try {
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Generate a concise conversation title (3-6 words) and 2-3 relevant tags from these messages:

${messages.slice(0, 4).map(m => `${m.role}: ${m.content?.slice(0, 200)}`).join('\n')}

Return JSON with title and tags.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });
      return result;
    } catch (error) {
      console.error("Error generating title:", error);
      return { title: `Chat ${new Date().toLocaleDateString()}`, tags: [] };
    }
  };

  const handleCreateConversation = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newConv = await db.agents.createConversation({
        agent_name: 'flow_coach',
        metadata: {
          name: `New Chat`,
          tags: [],
          needsTitle: true
        }
      });
      await refetch();
      setSelectedConversation(newConv);
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("Failed to create conversation. Please try again or check that Flow Coach is properly configured.");
    }
    setIsCreating(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation) return;

    const userInput = input;
    setInput("");
    setError(null);

    try {
      await db.agents.addMessage(selectedConversation, {
        role: "user",
        content: userInput
      });

      // Auto-generate title after first exchange
      if (selectedConversation.metadata?.needsTitle && selectedConversation.messages?.length >= 2) {
        const titleData = await generateConversationTitle(selectedConversation.messages);
        await db.agents.updateConversation(selectedConversation.id, {
          metadata: {
            name: titleData.title,
            tags: titleData.tags,
            needsTitle: false
          }
        });
        await refetch();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      setInput(userInput);
    }
  };

  const isProcessing = selectedConversation?.messages?.some(
    m => m.role === 'assistant' && m.tool_calls?.some(tc => tc.status === 'running' || tc.status === 'in_progress')
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : ''
    }`}>
      <div className="max-w-6xl mx-auto flex gap-6 h-[calc(100vh-8rem)]">
        {/* Conversations sidebar */}
        <Card className={`plm-card w-80 flex flex-col ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
        }`}>
          <div className={`p-4 border-b-2 ${isDark ? 'border-slate-700' : 'border-black'}`}>
            <Button
              onClick={handleCreateConversation}
              disabled={isCreating || conversationsLoading}
              className="plm-button w-full bg-cyan-500 text-white hover:bg-cyan-600 border-black"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              NEW CHAT
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  No conversations yet. Create your first one to start chatting with Flow Coach!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} className="relative group">
                  {editingConv === conv.id ? (
                    <div className="p-2 space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            await db.agents.updateConversation(conv.id, {
                              metadata: { ...conv.metadata, name: editTitle }
                            });
                            await refetch();
                            setEditingConv(null);
                            toast.success('Title updated');
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingConv(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 border-b-2 transition-all ${
                        selectedConversation?.id === conv.id
                          ? isDark
                            ? 'bg-cyan-900/30 border-cyan-500'
                            : 'bg-cyan-100 border-black font-bold'
                          : isDark
                            ? 'hover:bg-slate-700 border-transparent'
                            : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate flex-1 ${
                          selectedConversation?.id === conv.id ? 'font-bold' : 'font-medium'
                        } ${
                          isDark ? 'text-slate-200' : 'text-black'
                        }`}>
                          {conv.metadata?.name || 'Conversation'}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConv(conv.id);
                            setEditTitle(conv.metadata?.name || '');
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {conv.metadata?.tags?.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {conv.messages?.length || 0} msgs
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className={`w-10 h-10 ${
                isDark ? 'text-cyan-400' : 'text-cyan-500'
              }`} />
              <h1 className={`text-5xl font-black uppercase tracking-tighter ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Flow Coach
              </h1>
            </div>
            <p className={`text-xl font-bold bg-cyan-100 inline-block px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1 ${
              isDark ? 'text-black' : 'text-black'
            }`}>
              Your ADHD-friendly thinking partner ✨
            </p>
          </motion.div>

          {error && (
            <div className={`mb-4 p-4 rounded-lg border-2 flex items-start gap-3 ${
              isDark 
                ? 'bg-red-900/20 border-red-800 text-red-200' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!selectedConversation ? (
            <Card className={`plm-card flex-1 flex items-center justify-center ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
            }`}>
              <CardContent className="text-center">
                <Sparkles className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-slate-600' : 'text-gray-300'
                }`} />
                <p className={`text-xl font-black uppercase tracking-tight mb-2 ${
                  isDark ? 'text-slate-300' : 'text-black'
                }`}>
                  Start a conversation
                </p>
                <p className={`mb-6 ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Click "NEW CHAT" to begin chatting with Flow Coach
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                <AnimatePresence mode="popLayout">
                  {selectedConversation.messages?.map((msg, idx) => (
                    <MessageBubble
                      key={`${selectedConversation.id}-${idx}`}
                      message={msg}
                      isDark={isDark}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

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
                  placeholder="Share your thoughts, ask for help, or brainstorm ideas..."
                  className={`plm-input flex-1 resize-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                      : 'bg-white'
                  }`}
                  rows={3}
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="plm-button bg-cyan-500 text-white hover:bg-cyan-600 h-auto border-black"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}