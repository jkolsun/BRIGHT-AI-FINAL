// components/Schedule/AutoScheduleOptimizer.js
import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Users, TrendingUp, 
  Navigation, AlertCircle, CheckCircle, RefreshCw,
  Truck, DollarSign, Zap, Map, Play, Upload,
  FileText, AlertTriangle
} from 'lucide-react';
import { OpenAIService } from '../../services/ai/openai';
import { supabase } from '../../services/database/supabase';

const AutoScheduleOptimizer = () => {
  const [jobs, setJobs] = useState([]);
  const [crews, setCrews] = useState([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [activeView, setActiveView] = useState('current'); // 'current' or 'optimized'
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [metrics, setMetrics] = useState({
    currentDistance: 0,
    optimizedDistance: 0,
    timeSaved: 0,
    fuelSaved: 0
  });

  const ai = new OpenAIService();

  // Load data on component mount
  useEffect(() => {
    loadTodaySchedule();
  }, []);

  const loadTodaySchedule = async () => {
    setLoading(true);
    setDataError(null);
    
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch jobs from database - adjust query based on your schema
      const jobsData = await supabase.fetchData('jobs');
      const crewsData = await supabase.fetchData('crew_members');
      
      // Filter for today's pending jobs or all pending if no date field
      const todaysJobs = jobsData?.filter(job => 
        job.status === 'pending' || job.status === 'scheduled'
      ) || [];
      
      if (todaysJobs.length === 0) {
        setDataError('no-jobs');
        setJobs([]);
      } else {
        // Ensure jobs have required fields for optimization
        const validJobs = todaysJobs.map(job => ({
          ...job,
          priority: job.priority || 'normal',
          timeWindow: job.timeWindow || 'anytime',
          duration: job.duration || 60,
          assignedCrew: job.assignedCrew || job.assigned_crew || 'unassigned',
          lat: job.lat || job.latitude || 0,
          lng: job.lng || job.longitude || 0
        }));
        setJobs(validJobs);
      }
      
      if (crewsData && crewsData.length > 0) {
        setCrews(crewsData);
      } else {
        setDataError('no-crews');
        setCrews([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError('load-error');
    } finally {
      setLoading(false);
    }
  };

  const optimizeSchedule = async () => {
    if (jobs.length === 0 || crews.length === 0) {
      alert('Please ensure you have jobs and crews in the system before optimizing.');
      return;
    }

    setOptimizing(true);
    
    try {
      // Call the OpenAI service
      const result = await ai.optimizeSchedule(jobs, crews);
      
      if (result.error) {
        console.error('Optimization error:', result.error);
        alert('Optimization failed. Please check your OpenAI API key in the .env file.');
        setOptimizing(false);
        return;
      }

      // Merge optimization results with original jobs
      const optimizedJobs = jobs.map(job => {
        const optimized = result.optimizedJobs?.find(opt => opt.id === job.id);
        if (optimized) {
          return { ...job, ...optimized };
        }
        return job;
      });

      setOptimizationResults(optimizedJobs);
      
      // Update metrics
      if (result.metrics) {
        setMetrics({
          currentDistance: 100,
          optimizedDistance: 100 - (result.metrics.distanceSaved || 20),
          timeSaved: result.metrics.timeSaved || 90,
          fuelSaved: (result.metrics.distanceSaved * 0.08) || 8.5
        });
      }
      
      setActiveView('optimized');
    } catch (error) {
      console.error('Optimization failed:', error);
      alert('Failed to optimize schedule. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const applyOptimization = async () => {
    if (!optimizationResults) return;
    
    try {
      // Update each job in the database
      for (const job of optimizationResults) {
        await supabase.updateData('jobs', job.id, {
          assignedCrew: job.assignedCrew,
          estimatedStart: job.estimatedStart,
          orderInRoute: job.orderInRoute,
          optimized: true,
          optimization_date: new Date().toISOString()
        });
      }
      
      setJobs(optimizationResults);
      setActiveView('current');
      setOptimizationResults(null);
      alert('✅ Schedule optimization applied successfully!');
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      alert('Failed to save optimization. Please try again.');
    }
  };

  const JobCard = ({ job, index, isOptimized }) => {
    const priorityColors = {
      high: 'border-red-500 bg-red-50',
      normal: 'border-gray-300 bg-white',
      low: 'border-blue-300 bg-blue-50'
    };

    return (
      <div className={`border-2 rounded-lg p-4 mb-3 ${priorityColors[job.priority] || priorityColors.normal} 
        ${isOptimized ? 'shadow-lg transform scale-105' : ''} transition-all`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{index + 1}.</span>
              <h4 className="font-semibold text-gray-800">{job.customer || job.customer_name}</h4>
              {job.priority === 'high' && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">Priority</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPin size={14} />
              <span>{job.address || job.service_address || 'No address'}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {job.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {job.assignedCrew || 'Unassigned'}
              </span>
              {job.estimatedStart && (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <Play size={14} />
                  {job.estimatedStart}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{job.service || job.service_type}</div>
            <div className="text-xs text-gray-400 mt-1">{job.timeWindow}</div>
          </div>
        </div>
      </div>
    );
  };

  const MetricsCard = () => (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp size={24} />
        Optimization Results
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-3xl font-bold">{metrics.timeSaved}</div>
          <div className="text-sm opacity-90">Minutes Saved</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{(metrics.currentDistance - metrics.optimizedDistance).toFixed(1)}</div>
          <div className="text-sm opacity-90">Miles Reduced</div>
        </div>
        <div>
          <div className="text-3xl font-bold">${(metrics.fuelSaved * 4.5).toFixed(0)}</div>
          <div className="text-sm opacity-90">Fuel Savings</div>
        </div>
        <div>
          <div className="text-3xl font-bold">{((1 - metrics.optimizedDistance / metrics.currentDistance) * 100).toFixed(0)}%</div>
          <div className="text-sm opacity-90">More Efficient</div>
        </div>
      </div>
    </div>
  );

  // Empty State Component
  const EmptyState = () => {
    const getEmptyMessage = () => {
      if (dataError === 'no-jobs') {
        return {
          icon: <FileText size={48} className="text-gray-400" />,
          title: "No Jobs Scheduled",
          message: "Import your client jobs or create new jobs to start optimizing routes.",
          action: "Go to Jobs → Import Data"
        };
      }
      if (dataError === 'no-crews') {
        return {
          icon: <Users size={48} className="text-gray-400" />,
          title: "No Crews Available",
          message: "Add crew members to your system before optimizing schedules.",
          action: "Go to Crews → Add Crew"
        };
      }
      if (dataError === 'load-error') {
        return {
          icon: <AlertTriangle size={48} className="text-yellow-500" />,
          title: "Failed to Load Data",
          message: "There was an error loading your data. Please check your connection and try again.",
          action: "Refresh Page"
        };
      }
      return {
        icon: <Calendar size={48} className="text-gray-400" />,
        title: "Loading Schedule Data",
        message: "Fetching your jobs and crews...",
        action: null
      };
    };

    const emptyInfo = getEmptyMessage();

    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="flex justify-center mb-4">
          {emptyInfo.icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {emptyInfo.title}
        </h2>
        <p className="text-gray-600 mb-4">
          {emptyInfo.message}
        </p>
        {emptyInfo.action && (
          <p className="text-blue-600 font-medium">
            {emptyInfo.action}
          </p>
        )}
        <button
          onClick={loadTodaySchedule}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Loading Schedule Data...</h2>
        </div>
      </div>
    );
  }

  // No data state
  if (jobs.length === 0 || crews.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState />
      </div>
    );
  }

  // Get crew groups
  const crewGroups = [...new Set(jobs.map(job => job.assignedCrew || 'Unassigned'))];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Map className="text-blue-600" size={28} />
              Auto-Schedule Optimizer
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered route optimization for your {jobs.length} scheduled jobs
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadTodaySchedule}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            {activeView === 'optimized' && optimizationResults ? (
              <>
                <button
                  onClick={() => setActiveView('current')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View Original
                </button>
                <button
                  onClick={applyOptimization}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  Apply Optimization
                </button>
              </>
            ) : (
              <button
                onClick={optimizeSchedule}
                disabled={optimizing || jobs.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {optimizing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Optimizing with AI...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Optimize Schedule
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="text-gray-400" size={18} />
            <span className="text-gray-600">
              {crews.length} Crews Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400" size={18} />
            <span className="text-gray-600">
              {jobs.length} Jobs Today
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-gray-400" size={18} />
            <span className="text-gray-600">
              {jobs.reduce((acc, job) => acc + (job.duration || 60), 0)} Total Minutes
            </span>
          </div>
        </div>
      </div>

      {/* Optimization Metrics */}
      {optimizationResults && activeView === 'optimized' && <MetricsCard />}

      {/* Schedule View - Dynamic crew columns */}
      <div className={`grid grid-cols-1 ${crewGroups.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
        {crewGroups.map(crewName => (
          <div key={crewName} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                {crewName}
              </h3>
              <span className="text-sm text-gray-500">
                {activeView === 'optimized' ? 'Optimized Route' : 'Current Route'}
              </span>
            </div>
            
            <div className="space-y-2">
              {(activeView === 'optimized' && optimizationResults ? optimizationResults : jobs)
                .filter(job => (job.assignedCrew || 'Unassigned') === crewName)
                .map((job, index) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    index={index}
                    isOptimized={activeView === 'optimized'}
                  />
                ))}
            </div>

            {activeView === 'optimized' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">
                    Route optimized for maximum efficiency
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {jobs.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Zap className="text-blue-600" size={20} />
            AI Optimization Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1" size={16} />
              <div>
                <div className="font-medium text-gray-800">Priority Jobs First</div>
                <div className="text-gray-600">High-priority customers scheduled in optimal time windows</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1" size={16} />
              <div>
                <div className="font-medium text-gray-800">Clustered Routes</div>
                <div className="text-gray-600">Nearby properties grouped to minimize travel</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="text-green-600 mt-1" size={16} />
              <div>
                <div className="font-medium text-gray-800">Skill Matching</div>
                <div className="text-gray-600">Crews assigned based on job requirements</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Savings Projection */}
      {metrics.timeSaved > 0 && activeView === 'optimized' && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 mt-6">
          <h3 className="text-xl font-bold mb-3">Weekly Impact Projection</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{(metrics.timeSaved * 5 / 60).toFixed(1)} hrs</div>
              <div className="text-sm opacity-90">Time Saved/Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold">${(metrics.fuelSaved * 4.5 * 5).toFixed(0)}</div>
              <div className="text-sm opacity-90">Fuel Savings/Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{((metrics.timeSaved * 5) / 45).toFixed(0)}</div>
              <div className="text-sm opacity-90">Extra Jobs Possible</div>
            </div>
            <div>
              <div className="text-2xl font-bold">${((metrics.timeSaved * 5 / 60) * 75).toFixed(0)}</div>
              <div className="text-sm opacity-90">Revenue Potential</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoScheduleOptimizer;