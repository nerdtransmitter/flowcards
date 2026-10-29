const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Archive, ArrowRight, Sparkles, Clock, Calendar } from "lucide-react";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function StuckTaskCoach({ task, open, onClose, isDark }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('options'); // options, breakdown, schedule

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      await db.entities.Task.update(task.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      onClose();
    }
  });

  const handleDelete = async () => {
    await db.entities.Task.update(task.id, { status: 'archived' }); // Soft delete/archive
    queryClient.invalidateQueries();
    toast.success("Task archived. Out of sight, out of mind! 🧹");
    onClose();
  };

  const handleShelf = () => {
    updateMutation.mutate({ status: 'waiting', snoozed_until: null });
    toast.success("Moved to Shelf. It'll be there when you're ready. 📦");
  };

  const handleQuickWin = () => {
    // Just re-label it as tiny effort to encourage doing it
    updateMutation.mutate({ effort: 'tiny', priority: 'high' });
    toast.success("Marked as a quick win! Go get it! ⚡");
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md border-2 border-black ${isDark ? 'bg-slate-900 text-white' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif-display font-black italic tracking-tight">
            Let's unstuck this.
          </DialogTitle>
          <DialogDescription className={isDark ? 'text-slate-300' : 'text-gray-600'}>
            You've seen <strong>"{task.title}"</strong> {task.surfaced_count} times without doing it. What's holding you back?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={handleQuickWin}
            className={`justify-start h-auto py-3 plm-button-pill border-black hover:bg-green-50 ${isDark ? 'text-black bg-white' : ''}`}
          >
            <Sparkles className="w-5 h-5 mr-3 text-green-500" />
            <div className="text-left">
              <div className="font-bold">I can do it in 5 mins</div>
              <div className="text-xs opacity-70">Mark as "Tiny" & Do Now</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => window.dispatchEvent(new CustomEvent('openTaskDrawer', { detail: task }))} // Assuming logic in FocusNow
            className={`justify-start h-auto py-3 plm-button-pill border-black hover:bg-blue-50 ${isDark ? 'text-black bg-white' : ''}`}
          >
            <ArrowRight className="w-5 h-5 mr-3 text-blue-500" />
            <div className="text-left">
              <div className="font-bold">It's too big</div>
              <div className="text-xs opacity-70">Break it down with AI</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            onClick={handleShelf}
            className={`justify-start h-auto py-3 plm-button-pill border-black hover:bg-amber-50 ${isDark ? 'text-black bg-white' : ''}`}
          >
            <Archive className="w-5 h-5 mr-3 text-amber-500" />
            <div className="text-left">
              <div className="font-bold">Not right now</div>
              <div className="text-xs opacity-70">Move to Shelf for later</div>
            </div>
          </Button>

          <Button 
            variant="outline" 
            onClick={handleDelete}
            className={`justify-start h-auto py-3 plm-button-pill border-black hover:bg-red-50 ${isDark ? 'text-black bg-white' : ''}`}
          >
            <Trash2 className="w-5 h-5 mr-3 text-red-500" />
            <div className="text-left">
              <div className="font-bold">I'm never doing this</div>
              <div className="text-xs opacity-70">Archive it</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}