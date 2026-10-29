import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const areaColors = {
  apartment: "bg-blue-100 text-blue-800 border-blue-200",
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  health: "bg-green-100 text-green-800 border-green-200",
  career: "bg-orange-100 text-orange-800 border-orange-200",
  learning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  creative: "bg-pink-100 text-pink-800 border-pink-200",
  social: "bg-indigo-100 text-indigo-800 border-indigo-200",
  misc: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function ProjectCard({ project, taskCount = 0, isDark = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`${createPageUrl("ProjectDetail")}?id=${project.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        onClick={handleClick}
        className={`plm-card cursor-pointer group hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              {project.emoji && (
                <span className="text-3xl">{project.emoji}</span>
              )}
              <h3 className={`text-2xl font-serif-display font-black italic tracking-tight ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {project.name}
              </h3>
            </div>
            <ArrowRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`} />
          </div>
          
          <Badge variant="outline" className={areaColors[project.area]}>
            {project.area}
          </Badge>
          
          {project.north_star && (
            <div className={`flex items-start gap-2 p-3 rounded-lg mt-3 ${
              isDark ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <span className="text-lg">🌟</span>
              <p className={`text-sm font-medium ${
                isDark ? 'text-slate-200' : 'text-gray-700'
              }`}>
                {project.north_star}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {project.description && (
            <p className={`text-sm ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {project.description}
            </p>
          )}

          {project.outcomes && project.outcomes.length > 0 && (
            <div className="space-y-2">
              <p className={`text-xs font-medium ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Outcomes
              </p>
              {project.outcomes.slice(0, 3).map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Circle className={`w-3 h-3 mt-1 shrink-0 ${
                    isDark ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <span className={`text-sm ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-2 pt-3 border-t ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${
              isDark ? 'text-slate-400' : 'text-gray-400'
            }`} />
            <span className={`text-sm ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {taskCount} active {taskCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}