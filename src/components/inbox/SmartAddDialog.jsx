const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

export default function SmartAddDialog({ open, onClose, initialInput, isDark }) {
  const [input, setInput] = useState(initialInput || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => db.entities.Project.list(),
  });

  useEffect(() => {
    if (open && initialInput && !analysis) {
      analyzeInput(initialInput);
    }
  }, [open, initialInput]);

  const analyzeInput = async (text) => {
    setIsAnalyzing(true);
    try {
      const projectNames = projects.map(p => p.name).join(", ");
      
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze this task input and suggest attributes.
        
        Input: "${text}"
        
        Available Projects: ${projectNames}
        
        Suggest:
        1. Refined Title
        2. Effort (tiny, small, medium, large)
        3. Energy (low, medium, high)
        4. Context tags (home, errands, laptop, phone, quiet, 15min, 30min, 60min, deep_work)
        5. Best matching Project Name from list (or null)
        6. A short "Why"
        
        Return JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            effort: { type: "string", enum: ["tiny", "small", "medium", "large"] },
            energy: { type: "string", enum: ["low", "medium", "high"] },
            context_tags: { type: "array", items: { type: "string" } },
            project_name: { type: "string" },
            why: { type: "string" }
          }
        }
      });
      
      // Find project ID
      const project = projects.find(p => p.name === result.project_name);
      
      setAnalysis({
        ...result,
        project_id: project ? project.id : "none"
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze task");
    }
    setIsAnalyzing(false);
  };

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['active-tasks'] });
      toast.success("Task created with smart attributes! ✨");
      handleClose();
    }
  });

  const handleSubmit = () => {
    if (!analysis) return;
    
    createMutation.mutate({
      title: analysis.title,
      why: analysis.why,
      effort: analysis.effort,
      energy: analysis.energy,
      context_tags: analysis.context_tags,
      project_id: analysis.project_id === "none" ? null : analysis.project_id,
      status: "active",
      source: "smart_add"
    });
  };

  const handleClose = () => {
    setAnalysis(null);
    setInput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-md ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            Smart Add
          </DialogTitle>
        </DialogHeader>

        {!analysis ? (
          <div className="py-8 text-center">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                <p className={isDark ? "text-slate-400" : "text-gray-500"}>Analyzing your task...</p>
              </div>
            ) : (
               <div className="space-y-4">
                 <Textarea 
                   value={input} 
                   onChange={(e) => setInput(e.target.value)}
                   placeholder="Type your task here..."
                   className={isDark ? "bg-slate-800 border-slate-700" : ""}
                 />
                 <Button onClick={() => analyzeInput(input)} disabled={!input.trim()} className="w-full plm-button-pill bg-pink-500 hover:bg-pink-600 text-white border-none">
                   Analyze
                 </Button>
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={analysis.title} 
                onChange={(e) => setAnalysis({...analysis, title: e.target.value})}
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effort</Label>
                <Select 
                  value={analysis.effort} 
                  onValueChange={(v) => setAnalysis({...analysis, effort: v})}
                >
                  <SelectTrigger className={isDark ? "bg-slate-800 border-slate-700" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiny">Tiny</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Energy</Label>
                <Select 
                  value={analysis.energy} 
                  onValueChange={(v) => setAnalysis({...analysis, energy: v})}
                >
                  <SelectTrigger className={isDark ? "bg-slate-800 border-slate-700" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select 
                value={analysis.project_id} 
                onValueChange={(v) => setAnalysis({...analysis, project_id: v})}
              >
                <SelectTrigger className={isDark ? "bg-slate-800 border-slate-700" : ""}>
                  <SelectValue placeholder="No Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Why (Purpose)</Label>
              <Input 
                value={analysis.why || ""} 
                onChange={(e) => setAnalysis({...analysis, why: e.target.value})}
                className={isDark ? "bg-slate-800 border-slate-700" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Context Tags</Label>
              <div className="flex flex-wrap gap-2">
                {analysis.context_tags?.map(tag => (
                  <span key={tag} className={`text-xs px-2 py-1 rounded-full border ${isDark ? "bg-slate-800 border-slate-600" : "bg-gray-100 border-gray-200"}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {analysis && (
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending}
              className="plm-button-pill bg-green-500 hover:bg-green-600 text-white border-none"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Confirm & Add
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}