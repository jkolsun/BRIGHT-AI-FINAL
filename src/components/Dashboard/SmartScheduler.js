import React from 'react';
import { Calendar, Clock } from 'lucide-react';

const SmartScheduler = ({ jobs, onJobUpdate }) => {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Calendar size={18} />
        AI-Optimized Schedule
      </h3>
      <div className="space-y-2">
        {jobs.slice(0, 5).map(job => (
          <div key={job.id} className="border rounded p-3 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{job.customer}</h4>
                <p className="text-sm text-gray-600">{job.type}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartScheduler;