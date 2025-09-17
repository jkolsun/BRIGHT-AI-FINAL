// components/CrewTrackingMap.js
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Users, Clock } from 'lucide-react';

// Fix Leaflet's default icon issue with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CrewTrackingMap = ({ crews = [], jobs = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState(null);

  // Initialize map
  useEffect(() => {
    // Check if container exists and map isn't already initialized
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize the map
      const map = L.map(mapRef.current, {
        center: [40.1023, -75.2743], 
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Store map instance
      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setIsMapReady(false);
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Add markers when map is ready
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // Add crew markers
      const validCrews = crews || [];
      validCrews.forEach(crew => {
        if (crew && crew.location && crew.location.lat && crew.location.lng) {
          const crewIcon = L.divIcon({
            html: `
              <div class="crew-marker" style="
                background-color: #10b981;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            `,
            className: 'crew-marker-container',
            iconSize: [32, 32]
          });

          const marker = L.marker([crew.location.lat, crew.location.lng], { icon: crewIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="padding: 10px;">
                <strong>${crew.name}</strong><br>
                Status: ${crew.status || 'Active'}<br>
                ${crew.currentJob ? `Current Job: ${crew.currentJob}` : 'Available'}
              </div>
            `);

          marker.on('click', () => setSelectedCrew(crew));
          markersRef.current.push(marker);
        }
      });

      // Add job markers
      const validJobs = jobs || [];
      validJobs.forEach(job => {
        if (job && job.location && job.location.lat && job.location.lng) {
          const jobIcon = L.divIcon({
            html: `
              <div class="job-marker" style="
                background-color: ${job.status === 'completed' ? '#6b7280' : '#3b82f6'};
                width: 24px;
                height: 24px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            `,
            className: 'job-marker-container',
            iconSize: [24, 24]
          });

          const marker = L.marker([job.location.lat, job.location.lng], { icon: jobIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div style="padding: 10px;">
                <strong>${job.customer}</strong><br>
                ${job.address || ''}<br>
                Service: ${job.service || 'Lawn Care'}<br>
                Status: ${job.status || 'Scheduled'}
              </div>
            `);

          markersRef.current.push(marker);
        }
      });

      // Fit map to show all markers if there are any
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    } catch (error) {
      console.error('Error adding markers:', error);
    }
  }, [crews, jobs, isMapReady]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current && isMapReady) {
        setTimeout(() => {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch (error) {
            console.error('Error invalidating map size:', error);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMapReady]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Navigation className="text-blue-600" />
          Live Crew Tracking
        </h2>
        {selectedCrew && (
          <div className="text-sm text-gray-600">
            Selected: {selectedCrew.name}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-96 rounded-lg overflow-hidden border border-gray-200"
        style={{ minHeight: '400px' }}
      />

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Crew Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Active Job</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Completed Job</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-600 font-semibold">
            {crews?.filter(c => c.status === 'active').length || 0} Active Crews
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-600 font-semibold">
            {jobs?.filter(j => j.status === 'in-progress').length || 0} Jobs In Progress
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 font-semibold">
            {jobs?.filter(j => j.status === 'completed').length || 0} Completed Today
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewTrackingMap;