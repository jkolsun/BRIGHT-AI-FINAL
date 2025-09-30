import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Repeat, Edit, Save, X, Plus, 
  ChevronDown, ChevronRight, Settings, Users, 
  Home, DollarSign, CheckCircle, AlertCircle,
  Trash2, Copy, MapPin, Phone, RefreshCw
} from 'lucide-react';

const RecurringJobsManager = ({ supabase }) => {
  const [jobs, setJobs] = useState([]);
  const [expandedJob, setExpandedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Fetch actual jobs from Supabase
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch all jobs from your Supabase database
      const jobsData = await supabase.fetchData('jobs');
      
      // Process the jobs to add recurrence data if it exists
      const processedJobs = jobsData.map(job => ({
        ...job,
        // Check if job already has recurrence settings
        recurrence: job.recurrence || 'once',
        dayOfWeek: job.day_of_week || getDayFromDate(job.date),
        startDate: job.start_date || job.date,
        endDate: job.end_date || null,
        duration: job.duration || 60,
        active: job.status !== 'cancelled' && job.status !== 'completed'
      }));
      
      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayFromDate = (dateString) => {
    if (!dateString) return 'monday';
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const saveRecurrenceSettings = async (jobId, settings) => {
    setSaving(true);
    try {
      // Update the job in Supabase with recurrence settings
      await supabase.updateData('jobs', jobId, {
        recurrence: settings.recurrence,
        day_of_week: settings.dayOfWeek,
        start_date: settings.startDate,
        end_date: settings.endDate,
        duration: settings.duration
      });

      // If setting to recurring, create future job instances
      if (settings.recurrence !== 'once') {
        await createFutureJobs(jobId, settings);
      }

      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, ...settings }
          : job
      ));

      alert('✅ Recurrence settings saved!');
    } catch (error) {
      console.error('Error saving recurrence:', error);
      alert('❌ Failed to save settings');
    } finally {
      setSaving(false);
      setExpandedJob(null);
    }
  };

  const createFutureJobs = async (originalJobId, settings) => {
    const originalJob = jobs.find(j => j.id === originalJobId);
    if (!originalJob) return;

    const futureJobs = [];
    const startDate = new Date(settings.startDate);
    const endDate = settings.endDate ? new Date(settings.endDate) : null;
    
    // Calculate how many instances to create (max 12 weeks ahead)
    const weeksAhead = settings.recurrence === 'weekly' ? 12 : 
                       settings.recurrence === 'biweekly' ? 6 : 
                       settings.recurrence === 'monthly' ? 3 : 1;
    
    for (let i = 1; i <= weeksAhead; i++) {
      let nextDate = new Date(startDate);
      
      if (settings.recurrence === 'weekly') {
        nextDate.setDate(nextDate.getDate() + (i * 7));
      } else if (settings.recurrence === 'biweekly') {
        nextDate.setDate(nextDate.getDate() + (i * 14));
      } else if (settings.recurrence === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + i);
      }
      
      // Don't create jobs past end date
      if (endDate && nextDate > endDate) break;
      
      // Don't create if job already exists for that date
      const dateStr = nextDate.toISOString().split('T')[0];
      const exists = jobs.some(j => 
        j.customer === originalJob.customer && 
        j.date === dateStr
      );
      
      if (!exists) {
        futureJobs.push({
          customer: originalJob.customer,
          address: originalJob.address,
          phone: originalJob.phone || originalJob.customer_phone,
          type: originalJob.type || originalJob.service,
          service: originalJob.service || originalJob.type,
          date: dateStr,
          status: 'scheduled',
          price: originalJob.price,
          crew: originalJob.crew,
          recurring_parent_id: originalJobId,
          recurrence: settings.recurrence,
          day_of_week: settings.dayOfWeek,
          ai_scheduled: false
        });
      }
    }
    
    // Batch insert future jobs
    if (futureJobs.length > 0) {
      for (const job of futureJobs) {
        await supabase.insertData('jobs', job);
      }
      console.log(`Created ${futureJobs.length} future job instances`);
    }
  };

  const applyBulkRecurrence = async () => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs first');
      return;
    }
    
    const recurrence = prompt('Enter recurrence (weekly/biweekly/monthly):');
    if (!recurrence) return;
    
    setSaving(true);
    for (const jobId of selectedJobs) {
      const job = jobs.find(j => j.id === jobId);
      await saveRecurrenceSettings(jobId, {
        recurrence: recurrence,
        dayOfWeek: getDayFromDate(job.date),
        startDate: job.date,
        endDate: null,
        duration: job.duration || 60
      });
    }
    setSaving(false);
    setSelectedJobs([]);
    fetchJobs(); // Refresh the list
  };

  const recurrenceOptions = [
    { value: 'once', label: 'One Time', color: 'bg-gray-100' },
    { value: 'weekly', label: 'Weekly', color: 'bg-green-100' },
    { value: 'biweekly', label: 'Bi-Weekly', color: 'bg-blue-100' },
    { value: 'monthly', label: 'Monthly', color: 'bg-purple-100' },
    { value: 'seasonal', label: 'Seasonal', color: 'bg-orange-100' }
  ];

  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const JobRow = ({ job }) => {
    const [editing, setEditing] = useState(false);
    const [editedSettings, setEditedSettings] = useState({
      recurrence: job.recurrence || 'once',
      dayOfWeek: job.dayOfWeek || 'monday',
      startDate: job.startDate || job.date,
      endDate: job.endDate || '',
      duration: job.duration || 60
    });

    const isExpanded = expandedJob === job.id;
    const recurrenceInfo = recurrenceOptions.find(r => r.value === job.recurrence) || recurrenceOptions[0];

    return (
      <div className="border rounded-lg mb-2 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedJob(isExpanded ? null : job.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedJobs.includes(job.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedJobs(prev => 
                    e.target.checked 
                      ? [...prev, job.id]
                      : prev.filter(id => id !== job.id)
                  );
                }}
                className="w-4 h-4"
              />
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <div>
                <div className="font-semibold text-gray-800">{job.customer}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin size={14} />
                  {job.address}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${recurrenceInfo.color}`}>
                <Repeat size={12} className="inline mr-1" />
                {recurrenceInfo.label}
              </span>
              <span className="text-sm text-gray-600">
                {job.date ? new Date(job.date).toLocaleDateString() : 'No date'}
              </span>
              <span className="font-medium text-green-600">
                ${job.price || '0'}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t">
            <div className="pt-4">
              {!editing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Service:</span>
                      <div className="font-medium">{job.service || job.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Crew:</span>
                      <div className="font-medium">{job.crew || 'Unassigned'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Phone size={12} />
                        {job.phone || job.customer_phone || 'No phone'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">{job.duration || 60} min</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Set Recurrence
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recurrence Pattern
                      </label>
                      <select
                        value={editedSettings.recurrence}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          recurrence: e.target.value
                        }))}
                        className="w-full p-2 border rounded-lg"
                      >
                        {recurrenceOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editedSettings.recurrence !== 'once' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Day of Week
                        </label>
                        <select
                          value={editedSettings.dayOfWeek}
                          onChange={(e) => setEditedSettings(prev => ({
                            ...prev,
                            dayOfWeek: e.target.value
                          }))}
                          className="w-full p-2 border rounded-lg"
                        >
                          {dayOptions.map(day => (
                            <option key={day.toLowerCase()} value={day.toLowerCase()}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editedSettings.startDate}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>

                    {editedSettings.recurrence !== 'once' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={editedSettings.endDate}
                          onChange={(e) => setEditedSettings(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                          className="w-full p-2 border rounded-lg"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={editedSettings.duration}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          duration: parseInt(e.target.value)
                        }))}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await saveRecurrenceSettings(job.id, editedSettings);
                        setEditing(false);
                      }}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save & Generate Schedule
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(false);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>

                  {editedSettings.recurrence !== 'once' && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <AlertCircle size={14} className="inline mr-1" />
                        This will create {editedSettings.recurrence} jobs for the next 
                        {editedSettings.recurrence === 'weekly' ? ' 12 weeks' : 
                         editedSettings.recurrence === 'biweekly' ? ' 6 occurrences' : 
                         ' 3 months'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
        <p>Loading jobs from database...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Repeat className="text-blue-600" />
              Recurring Jobs Manager
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Set up recurring schedules for regular customers
            </p>
          </div>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setFilterStatus('recurring')}
              className={`px-3 py-1 rounded-lg ${
                filterStatus === 'recurring' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Recurring ({jobs.filter(j => j.recurrence && j.recurrence !== 'once').length})
            </button>
            <button
              onClick={() => setFilterStatus('once')}
              className={`px-3 py-1 rounded-lg ${
                filterStatus === 'once' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              One-time ({jobs.filter(j => !j.recurrence || j.recurrence === 'once').length})
            </button>
          </div>

          {selectedJobs.length > 0 && (
            <button
              onClick={applyBulkRecurrence}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Settings size={16} />
              Set Recurrence for {selectedJobs.length} selected
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {jobs
          .filter(job => {
            if (filterStatus === 'all') return true;
            if (filterStatus === 'recurring') return job.recurrence && job.recurrence !== 'once';
            if (filterStatus === 'once') return !job.recurrence || job.recurrence === 'once';
            return true;
          })
          .map(job => (
            <JobRow key={job.id} job={job} />
          ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">No jobs found in database</p>
          <p className="text-sm text-gray-500 mt-2">
            Import jobs or create new ones to see them here
          </p>
        </div>
      )}
    </div>
  );
};

export default RecurringJobsManager;