const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Target, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TaskCard from "../components/tasks/TaskCard";
import CreateTaskDialog from "../components/tasks/CreateTaskDialog";
import EditProjectDialog from "../components/projects/EditProjectDialog";

export default function ProjectDetail() {
  const [user, setUser] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setProjectId(id);
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId, user?.email],
    queryFn: async () => {
      if (!projectId || !user) return null;
      const projects = await db.entities.Project.filter({
        id: projectId,
        created_by: user.email
      });
      return projects[0] || null;
    },
    enabled: !!projectId && !!user,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', projectId, user?.email],
    queryFn: async () => {
      if (!projectId || !user) return [];
      return db.entities.Task.filter({
        project_id: projectId,
        status: 'active',
        created_by: user.email
      }, '-created_date');
    },
    enabled: !!projectId && !!user,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (task) => {
      await db.entities.Task.update(task.id, {
        status: 'done',
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['focus-now-tasks'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id) => {
      await db.entities.Project.delete(id);
    },
    onSuccess: () => {
      navigate(createPageUrl("Projects"));
    },
  });

  if (projectLoading || !project) {
    return (
      <div className={`min-h-screen p-4 md:p-8 flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Loading project...
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
    }`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Projects"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <Card className={`border-2 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-100'
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {project.emoji && (
                      <span className="text-4xl">{project.emoji}</span>
                    )}
                    <div>
                      <h1 className={`text-3xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {project.name}
                      </h1>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm border ${
                        areaColors[project.area]
                      }`}>
                        {project.area}
                      </span>
                    </div>
                  </div>

                  {project.north_star && (
                    <div className={`flex items-start gap-2 p-4 rounded-lg mb-4 ${
                      isDark ? 'bg-slate-700/50' : 'bg-green-50'
                    }`}>
                      <Target className={`w-5 h-5 mt-0.5 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <p className={`text-lg font-medium ${
                        isDark ? 'text-slate-200' : 'text-gray-900'
                      }`}>
                        {project.north_star}
                      </p>
                    </div>
                  )}

                  {project.description && (
                    <p className={`text-base ${
                      isDark ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {project.description}
                    </p>
                  )}

                  {project.outcomes && project.outcomes.length > 0 && (
                    <div className="mt-4">
                      <h3 className={`font-semibold mb-2 ${
                        isDark ? 'text-slate-200' : 'text-gray-900'
                      }`}>
                        Desired Outcomes
                      </h3>
                      <ul className="space-y-2">
                        {project.outcomes.map((outcome, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={`mt-1 ${
                              isDark ? 'text-green-400' : 'text-green-600'
                            }`}>
                              ✓
                            </span>
                            <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>
                              {outcome}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowEditProject(true)}
                    className={isDark ? 'border-slate-600 hover:bg-slate-700' : ''}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this project? Tasks will not be deleted.')) {
                        deleteProjectMutation.mutate(project.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Tasks ({tasks.length})
          </h2>
          <Button
            onClick={() => setShowCreateTask(true)}
            className="bg-gradient-to-r from-green-500 to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {tasksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-48 rounded-2xl animate-pulse ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className={`border-2 text-center py-16 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-green-100'
          }`}>
            <CardContent>
              <Target className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-slate-600' : 'text-gray-300'
              }`} />
              <p className={`text-xl font-medium mb-2 ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                No tasks yet
              </p>
              <p className={`mb-6 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Add your first task to get started on this project
              </p>
              <Button
                onClick={() => setShowCreateTask(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTaskMutation.mutate}
                onExpand={(t) => setExpandedTask(expandedTask?.id === t.id ? null : t)}
                expanded={expandedTask?.id === task.id}
                showContextChips={user?.show_context_chips}
                isDark={isDark}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['project-tasks'] })}
              />
            ))}
          </div>
        )}

        <CreateTaskDialog
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          projectId={projectId}
          isDark={isDark}
        />

        <EditProjectDialog
          open={showEditProject}
          onClose={() => setShowEditProject(false)}
          project={project}
          isDark={isDark}
        />
      </div>
    </div>
  );
}