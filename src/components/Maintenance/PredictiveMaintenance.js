// components/Maintenance/PredictiveMaintenance.js
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, DollarSign, Users, 
  Clock, AlertTriangle, CheckCircle, RefreshCw,
  Send, Bot, Bell, BarChart3, Target,
  Repeat, TreePine, Droplets, Scissors,
  ChevronRight, Mail, Phone, Plus, Wifi, WifiOff
} from 'lucide-react';
import { OpenAIService } from '../../services/ai/openai';
import { supabase } from '../../services/database/supabase';
import n8nAutomation from '../../services/automation/n8n';

const PredictiveMaintenance = () => {
  const [properties, setProperties] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState({ healthy: null, message: '' });
  const [processingBatch, setProcessingBatch] = useState(false);
  const [stats, setStats] = useState({
    propertiesMonitored: 0,
    maintenanceDue: 0,
    revenueProjected: 0,
    customersNotified: 0,
    jobsAutoCreated: 0,
    churnPrevented: 0
  });

  const ai = new OpenAIService();

  // Initial load and webhook health check
  useEffect(() => {
    analyzeMaintenanceNeeds();
    checkWebhookHealth();
  }, []);

  // Check N8N webhook health
  const checkWebhookHealth = async () => {
    const health = await n8nAutomation.checkHealth();
    setWebhookStatus(health);
    if (!health.healthy) {
      console.warn('N8N webhook is not healthy:', health.message);
    }
  };

  // Real-time updates - refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const checkForNewJobs = setInterval(() => {
      analyzeMaintenanceNeeds(true); // true = silent refresh (no loading state)
      console.log('Auto-refreshing maintenance data...');
    }, 30000); // 30 seconds
    
    return () => clearInterval(checkForNewJobs);
  }, [autoRefresh]);

  // Check for customer responses and new confirmations
  useEffect(() => {
    const checkCustomerResponses = setInterval(async () => {
      try {
        const messages = await supabase.fetchData('messages');
        const recentMessages = messages.filter(msg => {
          const msgDate = new Date(msg.created_at || msg.sent_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
          return msgDate > fiveMinutesAgo;
        });
        
        if (recentMessages.length > 0) {
          console.log(`Found ${recentMessages.length} recent messages`);
          
          // Process each message through N8N
          for (const message of recentMessages) {
            if (!message.processed) {
              const result = await n8nAutomation.processCustomerResponse(message);
              
              if (result.success || result.fallbackProcessing) {
                console.log(`Processed message with intent: ${result.intent}`);
                
                // Mark message as processed
                await supabase.updateData('messages', message.id, { 
                  processed: true,
                  intent: result.intent 
                });
              }
            }
          }
          
          // Refresh to show any new auto-created jobs
          analyzeMaintenanceNeeds(true);
        }
      } catch (error) {
        console.error('Error checking messages:', error);
      }
    }, 15000); // Check every 15 seconds for customer responses
    
    return () => clearInterval(checkCustomerResponses);
  }, []);

  // Periodic webhook health check
  useEffect(() => {
    const healthCheck = setInterval(checkWebhookHealth, 60000); // Every minute
    return () => clearInterval(healthCheck);
  }, []);

  // Main function to analyze maintenance patterns
  const analyzeMaintenanceNeeds = async (silentRefresh = false) => {
    if (!silentRefresh) setLoading(true);
    
    try {
      // Fetch all jobs to analyze patterns
      const jobsData = await supabase.fetchData('jobs');
      
      if (!jobsData || jobsData.length === 0) {
        setLoading(false);
        return;
      }
      
      // Group jobs by customer/property
      const customerHistory = {};
      jobsData.forEach(job => {
        const key = job.customer || job.customer_name || 'Unknown';
        if (!customerHistory[key]) {
          customerHistory[key] = {
            customer: key,
            address: job.address || 'No address',
            phone: job.phone || job.customer_phone || 'No phone',
            jobs: [],
            lastService: null,
            frequency: null,
            services: new Set()
          };
        }
        customerHistory[key].jobs.push(job);
        customerHistory[key].services.add(job.service || job.type || 'Lawn Maintenance');
        
        // Track last service date
        const jobDate = new Date(job.date || job.created_at);
        if (!customerHistory[key].lastService || jobDate > customerHistory[key].lastService) {
          customerHistory[key].lastService = jobDate;
        }
      });

      // Analyze patterns and predict needs
      const newPredictions = [];
      const newUpcoming = [];
      
      Object.values(customerHistory).forEach(property => {
        if (property.jobs.length > 0) {
          // Calculate average frequency between services
          const serviceDates = property.jobs
            .map(j => new Date(j.date || j.created_at))
            .sort((a, b) => a - b);
          
          let avgDaysBetween = 14; // Default bi-weekly
          if (serviceDates.length > 1) {
            let totalDays = 0;
            for (let i = 1; i < serviceDates.length; i++) {
              const daysDiff = Math.floor((serviceDates[i] - serviceDates[i-1]) / (1000 * 60 * 60 * 24));
              totalDays += daysDiff;
            }
            avgDaysBetween = Math.round(totalDays / (serviceDates.length - 1));
          }
          
          // Predict next service date
          const daysSinceLastService = Math.floor(
            (new Date() - property.lastService) / (1000 * 60 * 60 * 24)
          );
          const daysUntilNext = avgDaysBetween - daysSinceLastService;
          const nextServiceDate = new Date();
          nextServiceDate.setDate(nextServiceDate.getDate() + daysUntilNext);
          
          // Determine service type based on history
          const mostCommonService = Array.from(property.services)[0] || 'Lawn Maintenance';
          
          // Calculate confidence score
          const confidence = Math.min(95, 50 + (property.jobs.length * 10));
          
          // Determine risk level
          let risk = 'low';
          if (daysUntilNext < 0) risk = 'high';
          else if (daysUntilNext < 7) risk = 'medium';
          
          const prediction = {
            customer: property.customer,
            address: property.address,
            phone: property.phone,
            lastService: property.lastService,
            nextService: nextServiceDate,
            nextServiceDate: nextServiceDate.toISOString(),
            daysUntilNext: daysUntilNext,
            frequency: avgDaysBetween,
            service: mostCommonService,
            type: mostCommonService,
            confidence: confidence,
            risk: risk,
            revenue: 150, // Default price
            jobCount: property.jobs.length
          };
          
          newPredictions.push(prediction);
          
          // Add to upcoming if due soon
          if (daysUntilNext <= 14 && daysUntilNext >= -7) {
            newUpcoming.push(prediction);
          }
        }
      });
      
      // Sort by urgency
      newPredictions.sort((a, b) => a.daysUntilNext - b.daysUntilNext);
      newUpcoming.sort((a, b) => a.daysUntilNext - b.daysUntilNext);
      
      setPredictions(newPredictions);
      setUpcomingMaintenance(newUpcoming);
      setProperties(Object.values(customerHistory));
      setLastUpdated(new Date());
      
      // Update stats
      setStats({
        propertiesMonitored: Object.keys(customerHistory).length,
        maintenanceDue: newUpcoming.filter(p => p.daysUntilNext <= 0).length,
        revenueProjected: newUpcoming.reduce((sum, p) => sum + p.revenue, 0),
        customersNotified: stats.customersNotified, // Keep existing count
        jobsAutoCreated: stats.jobsAutoCreated, // Keep existing count
        churnPrevented: newPredictions.filter(p => p.risk === 'high').length
      });
      
    } catch (error) {
      console.error('Error analyzing maintenance needs:', error);
    } finally {
      if (!silentRefresh) setLoading(false);
    }
  };

  // Test webhook integration with enhanced error handling
  const testWebhookIntegration = async () => {
    try {
      const testMessage = {
        content: 'YES',
        from_phone: '610-555-' + Math.floor(Math.random() * 9000 + 1000),
        customer: 'Test Customer ' + new Date().getTime()
      };
      
      // Use n8n service with error handling
      const result = await n8nAutomation.processCustomerResponse(testMessage);
      
      if (result.success) {
        alert(`✅ Test successful! Intent detected: ${result.intent}. Check Supabase for the new job.`);
      } else if (result.fallbackProcessing) {
        alert(`⚠️ N8N is down but local processing worked. Intent: ${result.intent}`);
      } else {
        alert(`❌ Test failed: ${result.error}`);
      }
      
      setTimeout(() => analyzeMaintenanceNeeds(), 2000); // Refresh after 2 seconds
    } catch (error) {
      console.error('Webhook test error:', error);
      alert('❌ Error testing webhook: ' + error.message);
    }
  };

  // Create a new maintenance job
  const createMaintenanceJob = async (prediction) => {
    try {
      const newJob = {
        customer: prediction.customer,
        address: prediction.address,
        phone: prediction.phone,
        type: prediction.service, // Changed from 'service' to 'type'
        date: prediction.nextService.toISOString().split('T')[0],
        status: 'scheduled',
        price: `$${prediction.revenue}`,
        crew: 'Team Alpha',
        ai_scheduled: true
      };
      
      await supabase.insertData('jobs', newJob);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        jobsAutoCreated: prev.jobsAutoCreated + 1
      }));
      
      // Remove from upcoming list
      setUpcomingMaintenance(prev => prev.filter(p => p.customer !== prediction.customer));
      
      alert(`✅ Job created for ${prediction.customer} on ${prediction.nextService.toLocaleDateString()}`);
      
      // Refresh data after creating job
      setTimeout(() => analyzeMaintenanceNeeds(true), 1000);
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    }
  };

  // Send notification to customer using N8N
  const notifyCustomer = async (prediction) => {
    try {
      // First save to messages table
      const message = {
        to_phone: prediction.phone,
        to_name: prediction.customer,
        content: `Hi ${prediction.customer}! It's time for your regular ${prediction.service}. 
                  We have an opening ${prediction.nextService.toLocaleDateString()}. 
                  Reply YES to confirm or call us to reschedule.`,
        type: 'maintenance_reminder',
        related_property: prediction.address,
        sent_at: new Date().toISOString()
      };
      
      await supabase.insertData('messages', message);
      
      // Then trigger N8N workflow for SMS
      const n8nResult = await n8nAutomation.triggerMaintenanceWorkflow({
        customers: [prediction]
      });
      
      if (n8nResult.success) {
        console.log('N8N workflow triggered successfully');
        alert(`📱 Message sent to ${prediction.customer} via N8N`);
      } else {
        console.error('N8N failed:', n8nResult.error);
        alert(`📱 Message saved locally. N8N error: ${n8nResult.error}`);
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        customersNotified: prev.customersNotified + 1
      }));
      
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  // Batch notify all overdue customers
  const notifyAllOverdue = async () => {
    const overdue = upcomingMaintenance.filter(p => p.daysUntilNext <= 0);
    
    if (overdue.length === 0) {
      alert('No overdue customers to notify');
      return;
    }
    
    setProcessingBatch(true);
    
    try {
      // Use batch processing from n8n service
      const results = await n8nAutomation.batchProcessMaintenance(overdue, 5);
      
      alert(`✅ Processed ${results.totalProcessed} customers
        Successful: ${results.successful.length}
        Failed: ${results.failed.length}`);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        customersNotified: prev.customersNotified + results.successful.length
      }));
      
    } catch (error) {
      console.error('Batch notification error:', error);
      alert('Failed to process batch notifications');
    } finally {
      setProcessingBatch(false);
    }
  };

  // Auto schedule all overdue maintenance
  const autoScheduleAll = async () => {
    if (!autoSchedule) return;
    
    const overdue = upcomingMaintenance.filter(p => p.daysUntilNext <= 0);
    
    if (overdue.length === 0) {
      alert('No overdue maintenance to schedule');
      return;
    }
    
    for (const prediction of overdue) {
      await createMaintenanceJob(prediction);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between creates
    }
    
    alert(`✅ Created ${overdue.length} maintenance jobs`);
    analyzeMaintenanceNeeds(); // Refresh data
  };

  // Get icon for service type
  const getServiceIcon = (service) => {
    if (!service) return <TreePine className="text-green-500" size={16} />;
    
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('mow') || serviceLower.includes('lawn')) {
      return <TreePine className="text-green-500" size={16} />;
    }
    if (serviceLower.includes('trim') || serviceLower.includes('hedge')) {
      return <Scissors className="text-orange-500" size={16} />;
    }
    if (serviceLower.includes('water') || serviceLower.includes('irrigat')) {
      return <Droplets className="text-blue-500" size={16} />;
    }
    return <TreePine className="text-green-500" size={16} />;
  };

  // Get risk level color
  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  // Get data for selected timeframe
  const getTimeframeData = () => {
    let filtered = predictions;
    
    switch(selectedTimeframe) {
      case 'week':
        filtered = predictions.filter(p => p.daysUntilNext <= 7 && p.daysUntilNext >= -7);
        break;
      case 'month':
        filtered = predictions.filter(p => p.daysUntilNext <= 30 && p.daysUntilNext >= -30);
        break;
      case 'quarter':
        filtered = predictions.filter(p => p.daysUntilNext <= 90 && p.daysUntilNext >= -30);
        break;
      default:
        break;
    }
    
    return {
      total: filtered.length,
      overdue: filtered.filter(p => p.daysUntilNext < 0).length,
      upcoming: filtered.filter(p => p.daysUntilNext >= 0 && p.daysUntilNext <= 7).length,
      revenue: filtered.reduce((sum, p) => sum + p.revenue, 0)
    };
  };

  const timeframeData = getTimeframeData();

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Bot className="animate-pulse mx-auto mb-4 text-purple-600" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Analyzing Maintenance Patterns...</h2>
          <p className="text-gray-600 mt-2">AI is predicting service needs for all properties</p>
        </div>
      </div>
    );
  }

  // No data state
  if (predictions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertTriangle className="mx-auto mb-4 text-yellow-600" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">No Data Available</h2>
          <p className="text-gray-600 mt-2">Add some jobs first to enable predictive maintenance</p>
          <button
            onClick={analyzeMaintenanceNeeds}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw size={16} className="inline mr-2" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp size={28} />
              Predictive Maintenance AI
            </h1>
            <p className="mt-1 opacity-90">
              AI-powered service prediction and customer retention system
            </p>
            <p className="text-xs opacity-75 mt-1 flex items-center gap-2">
              Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              {webhookStatus.healthy !== null && (
                <span className="flex items-center gap-1">
                  • N8N: {webhookStatus.healthy ? (
                    <><Wifi size={12} /> Connected</>
                  ) : (
                    <><WifiOff size={12} /> Disconnected</>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={testWebhookIntegration}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg flex items-center gap-2"
            >
              <Send size={16} />
              Test Integration
            </button>
            <button
              onClick={() => analyzeMaintenanceNeeds()}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh Now
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoRefresh 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <Clock size={16} />
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setAutoSchedule(!autoSchedule)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoSchedule 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <Bot size={16} />
              Auto-Schedule {autoSchedule ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">{stats.propertiesMonitored}</div>
          <div className="text-sm text-gray-600">Properties Tracked</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.maintenanceDue}</div>
          <div className="text-sm text-gray-600">Overdue Now</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">${stats.revenueProjected}</div>
          <div className="text-sm text-gray-600">Revenue Ready</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.jobsAutoCreated}</div>
          <div className="text-sm text-gray-600">Jobs Created</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.customersNotified}</div>
          <div className="text-sm text-gray-600">Notified</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.churnPrevented}</div>
          <div className="text-sm text-gray-600">Churn Risk</div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  selectedTimeframe === tf
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : 'Quarter'}
              </button>
            ))}
          </div>
          <div className="flex gap-4 text-sm items-center">
            <span>Total: <strong>{timeframeData.total}</strong></span>
            <span className="text-red-600">Overdue: <strong>{timeframeData.overdue}</strong></span>
            <span className="text-green-600">Revenue: <strong>${timeframeData.revenue}</strong></span>
            {upcomingMaintenance.filter(p => p.daysUntilNext <= 0).length > 0 && (
              <button
                onClick={notifyAllOverdue}
                disabled={processingBatch}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-xs"
              >
                <Bell size={14} />
                {processingBatch ? 'Processing...' : 'Notify All Overdue'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Maintenance Needed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Needs Immediate Attention ({upcomingMaintenance.length})
            </h2>
            {upcomingMaintenance.filter(p => p.daysUntilNext <= 0).length > 0 && (
              <button
                onClick={autoScheduleAll}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Calendar size={16} />
                Schedule All Overdue
              </button>
            )}
          </div>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {upcomingMaintenance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-2" size={48} />
                <p>All properties up to date!</p>
              </div>
            ) : (
              upcomingMaintenance.map((pred, index) => (
                <div key={index} className={`border-2 rounded-lg p-4 ${getRiskColor(pred.risk)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getServiceIcon(pred.service)}
                        <h3 className="font-semibold text-gray-800">{pred.customer}</h3>
                        {pred.daysUntilNext < 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            {Math.abs(pred.daysUntilNext)} days overdue
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{pred.address}</p>
                        <p className="mt-1">
                          Last service: {pred.lastService.toLocaleDateString()} • 
                          Every {pred.frequency} days
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Target size={12} />
                          {pred.confidence}% confidence
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          ${pred.revenue} value
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat size={12} />
                          {pred.jobCount} past jobs
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => createMaintenanceJob(pred)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Create Job
                      </button>
                      <button
                        onClick={() => notifyCustomer(pred)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Notify
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-purple-600" size={20} />
            Upcoming Maintenance Calendar
          </h2>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {predictions
              .filter(p => p.daysUntilNext > 0 && p.daysUntilNext <= 30)
              .map((pred, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">
                        {pred.nextService.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {pred.nextService.getDate()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{pred.customer}</div>
                      <div className="text-xs text-gray-600">
                        {pred.service} • In {pred.daysUntilNext} days
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">${pred.revenue}</span>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">AI Maintenance Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Pattern Recognition</div>
              <div className="text-sm opacity-90">Learns from {properties.length} customer histories</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Churn Prevention</div>
              <div className="text-sm opacity-90">Identifies at-risk customers automatically</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Revenue Generation</div>
              <div className="text-sm opacity-90">Creates recurring work automatically</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Smart Notifications</div>
              <div className="text-sm opacity-90">Perfect timing for customer outreach</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="text-green-600" size={20} />
          Revenue Impact Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${timeframeData.revenue * 4}
            </div>
            <div className="text-sm text-gray-600">Monthly Recurring</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(predictions.length * 0.8)}
            </div>
            <div className="text-sm text-gray-600">Active Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {predictions.length > 0 ? Math.round(predictions.filter(p => p.confidence > 80).length / predictions.length * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Prediction Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              ${timeframeData.revenue * 52}
            </div>
            <div className="text-sm text-gray-600">Annual Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveMaintenance;