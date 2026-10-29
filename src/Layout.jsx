const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { createPageUrl } from "@/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Zap,
  Inbox,
  FolderKanban,
  Archive,
  Settings,
  MessageCircle,
  Calendar,
  Clock,
  BookOpen,
  Trophy,
  Info,
  Moon,
  Sun,
  LogOut,
  Search,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlobalSearch from "@/components/common/GlobalSearch";
import FloatingAIButton from "@/components/common/FloatingAIButton";
import FloatingTimer from "@/components/timers/FloatingTimer";
import { UndoProvider } from "@/components/common/UndoManager";

// PLM Palette override
const paletteColors = {
  coral: { primary: "#FF66B2", secondary: "#ffffff", accent: "#FFB6C1" }, // Pink focus
  ocean: { primary: "#FF66B2", secondary: "#ffffff", accent: "#FFB6C1" },
  forest: { primary: "#FF66B2", secondary: "#ffffff", accent: "#FFB6C1" },
  sunset: { primary: "#FF66B2", secondary: "#ffffff", accent: "#FFB6C1" },
  lavender: { primary: "#FF66B2", secondary: "#ffffff", accent: "#FFB6C1" },
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [isDark, setIsDark] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await db.auth.me();
        setUser(userData);
        setIsDark(userData.theme === "dark");
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();

    const interval = setInterval(loadUser, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    // Force PLM pink aesthetic regardless of palette choice for now
    document.documentElement.style.setProperty('--primary-color', "#FF66B2");
    document.documentElement.style.setProperty('--secondary-color', "#FFB6C1");
    document.documentElement.style.setProperty('--accent-color', "#FFF0F5");
  }, [user?.color_palette]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
                      document.activeElement?.isContentEditable;

      // Global shortcuts (work everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      if (e.key === 'Escape') {
        setShowSearch(false);
        return;
      }

      // Non-typing shortcuts
      if (!isTyping) {
        // Quick Capture
        if (e.altKey && e.code === 'Space') {
          e.preventDefault();
          navigate(createPageUrl('BrainDump'));
          return;
        }

        // Add to Time Block
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('openTimeBlockDialog'));
          return;
        }

        // View switching
        if ((e.metaKey || e.ctrlKey)) {
          switch(e.key) {
            case '1':
              e.preventDefault();
              navigate(createPageUrl('FocusNow'));
              break;
            case '2':
              e.preventDefault();
              navigate(createPageUrl('BrainDump'));
              break;
            case '3':
              e.preventDefault();
              navigate(createPageUrl('Projects'));
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleTheme = async () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    await db.auth.updateMe({ theme: newTheme });
  };

  const handleLogout = () => {
    db.auth.logout();
  };

  const menuItems = [
    { title: "Focus Now", icon: Zap, path: "FocusNow", shortcut: "⌘1" },
    { title: "Brain Dump", icon: Inbox, path: "BrainDump", shortcut: "⌘2" },
    { title: "Projects", icon: FolderKanban, path: "Projects", shortcut: "⌘3" },
    { title: "Shelf", icon: Archive, path: "Shelf" },
    { title: "Time Blocks", icon: Calendar, path: "TimeBlocks" },
    { title: "Time Tracking", icon: Clock, path: "TimeTracking" },
    { title: "Logbook", icon: BookOpen, path: "Logbook" },
    { title: "Done Gallery", icon: Trophy, path: "DoneGallery" },
    { title: "Coaching", icon: MessageCircle, path: "Coaching" },
    { title: "Task Map", icon: MapPin, path: "TaskMap" },
    { title: "Upgrade Spec", icon: FileText, path: "UpgradePlan" },
    { title: "About", icon: Info, path: "About" },
  ];

  const currentPath = location.pathname.split('/').pop();

  return (
    <UndoProvider>
      <SidebarProvider>
        <div className={`min-h-screen flex w-full ${
          isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
        }`}>
        <style>
          {`
            :root {
              --primary-color: #FF66B2;
              --secondary-color: #FFB6C1;
              --accent-color: #FFF0F5;
            }

            /* Focus ring styling for accessibility */
            *:focus-visible {
              outline: 2px solid #000;
              outline-offset: 2px;
            }

            .bg-plm-grid {
              background-color: #ffffff;
              background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
              background-size: 24px 24px;
            }

            .bg-plm-pink-grid {
              background-color: #FFC0CB;
              background-image: linear-gradient(#ff9eb5 1px, transparent 1px), linear-gradient(90deg, #ff9eb5 1px, transparent 1px);
              background-size: 24px 24px;
            }

            .plm-button-pill {
              border-radius: 9999px;
              border: 2px solid black;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              transition: all 0.2s;
            }
            .plm-button-pill:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 0 0 black;
            }
            .plm-button-pill:active {
              transform: translateY(0);
              box-shadow: none;
            }

            .plm-card-dashed {
              border: 2px dashed black;
              border-radius: 1.5rem;
              background-color: white;
            }
            `}
            </style>

        <Sidebar className={`${
          isDark ? 'bg-slate-800 border-r-2 border-slate-700' : 'bg-white border-r-2 border-black'
        } hidden md:block w-64`}>
          <SidebarContent className="p-0">
            <SidebarGroup>
              <div className={`p-6 border-b-2 ${isDark ? 'border-slate-700' : 'border-black'}`}>
                <SidebarGroupLabel className={`text-3xl font-serif-display font-black tracking-tight italic flex items-center justify-between p-0 ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  <span>Flowcards</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(true)}
                    className="hover:bg-transparent"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </SidebarGroupLabel>
              </div>
              <SidebarGroupContent className="p-4">
                <SidebarMenu className="gap-2">
                  {menuItems.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => navigate(createPageUrl(item.path))}
                          className={`flex items-center justify-between p-3 border-2 font-bold transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${
                            isActive 
                              ? 'bg-pink-400 text-white border-black' 
                              : isDark
                                ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                                : 'bg-white border-black text-black hover:bg-pink-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" strokeWidth={2.5} />
                            <span className="uppercase tracking-tight text-sm">{item.title}</span>
                          </div>
                          {item.shortcut && (
                            <Badge variant="outline" className={`text-[10px] border-black bg-white text-black font-bold px-1.5`}>
                              {item.shortcut}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className={`p-4 space-y-2 border-t-2 ${
            isDark ? 'border-slate-700' : 'border-black'
          }`}>
            <Button
              variant="outline"
              onClick={toggleTheme}
              className={`w-full justify-start gap-3 border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${
                isDark ? 'text-slate-300 bg-slate-800' : 'bg-white text-black'
              }`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? 'LIGHT MODE' : 'DARK MODE'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Settings'))}
              className={`w-full justify-start gap-3 border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${
                isDark ? 'text-slate-300 bg-slate-800' : 'bg-white text-black'
              }`}
            >
              <Settings className="w-5 h-5" />
              SETTINGS
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className={`w-full justify-start gap-3 border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none ${
                isDark ? 'text-slate-300 bg-slate-800' : 'bg-white text-black'
              }`}
            >
              <LogOut className="w-5 h-5" />
              LOGOUT
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <div className={`md:hidden flex items-center justify-between p-4 border-b-2 ${
            isDark ? 'border-slate-700' : 'border-black'
          }`}>
            <SidebarTrigger aria-label="Toggle menu" />
            <h1 className="font-serif-display font-black text-2xl italic tracking-tight">Flowcards</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          <main className="flex-1 overflow-auto" role="main">
            {children}
          </main>
        </div>

        <GlobalSearch 
          open={showSearch} 
          onClose={() => setShowSearch(false)}
          user={user}
          isDark={isDark}
        />

        <FloatingAIButton 
          user={user}
          isDark={isDark}
          currentPage={currentPath}
        />

        <FloatingTimer 
          user={user}
          isDark={isDark}
        />
        </div>
        </SidebarProvider>
        </UndoProvider>
        );
}