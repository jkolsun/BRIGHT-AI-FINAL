import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';

const WeatherWidget = ({ jobs }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Weather Intelligence</h3>
      <div className="flex items-center gap-4">
        <Cloud size={48} />
        <div>
          <div className="text-2xl font-bold">72°F</div>
          <div className="text-sm opacity-90">Partly Cloudy</div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-white/20 rounded">
        <p className="text-sm">⚠️ Rain expected at 3 PM</p>
      </div>
    </div>
  );
};

export default WeatherWidget;