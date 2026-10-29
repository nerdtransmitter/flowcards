const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function GoogleCalendarIntegration({ user, isDark, onEventsChange }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Check if Google Calendar is connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!user) return;
      
      try {
        // Check if user has Google Calendar connected
        const hasToken = user.google_calendar_connected || false;
        setIsConnected(hasToken);
        setIsEnabled(hasToken && (user.google_calendar_enabled !== false));
      } catch (error) {
        console.error('Failed to check Google Calendar connection:', error);
      }
    };
    
    checkConnection();
  }, [user]);

  // Fetch Google Calendar events
  const { data: calendarEvents = [], isLoading } = useQuery({
    queryKey: ['google-calendar-events', user?.email, isEnabled],
    queryFn: async () => {
      if (!isEnabled || !isConnected || !user) return [];
      
      try {
        // This would call a backend function that fetches from Google Calendar API
        // For now, return empty array - requires backend functions to be enabled
        toast.info('Google Calendar integration requires backend functions');
        return [];
        
        /* 
        When backend functions are enabled, this would work:
        const result = await db.functions.invoke('getGoogleCalendarEvents', {
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        return result.events || [];
        */
      } catch (error) {
        console.error('Failed to fetch Google Calendar events:', error);
        return [];
      }
    },
    enabled: isEnabled && isConnected,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (onEventsChange) {
      onEventsChange(isEnabled ? calendarEvents : []);
    }
  }, [calendarEvents, isEnabled, onEventsChange]);

  const handleConnect = async () => {
    toast.info('Google Calendar integration requires backend functions to be enabled', {
      description: 'Enable backend functions in app settings to use this feature'
    });
    
    /* 
    When backend functions are enabled:
    try {
      const authUrl = await db.connectors.getAuthorizationUrl('googlecalendar');
      window.location.href = authUrl;
    } catch (error) {
      toast.error('Failed to connect Google Calendar');
    }
    */
  };

  const handleToggle = async (enabled) => {
    setIsEnabled(enabled);
    if (user) {
      try {
        await db.auth.updateMe({ google_calendar_enabled: enabled });
        toast.success(enabled ? 'Google Calendar overlay enabled' : 'Google Calendar overlay disabled');
      } catch (error) {
        toast.error('Failed to update settings');
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <Calendar className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
      
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          Connect Google Calendar
        </Button>
      ) : (
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <Label className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Show Google Calendar
            </Label>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              Read-only overlay
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      )}
      
      {isLoading && isEnabled && (
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      )}
    </div>
  );
}