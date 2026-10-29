const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sparkles, Check, ArrowRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const STEPS = {
  GREETING: 'greeting',
  MOOD: 'mood',
  BRAIN_DUMP: 'brain_dump',
  PRIORITIZE: 'prioritize',
  COMMIT: 'commit',
  COMPLETED: 'completed'
};

export default function Coaching() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [session, setSession] = useState(null);
  const [step, setStep] = useState(STEPS.GREETING);
  const [mood, setMood] = useState(3);
  const [brainDump, setBrainDump] = useState("");
  const [highlight, setHighlight] = useState("");
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await db.auth.me();
      setUser(u);
      setIsDark(u?.theme === 'dark');
    };
    loadUser();
  }, []);

  const startSessionMutation = useMutation({
    mutationFn: async (type) => {
      return await db.entities.CoachingSession.create({
        type,
        started_at: new Date().toISOString(),
        mood_rating: mood
      });
    },
    onSuccess: (data) => {
      setSession(data);
      setStep(STEPS.MOOD);
    }
  });

  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;
      await db.entities.CoachingSession.update(session.id, {
        completed_at: new Date().toISOString(),
        responses: { brainDump, highlight },
        mood_rating: mood
      });
      // Also create the task
      if (highlight) {
        await db.entities.Task.create({
          title: highlight,
          status: 'active',
          is_important: true,
          source: 'ai'
        });
      }
    },
    onSuccess: () => {
      setStep(STEPS.COMPLETED);
      toast.success("Session completed!");
    }
  });

  const containerClass = `min-h-screen p-6 flex flex-col items-center justify-center transition-colors ${
    isDark ? 'bg-slate-900 text-white' : 'bg-plm-grid text-black'
  }`;

  const cardClass = `w-full max-w-md ${
    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
  } p-8 rounded-xl transition-all duration-300`;

  const renderStep = () => {
    switch(step) {
      case STEPS.GREETING:
        return (
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-serif-display font-black italic">Good Morning, {user?.full_name?.split(' ')[0] || 'Friend'}!</h1>
            <p className="text-lg opacity-80">Ready to design your day?</p>
            <Button 
              className="plm-button-pill bg-pink-500 text-white hover:bg-pink-600 w-full text-lg py-6"
              onClick={() => startSessionMutation.mutate('morning_checkin')}
            >
              Start Check-in <Sun className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );
      
      case STEPS.MOOD:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">How are you feeling?</h2>
            <div className="py-8">
              <Slider 
                value={[mood]} 
                min={1} 
                max={5} 
                step={1} 
                onValueChange={(v) => setMood(v[0])}
                className="w-full"
              />
              <div className="flex justify-between mt-4 text-sm font-bold opacity-60">
                <span>Low Energy</span>
                <span>Ready to Go!</span>
              </div>
            </div>
            <Button 
              className="w-full plm-button bg-black text-white hover:bg-gray-800"
              onClick={() => setStep(STEPS.BRAIN_DUMP)}
            >
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case STEPS.BRAIN_DUMP:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">What's on your mind?</h2>
            <p className="text-sm opacity-70">Dump everything. We'll sort it out later.</p>
            <Textarea 
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              placeholder="I need to..."
              className={`min-h-[150px] ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-2 border-black'}`}
            />
            <Button 
              className="w-full plm-button bg-black text-white hover:bg-gray-800"
              onClick={() => setStep(STEPS.PRIORITIZE)}
              disabled={!brainDump.trim()}
            >
              Sort It Out <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case STEPS.PRIORITIZE:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pick ONE Highlight</h2>
            <p className="text-sm opacity-70">If you only get one thing done today, what is it?</p>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider">Your Highlight</label>
              <input 
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                placeholder="E.g. Finish the report"
                className={`w-full p-3 rounded-md ${
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-2 border-black'
                }`}
              />
            </div>
            <Button 
              className="w-full plm-button bg-green-500 text-white hover:bg-green-600"
              onClick={() => completeSessionMutation.mutate()}
              disabled={!highlight.trim()}
            >
              Commit <Check className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

      case STEPS.COMPLETED:
        return (
          <div className="text-center space-y-6">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border-2 border-black">
               <Check className="w-10 h-10 text-green-600" />
             </div>
             <h2 className="text-3xl font-serif-display font-black italic">You're Set!</h2>
             <p className="opacity-80">Go crush "{highlight}"!</p>
             <Button 
               className="w-full plm-button bg-black text-white"
               onClick={() => {
                 setSession(null);
                 setStep(STEPS.GREETING);
                 setBrainDump("");
                 setHighlight("");
               }}
             >
               Back to Dashboard
             </Button>
          </div>
        );
    }
  };

  return (
    <div className={containerClass}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cardClass}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}