const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Plus, Target } from "lucide-react";
import { motion } from "framer-motion";
import ProjectCard from "../components/projects/ProjectCard";
import CreateProjectDialog from "../components/projects/CreateProjectDialog";

export default function Projects() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.Project.filter({ 
        status: 'active',
        created_by: user.email 
      }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks', user?.email],
    queryFn: () => {
      if (!user) return [];
      return db.entities.Task.filter({ 
        status: 'active',
        created_by: user.email 
      });
    },
    enabled: !!user,
  });

  const getProjectTasks = (projectId) => {
    return tasks.filter(t => t.project_id === projectId);
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban className={`w-10 h-10 ${
                isDark ? 'text-pink-400' : 'text-pink-500'
              }`} />
              <h1 className={`text-6xl font-serif-display font-black tracking-tight italic ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                Projects
              </h1>
            </div>
            <p className={`text-xl font-bold bg-pink-100 inline-block px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1 ${
              isDark ? 'text-black' : 'text-black'
            }`}>
              Your meaningful work, organized by area
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="plm-button-pill bg-pink-500 text-white hover:bg-pink-600 border-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-64 rounded-2xl animate-pulse ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className={`border-2 text-center py-16 ${
            isDark 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white/80 backdrop-blur-sm border-green-100'
          }`}>
            <CardContent>
              <Target className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-slate-600' : 'text-gray-300'
              }`} />
              <p className={`text-xl font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                No projects yet
              </p>
              <p className={`mb-6 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Create your first project to group related tasks
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="plm-button-pill bg-[#dcfce7] text-black hover:bg-[#bbf7d0]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={getProjectTasks(project.id).length}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        <CreateProjectDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          isDark={isDark}
        />
      </div>
    </div>
  );
}