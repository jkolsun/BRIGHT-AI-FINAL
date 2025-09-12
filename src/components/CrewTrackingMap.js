// src/components/CrewTrackingMap.js

import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const CrewTrackingMap = ({ crewMembers = [], jobs = [] }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize if we haven't already and Leaflet is available
    if (!initialized.current && window.L && mapContainerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Create unique ID for this map instance
          const mapId = `map-${Date.now()}`;
          mapContainerRef.current.id = mapId;
          
          // Initialize map
          const map = window.L.map(mapId).setView([40.7934, -77.8600], 13);
          mapRef.current = map;
          initialized.current = true;

          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add a simple marker for HQ
          const hqMarker = window.L.marker([40.7934, -77.8600]).addTo(map);
          hqMarker.bindPopup('<b>Bright.AI HQ</b><br>Operations Center');

          // Add crew markers (simple version)
          if (crewMembers.length > 0) {
            crewMembers.forEach((member, index) => {
              const lat = 40.7934 + (Math.random() - 0.5) * 0.05;
              const lng = -77.8600 + (Math.random() - 0.5) * 0.05;
              
              const marker = window.L.marker([lat, lng]).addTo(map);
              marker.bindPopup(`<b>${member.name || 'Crew Member'}</b><br>${member.team || 'Team Alpha'}`);
            });
          }

          // Add job markers (simple version)
          if (jobs.length > 0) {
            jobs.forEach((job, index) => {
              const lat = 40.7934 + (Math.random() - 0.5) * 0.08;
              const lng = -77.8600 + (Math.random() - 0.5) * 0.08;
              
              const marker = window.L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: job.status === 'Completed' ? '#10b981' : 
                          job.status === 'In Progress' ? '#3b82f6' : '#eab308',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
              }).addTo(map);
              
              marker.bindPopup(`<b>${job.customer}</b><br>${job.status}<br>${job.price || '$0'}`);
            });
          }

          // Force a resize after initialization
          setTimeout(() => {
            map.invalidateSize();
          }, 100);

        } catch (error) {
          console.error('Map initialization error:', error);
        }
      }, 500); // Longer delay to avoid conflicts

      return () => {
        clearTimeout(timer);
      };
    }
  }, []); // Only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
          initialized.current = false;
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  return (
    <div className="relative h-full min-h-[400px] rounded-xl overflow-hidden">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-slate-800" 
        style={{ minHeight: '400px' }}
      />
      
      {/* Simple Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur rounded-lg p-2 text-xs">
        <div className="text-gray-300">
          🟢 Completed • 🔵 Active • 🟡 Scheduled
        </div>
      </div>
      
      {/* Live Indicator */}
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur rounded-lg px-3 py-1 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-300">Live</span>
      </div>
    </div>
  );
};

export default CrewTrackingMap;