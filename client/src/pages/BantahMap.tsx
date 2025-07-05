import React from 'react';
import { MapPin } from 'lucide-react';

// Dummy user data for demo
const users = [
  { id: 1, name: 'Marcus', avatar: '/avatar.svg', lat: 37.7749, lng: -122.4194 }, // SF
  { id: 2, name: 'Ada', avatar: '/avatar.svg', lat: 51.5074, lng: -0.1278 }, // London
  { id: 3, name: 'Chidi', avatar: '/avatar.svg', lat: 6.5244, lng: 3.3792 }, // Lagos
  { id: 4, name: 'Sofia', avatar: '/avatar.svg', lat: 48.8566, lng: 2.3522 }, // Paris
];

const BantahMap: React.FC = () => {
  // In production, use a real map library (Mapbox, Google Maps, Leaflet)
  // Here, just a placeholder SVG world map with avatars
  return (
    <div className="min-h-screen bg-[#1a1b2e] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <MapPin className="w-7 h-7 text-[#CCFF00]" /> Bantah Map
      </h1>
      <div className="relative w-[90vw] max-w-3xl h-[60vw] max-h-[500px] bg-blue-100 rounded-2xl overflow-hidden shadow-lg">
        {/* Placeholder world map SVG */}
        <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full">
          <rect width="1000" height="500" fill="#e0e7ef" />
          {/* ...could add continents here... */}
        </svg>
        {/* User avatars as map pins (absolute positioning for demo) */}
        {users.map((user, idx) => {
          // Fake projection: lat/lng to x/y (not accurate, just for demo)
          const x = 1000 * ((user.lng + 180) / 360);
          const y = 500 * (1 - (user.lat + 90) / 180);
          return (
            <div
              key={user.id}
              className="absolute flex flex-col items-center"
              style={{ left: x - 20, top: y - 40 }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border-4 border-[#CCFF00] shadow-lg bg-white"
                title={user.name}
              />
              <span className="text-xs text-black bg-white/80 rounded px-1 mt-1 shadow">{user.name}</span>
            </div>
          );
        })}
      </div>
      <p className="text-white/70 mt-6">See where Bantah users are around the world! (Demo)</p>
    </div>
  );
};

export default BantahMap;
