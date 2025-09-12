import React from 'react';
import { Camera, X } from 'lucide-react';

const JobCamera = ({ onCapture, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Capture Property</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="h-64 bg-gray-200 rounded flex items-center justify-center mb-4">
          <Camera size={48} className="text-gray-400" />
        </div>
        <button 
          onClick={() => onCapture('photo_data')}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Capture Photo
        </button>
      </div>
    </div>
  );
};

export default JobCamera;