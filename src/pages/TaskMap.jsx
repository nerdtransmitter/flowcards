const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation, MapPin, List, Plus } from "lucide-react";
import TaskCard from '@/components/tasks/TaskCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

// Custom Marker Icon since default Leaflet icons often have issues in bundlers
const createIcon = (color = '#FF66B2') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 drop-shadow-md"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position} icon={createIcon('#3b82f6')}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function TaskMap() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await db.auth.me();
      setUser(userData);
      setIsDark(userData?.theme === 'dark');
    };
    loadUser();
  }, []);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['map-tasks', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allTasks = await db.entities.Task.filter({
        status: 'active',
        created_by: user.email
      });
      // Filter for tasks with location
      return allTasks.filter(t => t.lat && t.lng);
    },
    enabled: !!user,
  });

  const mapStyle = {
    height: '100%',
    width: '100%',
    zIndex: 0
  };

  const tileLayerUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-plm-grid">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen w-full relative flex flex-col md:flex-row">
       {/* Sidebar / List View Overlay on Mobile */}
      <div className={`absolute top-4 left-4 z-10 md:static md:w-96 md:h-full md:border-r-2 md:border-black p-4 flex flex-col gap-4 ${
        isDark ? 'bg-slate-900/90 md:bg-slate-900' : 'bg-white/90 md:bg-white'
      } backdrop-blur-sm md:backdrop-blur-none rounded-xl md:rounded-none shadow-xl md:shadow-none max-h-[40vh] md:max-h-full overflow-y-auto w-[calc(100%-2rem)]`}>
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-serif-display font-black italic">Task Map</h1>
           <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('FocusNow'))}>
             <List className="w-4 h-4" />
           </Button>
        </div>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 opacity-60">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p>No tasks with location found.</p>
            <Button className="mt-4 plm-button" onClick={() => toast.info("Edit a task to add a location!")}>
              Add Location to Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="cursor-pointer hover:opacity-80 transition-opacity">
                <TaskCard task={task} compact={true} isDark={isDark} showContextChips={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 h-full relative">
        <MapContainer 
          center={[51.505, -0.09]} 
          zoom={13} 
          style={mapStyle}
          zoomControl={false}
        >
          <TileLayer
            attribution={attribution}
            url={tileLayerUrl}
          />
          
          <LocationMarker />

          {tasks.map(task => (
            <Marker 
              key={task.id} 
              position={[task.lat, task.lng]}
              icon={createIcon(task.is_important ? '#ef4444' : '#FF66B2')}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold">{task.title}</h3>
                  <p className="text-sm opacity-80">{task.location_label || task.address_input}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
          <Button 
            className="plm-button rounded-full w-12 h-12 p-0 bg-white text-black hover:bg-gray-100"
            onClick={() => {
              // Trigger geolocation
              const map = document.querySelector('.leaflet-container')?._leaflet_map;
              if (map) map.locate({setView: true, maxZoom: 16});
            }}
          >
            <Navigation className="w-5 h-5" />
          </Button>
          <Button 
            className="plm-button rounded-full w-12 h-12 p-0 bg-pink-500 text-white hover:bg-pink-600"
            onClick={() => navigate(createPageUrl('BrainDump'))}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}