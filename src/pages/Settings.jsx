const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Palette, Download, Upload, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const colorPalettes = [
  { id: "coral", name: "Coral Sunset", colors: ["#FF6B6B", "#4ECDC4", "#FFD3B6"] },
  { id: "ocean", name: "Ocean Breeze", colors: ["#4A90E2", "#50E3C2", "#B8E6F0"] },
  { id: "lavender", name: "Lavender Dream", colors: ["#9B6FD6", "#C7CEEA", "#E8D5F2"] },
  { id: "mint", name: "Mint Fresh", colors: ["#2ECC71", "#B8E0D2", "#D5F4E6"] },
  { id: "sunset", name: "Warm Sunset", colors: ["#FF8C42", "#FF6F61", "#FFEAA7"] },
  { id: "forest", name: "Forest Green", colors: ["#27AE60", "#52B788", "#B7E4C7"] }
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const isDark = user?.theme === "dark";

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const updateSetting = async (field, value) => {
    setSaving(true);
    await db.auth.updateMe({ [field]: value });
    const updated = await db.auth.me();
    setUser(updated);
    setSaving(false);
    toast.success('Settings updated');
  };

  const handleExport = async () => {
    const tasks = await db.entities.Task.filter({ created_by: user.email });
    const projects = await db.entities.Project.filter({ created_by: user.email });
    const timeEntries = await db.entities.TimeEntry.filter({ created_by: user.email });
    
    const exportData = {
      tasks,
      projects,
      timeEntries,
      exported_at: new Date().toISOString(),
      user_email: user.email,
      version: "1.4"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowcards-export-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Data exported successfully');
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      let data;
      
      // Check if it's CSV (Notion export) or JSON (Flowcards export)
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        data = { tasks: [], projects: [] };
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const task = {};
          
          headers.forEach((header, idx) => {
            if (values[idx] !== undefined) { // Ensure value exists for the header
              task[header] = values[idx];
            }
          });
          
          // Map Notion fields to Flowcards fields
          const flowcardTask = {
            title: task['Name'] || task['Task'] || task['Title'] || '',
            notes: task['Notes'] || task['Description'] || '',
            status: task['Status']?.toLowerCase() === 'done' ? 'done' : 'active',
            effort: 'small', // Default
            source: 'import'
          };
          
          if (flowcardTask.title) {
            data.tasks.push(flowcardTask);
          }
        }
      } else {
        // Parse JSON
        data = JSON.parse(text);
      }

      let importedTasksCount = 0;
      let importedProjectsCount = 0;

      // Import tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          const { id, created_date, updated_date, created_by, ...taskData } = task;
          await db.entities.Task.create(taskData);
          importedTasksCount++;
        }
      }

      // Import projects
      if (data.projects && Array.isArray(data.projects)) {
        for (const project of data.projects) {
          const { id, created_date, updated_date, created_by, ...projectData } = project;
          await db.entities.Project.create(projectData);
          importedProjectsCount++;
        }
      }

      toast.success(`Import completed! Imported ${importedTasksCount} tasks and ${importedProjectsCount} projects.`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data. Please check the file format and ensure it\'s valid JSON or CSV.');
    }
    setImporting(false);
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen p-4 md:p-8 ${
      isDark ? 'bg-slate-900' : 'bg-plm-grid'
    }`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className={`w-8 h-8 ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <h1 className={`text-5xl font-serif-display font-black tracking-tight italic ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              Settings
            </h1>
          </div>
          <p className={`text-lg ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Customize your Flowcards experience
          </p>
        </motion.div>

        {/* Appearance */}
        <Card className={`border-2 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Appearance
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className={isDark ? 'text-slate-300' : ''}>
                Color Palette {saving && <span className="text-xs text-gray-500">(Updating...)</span>}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {colorPalettes.map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => updateSetting('color_palette', palette.id)}
                    disabled={saving}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      user.color_palette === palette.id
                        ? 'border-purple-500 ring-2 ring-purple-200 scale-105'
                        : isDark
                          ? 'border-slate-600 hover:border-slate-500'
                          : 'border-gray-200 hover:border-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex gap-1 mb-2">
                      {palette.colors.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className={`text-sm font-medium ${
                      isDark ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      {palette.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className={isDark ? 'text-slate-300' : ''}>
                Show emoji icons
              </Label>
              <Switch
                checked={user.show_emoji}
                onCheckedChange={(checked) => updateSetting('show_emoji', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className={isDark ? 'text-slate-300' : ''}>
                Show context chips
              </Label>
              <Switch
                checked={user.show_context_chips}
                onCheckedChange={(checked) => updateSetting('show_context_chips', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Focus Preferences */}
        <Card className={`border-2 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'
        }`}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Focus Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={isDark ? 'text-slate-300' : ''}>
                Max tasks in Focus Now
              </Label>
              <Select
                value={String(user.max_surfaced)}
                onValueChange={(value) => updateSetting('max_surfaced', Number(value))}
              >
                <SelectTrigger className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 task</SelectItem>
                  <SelectItem value="2">2 tasks</SelectItem>
                  <SelectItem value="3">3 tasks (recommended)</SelectItem>
                  <SelectItem value="5">5 tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-slate-300' : ''}>
                  Pomodoro work duration (min)
                </Label>
                <Input
                  type="number"
                  value={user.pomodoro_work_minutes}
                  onChange={(e) => updateSetting('pomodoro_work_minutes', Number(e.target.value))}
                  className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className={isDark ? 'text-slate-300' : ''}>
                  Pomodoro break duration (min)
                </Label>
                <Input
                  type="number"
                  value={user.pomodoro_break_minutes}
                  onChange={(e) => updateSetting('pomodoro_break_minutes', Number(e.target.value))}
                  className={isDark ? 'bg-slate-900 border-slate-600 text-white' : ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className={`border-2 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Notifications
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className={isDark ? 'text-slate-300' : ''}>
                Push notifications
              </Label>
              <Switch
                checked={user.notification_push}
                onCheckedChange={(checked) => updateSetting('notification_push', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className={isDark ? 'text-slate-300' : ''}>
                SMS reminders
              </Label>
              <Switch
                checked={user.notification_sms}
                onCheckedChange={(checked) => updateSetting('notification_sms', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className={`border-2 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'
        }`}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button
                onClick={handleExport}
                variant="outline"
                className={`plm-button-pill w-full justify-center bg-white text-black hover:bg-gray-100 border-black ${
                  isDark ? 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700' : ''
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data (JSON)
              </Button>
              <p className={`text-sm mt-2 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Download all your tasks, projects, and time entries
              </p>
            </div>

            <div>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => document.getElementById('import-file').click()}
                variant="outline"
                disabled={importing}
                className={`plm-button-pill w-full justify-center bg-white text-black hover:bg-gray-100 border-black ${
                  isDark ? 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700' : ''
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import Data (JSON/CSV)'}
              </Button>
              <p className={`text-sm mt-2 ${
                isDark ? 'text-slate-400' : 'text-gray-500'
              }`}>
                Import tasks from Flowcards export or Notion CSV
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}