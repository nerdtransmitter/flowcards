const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from "@/components/ui/card";

const plan = `
# Upgrade Implementation Plan & Spec

## 1. Location-Aware Tasks & Map View 🗺️

### Data Model Changes
- **Task Entity**: Added \`location_label\`, \`address_input\`, \`lat\`, \`lng\`, \`place_id\`, \`geocode_status\`.

### API Design
- **Geocoding**: Use client-side OpenStreetMap (Nominatim) for demo/MVP to avoid API key exposure.
- **Production**: Proxy requests through a backend function \`db.backend.geocode(address)\` which calls Google Maps API using server-side secrets.
- **Keys**: Google Maps API Key stored in Backend Secrets (not exposed to client).

### UI/UX Components
- **TaskMap Page**:
  - Full-screen map using \`react-leaflet\`.
  - Pins for tasks with coordinates.
  - Color-coded markers based on urgency/status.
  - Bottom sheet/Drawer for task details when a pin is clicked.
  - "Near Me" filter using browser Geolocation API.

### Edge Cases
- **Geocoding Failures**: Fallback to storing just the address text.
- **Permission Denied**: "Near Me" feature disables gracefully if user denies location access.

---

## 2. Coaching Upgrade ("Indy" Style) 🧠

### Data Model Changes
- **CoachingSession**: Stores structured chat flows (onboarding, check-ins, stuck support).
- **CoachingInsight**: Stores longitudinal patterns detected over time.

### Coaching Flows (State Machines)
- **Morning Check-in**:
  1.  **Greeting**: "How are you feeling today?" (Mood/Energy input)
  2.  **Brain Dump**: "What's on your mind?" (Free text)
  3.  **Sort**: AI categorizes items into "Must do", "Nice to do", "Later".
  4.  **Commit**: User selects ONE highlight task.
- **Stuck Support**:
  1.  **Identify Blocker**: "What's stopping you?" (Options: Overwhelmed, Tired, Unclear, Boring)
  2.  **Micro-step**: AI suggests 3 tiny steps based on blocker type.
  3.  **Action**: User picks one and starts a 5-min timer.

### Memory Model
- **Short-term**: Context of current session.
- **Long-term**: \`CoachingInsight\` entities storing "What works for you" patterns (e.g., "You tend to focus better in the mornings with music").

---

## 3. Dark Mode Fix 🌙

### Design System Updates
- **Global Variables**: Ensure \`--background\`, \`--foreground\`, \`--card\`, etc., are strictly used.
- **Components**: Audit \`TaskCard\`, \`Sidebar\`, \`Dialog\`s to remove hardcoded hex values (except for specific brand colors like the PLM pink).
- **Map Style**: Use a dark-themed tile layer for Leaflet when in dark mode (e.g., CartoDB Dark Matter).

### Accessibility
- Ensure contrast ratios > 4.5:1 for text.
- Visible focus rings for keyboard navigation.

---

## Acceptance Criteria (Definition of Done)
- [ ] Task Entity supports location data.
- [ ] Map View displays tasks with coordinates.
- [ ] Coaching flows ("Check-in", "Stuck") are implemented as structured interactions.
- [ ] Dark mode works consistently across all new and existing screens.
- [ ] No API keys are exposed in client-side code.
`;

export default function UpgradePlan() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="plm-card p-6">
        <CardContent>
          <ReactMarkdown className="prose dark:prose-invert max-w-none">
            {plan}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </div>
  );
}