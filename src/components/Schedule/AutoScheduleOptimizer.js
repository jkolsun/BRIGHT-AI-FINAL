// components/Schedule/AutoScheduleOptimizer.js
/**
 * Enhanced Auto Schedule Optimizer Component
 * Integrates with AdvancedRouteOptimizer for morning/afternoon crew routing
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Clock, Users, TrendingUp, 
  Navigation, AlertCircle, CheckCircle, RefreshCw,
  Truck, DollarSign, Zap, Map, Play, Upload,
  FileText, AlertTriangle, Sun, Sunset, Home,
  ArrowRight, ArrowLeft, BarChart
} from 'lucide-react';
import AdvancedRouteOptimizer from '../../services/ai/advancedRouteOptimizer';
import { OpenAIService } from '../../services/ai/openai';
import { supabase } from '../../services/database/supabase';
import n8nAutomation from '../../services/automation/n8n';

const AutoScheduleOptimizer = () => {
  const [jobs, setJobs] = useState([]);
  const [crews, setCrews] = useState([]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [activeView, setActiveView] = useState('current');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [homeBase, setHomeBase] = useState({
    lat: 40.1023,
    lng: -75.2743,
    address: 'Company HQ'
  });
  const [metrics, setMetrics] = useState({
    currentDistance: 0,
    optimizedDistance: 0,
    timeSaved: 0,
    fuelSaved: 0,
    costSaved: 0,
    morningUtilization: 0,
    afternoonUtilization: 0
  });

  const routeOptimizer = new AdvancedRouteOptimizer();
  const ai = new OpenAIService();

  // Load data on component mount
  useEffect(() => {
    loadScheduleData();
    loadHomeBase();
  }, [selectedDate]);

  const loadHomeBase = async () => {
    // Try to load home base from company settings
    try {
      const companyData = await supabase.fetchData('companies');
      if (companyData && companyData[0]) {
        setHomeBase({
          lat: companyData[0].lat || 40.1023,
          lng: companyData[0].lng || -75.2743,
          address: companyData[0].address || 'Company HQ'
        });
      }
    } catch (error) {
      console.error('Error loading home base:', error);
    }
  };

  const loadScheduleData = async () => {
    setLoading(true);
    setDataError(null);
    
    try {
      // Fetch jobs for selected date
      const jobsData = await supabase.fetchData('jobs');
      const crewsData = await supabase.fetchData('crew_members');
      
      // Filter for selected date's pending jobs
      const dateJobs = jobsData?.filter(job => {
        const jobDate = job.scheduled_date || job.date;
        return (jobDate === selectedDate || !jobDate) && 
               (job.status === 'pending' || job.status === 'scheduled');
      }) || [];
      
      if (dateJobs.length === 0) {
        setDataError('no-jobs');
        setJobs([]);
      } else {
        // Ensure jobs have required fields
        const validJobs = dateJobs.map(job => ({
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
        // Enrich crew data with shift preferences
        const enrichedCrews = crewsData.map((crew, index) => ({
          ...crew,
          shift: crew.shift || (index < crewsData.length / 2 ? 'morning' : 'afternoon')
        }));
        setCrews(enrichedCrews);
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
      console.log('🚀 Starting advanced route optimization...');
      
      // Use the new AdvancedRouteOptimizer
      const results = await routeOptimizer.optimizeCrewRoutes(
        jobs,
        crews,
        new Date(selectedDate)
      );
      
      if (results.success) {
        setOptimizationResults(results);
        
        // Update metrics display
        setMetrics({
          currentDistance: parseFloat(results.metrics.totalDistance) + parseFloat(results.metrics.distanceSaved),
          optimizedDistance: parseFloat(results.metrics.totalDistance),
          timeSaved: results.metrics.estimatedTimeSaved,
          fuelSaved: parseFloat(results.metrics.estimatedFuelSaved),
          costSaved: parseFloat(results.metrics.estimatedCostSaved),
          morningUtilization: results.metrics.morningCrewUtilization,
          afternoonUtilization: results.metrics.afternoonCrewUtilization
        });
        
        setActiveView('optimized');
        
        // Show success notification
        console.log('✅ Optimization complete!', results.metrics);
      } else {
        throw new Error(results.error || 'Optimization failed');
      }
      
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
      // Save optimization to database
      await routeOptimizer.saveOptimization(optimizationResults);
      
      // Update local state
      const updatedJobs = [];
      
      [...optimizationResults.morning, ...optimizationResults.afternoon].forEach(route => {
        route.jobs.forEach(job => {
          updatedJobs.push(job);
        });
      });
      
      setJobs(updatedJobs);
      setActiveView('current');
      
      alert('✅ Schedule optimization applied successfully!');
      
      // Notify crews of updated schedules
      await notifyCrews(optimizationResults);
      
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      alert('Failed to save optimization. Please try again.');
    }
  };

  const notifyCrews = async (results) => {
    // Send notifications to crews about their optimized routes
    for (const route of [...results.morning, ...results.afternoon]) {
      // In production, send actual notifications via SMS/push
      console.log(`Notifying ${route.crew} of ${route.totalJobs} jobs in ${route.shift} shift`);
    }
  };

  // Component for displaying individual routes
  const RouteCard = ({ route, shift }) => {
    const shiftIcon = shift === 'morning' ? <Sun /> : <Sunset />;
    const shiftColor = shift === 'morning' ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-200';
    
    return (
      <div className={`rounded-lg border p-6 ${shiftColor}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {shiftIcon}
            <h3 className="text-lg font-semibold">{route.crew}</h3>
          </div>
          <span className="text-sm font-medium">
            {route.totalJobs} jobs | {route.totalDistance} miles
          </span>
        </div>
        
        <div className="space-y-3">
          {route.jobs.map((job, index) => (
            <div key={job.id} className="bg-white rounded p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {job.orderInRoute}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{job.customer}</p>
                      <p className="text-sm text-gray-600">{job.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{job.estimatedArrival}</p>
                      <p className="text-xs text-gray-500">{job.duration} min</p>
                    </div>
                  </div>
                  
                  {index < route.jobs.length - 1 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Navigation size={12} />
                      <span>{job.travelTime} min travel to next</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show optimization insight for this job */}
              {shift === 'morning' && index === 0 && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                  <ArrowLeft size={12} className="inline mr-1" />
                  Starting farthest from base - working back
                </div>
              )}
              
              {shift === 'afternoon' && index === 0 && (
                <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-800">
                  <Home size={12} className="inline mr-1" />
                  Starting near base - working outward
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Route summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Route Efficiency</span>
            <span className="font-semibold text-green-600">{route.efficiency}%</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Est. Complete</span>
            <span className="font-medium">{route.estimatedEnd}</span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-green-600" size={48} />
        <span className="ml-3 text-lg">Loading schedule data...</span>
      </div>
    );
  }

  // Main render
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="text-green-600" />
          AI Schedule Optimizer
        </h1>
        <p className="text-gray-600 mt-2">
          Intelligent route optimization with morning/afternoon crew management
        </p>
      </div>

      {/* Date Selector and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home size={16} />
              <span>{homeBase.address}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            {activeView === 'current' ? (
              <button
                onClick={optimizeSchedule}
                disabled={optimizing || jobs.length === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {optimizing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Optimize Routes
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveView('current')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyOptimization}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  Apply Optimization
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error States */}
      {dataError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900">
                {dataError === 'no-jobs' ? 'No Jobs Scheduled' :
                 dataError === 'no-crews' ? 'No Crews Available' :
                 'Error Loading Data'}
              </h3>
              <p className="text-yellow-700 mt-1">
                {dataError === 'no-jobs' ? 'Import jobs or create new ones to start optimizing.' :
                 dataError === 'no-crews' ? 'Add crew members to optimize routes.' :
                 'Please refresh and try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Metrics */}
      {optimizationResults && activeView === 'optimized' && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart size={24} />
            Optimization Results
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold">{metrics.timeSaved}</div>
              <div className="text-sm opacity-90">Minutes Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.optimizedDistance}</div>
              <div className="text-sm opacity-90">Total Miles</div>
            </div>
            <div>
              <div className="text-3xl font-bold">${metrics.costSaved}</div>
              <div className="text-sm opacity-90">Fuel Cost Saved</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {optimizationResults.metrics.percentImprovement}%
              </div>
              <div className="text-sm opacity-90">More Efficient</div>
            </div>
          </div>
          
          {/* Crew Utilization */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sun size={16} />
                  <span className="text-sm font-medium">Morning Crews</span>
                </div>
                <div className="text-2xl font-bold">{metrics.morningUtilization}%</div>
                <div className="text-xs opacity-75">Utilization</div>
              </div>
              <div className="bg-white/10 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sunset size={16} />
                  <span className="text-sm font-medium">Afternoon Crews</span>
                </div>
                <div className="text-2xl font-bold">{metrics.afternoonUtilization}%</div>
                <div className="text-xs opacity-75">Utilization</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routes Display */}
      {optimizationResults && activeView === 'optimized' && (
        <div className="space-y-6">
          {/* Morning Routes */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sun className="text-yellow-500" />
              Morning Routes (Far → Near)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {optimizationResults.morning.map((route, index) => (
                <RouteCard key={index} route={route} shift="morning" />
              ))}
            </div>
          </div>

          {/* Afternoon Routes */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sunset className="text-purple-500" />
              Afternoon Routes (Near → Far)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {optimizationResults.afternoon.map((route, index) => (
                <RouteCard key={index} route={route} shift="afternoon" />
              ))}
            </div>
          </div>

          {/* Unassigned Jobs */}
          {optimizationResults.unassignedJobs && optimizationResults.unassignedJobs.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">
                Unassigned Jobs ({optimizationResults.unassignedJobs.length})
              </h3>
              <p className="text-red-700 mb-3">
                These jobs couldn't be fit into today's schedule. Consider adding more crews or rescheduling.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {optimizationResults.unassignedJobs.map(job => (
                  <div key={job.id} className="bg-white p-3 rounded border border-red-200">
                    <p className="font-medium">{job.customer}</p>
                    <p className="text-sm text-gray-600">{job.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {optimizationResults.insights && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Zap className="text-blue-600" size={20} />
                AI Optimization Insights
              </h3>
              <ul className="space-y-2">
                {optimizationResults.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="text-blue-800">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Current Schedule View */}
      {activeView === 'current' && jobs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {crews.map(crew => {
            const crewJobs = jobs.filter(job => 
              job.assignedCrew === crew.id || job.assignedCrew === crew.name
            );
            
            return (
              <div key={crew.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="text-blue-600" size={20} />
                  {crew.name}
                  <span className="text-sm text-gray-500 ml-auto">
                    {crewJobs.length} jobs
                  </span>
                </h3>
                
                {crewJobs.length === 0 ? (
                  <p className="text-gray-500 italic">No jobs assigned</p>
                ) : (
                  <div className="space-y-3">
                    {crewJobs.map(job => (
                      <div key={job.id} className="border rounded p-3 hover:bg-gray-50">
                        <p className="font-medium">{job.customer}</p>
                        <p className="text-sm text-gray-600">{job.address}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            job.priority === 'high' ? 'bg-red-100 text-red-700' :
                            job.priority === 'normal' ? 'bg-gray-100 text-gray-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {job.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {job.duration} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutoScheduleOptimizer;