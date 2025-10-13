import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, DollarSign, Users, MessageSquare, BarChart3, Clock, 
  CheckCircle, Bell, Camera, Send, Navigation, Star, TrendingUp, 
  Zap, Phone, RefreshCw, ChevronLeft, Home, Briefcase, 
  Activity, LogOut, ChevronRight, Filter, Download, Edit, Loader,
  Mic, MicOff, Cloud, CloudRain, Sun, Bot, Cpu, AlertCircle, Menu, X,
  Mail, ArrowLeftRight
} from 'lucide-react';

// Import services
import { supabase } from './services/database/supabase';
import { OpenAIService } from './services/ai/openai';
import { VoiceCommandService } from './services/ai/voiceCommands';
import { WeatherService } from './services/ai/weatherService';
import { Lock, User, Shield, Eye, EyeOff, Info } from 'lucide-react';
import { authService } from './services/auth/authService';
import { Repeat } from 'lucide-react';
import { Trash2 } from 'lucide-react'; 

// Import components
import SmartImportModal from './components/SmartImportModal';
import CrewTrackingMap from './components/CrewTrackingMap';
import AIAssistant from './components/Dashboard/AIAssistant';
import SmartScheduler from './components/Dashboard/SmartScheduler';
import WeatherWidget from './components/Dashboard/WeatherWidget';
import JobCamera from './components/Jobs/JobCamera';
import VoiceNotes from './components/Jobs/VoiceNotes';
import AIStatusDashboard from './components/Dashboard/AIStatusDashboard';
import AutoScheduleOptimizer from './components/Schedule/AutoScheduleOptimizer';
import CustomerResponseSystem from './components/Messages/CustomerResponseSystem';
import WeatherIntelligence from './components/Weather/WeatherIntelligence';
import PredictiveMaintenance from './components/Maintenance/PredictiveMaintenance';
import CrewManagementPanel from './components/CrewManagementPanel';
import RecurringJobsManager from './components/Schedule/RecurringJobsManager';
import DataResetTool from './components/DataResetTool';
import n8nAutomation from './services/automation/n8n';
import CustomerMessageSimulator from './components/Messages/CustomerMessageSimulator';


// Initialize services
const ai = new OpenAIService();
const voiceService = new VoiceCommandService();
const weatherService = new WeatherService();

// 2. ADD THIS LOGIN COMPONENT (add before your AdminApp function):
function LoginScreen({ onLoginSuccess, onSwitchToSetup }) {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'crew'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [crewId, setCrewId] = useState('');
  const [crewPin, setCrewPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // FIRST: Find admin's company
    const response = await fetch(
      `${supabase.url}/rest/v1/admin_accounts?email=eq.${adminEmail}`,
      { headers: supabase.headers }
    );
    
    if (response.ok) {
      const admins = await response.json();
      if (admins && admins.length > 0 && admins[0].company_id) {
        // Set company context BEFORE login
        localStorage.setItem('currentCompanyId', admins[0].company_id);
      }
    }
    
    // THEN: Proceed with login
    const result = await authService.loginAdmin(adminEmail, adminPassword);
    
    if (result.success) {
      onLoginSuccess(result.data);
    } else {
      setError(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    setError('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleCrewLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.loginCrew(crewId.toUpperCase(), crewPin);
    
    if (result.success) {
      onLoginSuccess(result.data);
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 glass rounded-full mb-4">
            <div className="text-3xl font-bold text-white">BRIGHT</div>
            <div className="text-xs text-green-200">LANDSCAPING AI</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bright.AI</h1>
          <p className="text-green-200">Landscaping Intelligence Platform</p>
        </div>

        {/* Login Card */}
        <div className="glass backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-2xl border border-white/20">
          {/* Login Type Tabs */}
          <div className="flex rounded-lg glass p-1 mb-6">
            <button
              onClick={() => { setLoginType('admin'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                loginType === 'admin' 
                  ? 'bg-green-500/30 text-white border border-green-400/50' 
                  : 'text-green-200 hover:text-white'
              }`}
            >
              <Shield size={18} />
              <span className="font-semibold">Admin</span>
            </button>
            <button
              onClick={() => { setLoginType('crew'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                loginType === 'crew' 
                  ? 'bg-blue-500/30 text-white border border-blue-400/50' 
                  : 'text-green-200 hover:text-white'
              }`}
            >
              <User size={18} />
              <span className="font-semibold">Crew</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Admin Login Form */}
          {loginType === 'admin' && (
            <form onSubmit={handleAdminLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400 transition-all"
                    placeholder="admin@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400 transition-all pr-12"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Login as Admin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Crew Login Form */}
          {loginType === 'crew' && (
            <form onSubmit={handleCrewLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={crewId}
                    onChange={(e) => setCrewId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-blue-400 transition-all uppercase"
                    placeholder="EMP001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    PIN Code
                  </label>
                  <input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]{4}"
  value={crewPin}
  onChange={(e) => setCrewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-green-200/50 focus:outline-none focus:border-blue-400 transition-all"
  placeholder="• • • •"
  maxLength="4"
  required
/>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <User size={20} />
                    <span>Login as Crew</span>
                  </>
                )}
              </button>
            </form>
          )}
       </div>
        
        {/* Add Create Account Link */}
        <div className="text-center mt-4">
          <p className="text-green-200 text-sm">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSetup}
              className="text-white underline hover:text-green-100"
            >
              Create one here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


// Admin App Component
function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Real data states
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data from Supabase
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [jobsData, quotesData, messagesData, crewData] = await Promise.all([
        supabase.fetchData('jobs'),
        supabase.fetchData('quotes'),
        supabase.fetchData('messages'),
        supabase.fetchData('crew_members')
      ]);
      
      setJobs(jobsData || []);
      setQuotes(quotesData || []);
      setMessages(messagesData || []);
      setCrewMembers(crewData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // AUTO-REFRESH SETUP - This is the new part!
  useEffect(() => {
    // Initial fetch
    fetchAllData();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing admin data...');
      fetchAllData();
    }, 30000); // Refresh every 30 seconds
    
    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const addNewJob = async (jobData) => {
    const newJob = await supabase.insertData('jobs', jobData);
    if (newJob && newJob.length > 0) {
      setJobs([newJob[0], ...jobs]);
      return true;
    }
    return false;
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const updated = await supabase.updateData('jobs', jobId, { status: newStatus });
    if (updated && updated.length > 0) {
      setJobs(jobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      return true;
    }
    return false;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // UPDATED DASHBOARDVIEW WITH AI STATUS DASHBOARD
   const DashboardView = ({ isMobile }) => {
    const [jobFilter, setJobFilter] = useState('today');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState('jobs');
    const [showAIStatus, setShowAIStatus] = useState(false); // NEW STATE FOR AI STATUS
    
    const filteredJobs = jobs.filter(job => {
      if (jobFilter === 'today') {
        return true; // Show all for now
      } else {
        return true;
      }
    });

    const isDataEmpty = jobs.length === 0 && quotes.length === 0 && crewMembers.length === 0;

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-100 gradient-text">Dashboard</h1>
          <div className="flex gap-2">
            {/* NEW AI STATUS BUTTON */}
            <button
              onClick={() => setShowAIStatus(!showAIStatus)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                showAIStatus 
                  ? 'btn-gradient-primary shadow-lg' 
                  : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              <Bot size={20} />
              AI Status
              {!showAIStatus && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  Setup Required
                </span>
              )}
            </button>
            
            {/* Import Type Selector */}
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="px-3 py-2 glass rounded-lg text-sm text-gray-300 bg-transparent"
            >
              <option value="jobs">Import Jobs</option>
              <option value="quotes">Import Quotes</option>
              <option value="crew_members">Import Crew</option>
              <option value="messages">Import Messages</option>
            </select>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 btn-gradient-primary rounded-lg"
            >
              <Download size={16} />
              Smart Import
            </button>
            <button onClick={fetchAllData} className="flex items-center gap-2 px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* AI STATUS DASHBOARD - Shows when button is clicked */}
        {showAIStatus && (
          <div className="animate-fadeIn">
            <AIStatusDashboard />
          </div>
        )}
        
        {loading && (
          <div className="glass rounded-lg p-4 flex items-center gap-2 border-blue-500/30">
            <Loader className="animate-spin text-blue-400" size={20} />
            <span className="text-blue-300">Loading data from Supabase...</span>
          </div>
        )}

        {/* Smart Import Modal */}
        <SmartImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          importType={importType}
          onImportComplete={fetchAllData}
        />

        {isDataEmpty && !showAIStatus && (
          <div className="glass rounded-lg p-6 text-center border-yellow-500/30">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Welcome to Bright.AI!</h3>
            <p className="text-yellow-300 mb-4">Get started by importing your existing data or adding your first job.</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 border border-yellow-500/30"
              >
                Smart Import Data
              </button>
              <button 
                onClick={() => setActiveTab('scheduling')}
                className="px-4 py-2 btn-gradient-primary rounded-lg"
              >
                Add First Job
              </button>
            </div>
          </div>
        )}
        
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'}`}>
          <button 
            onClick={() => setActiveTab('scheduling')}
            className="glass card-modern rounded-xl p-6 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-400">Today's Jobs</p>
                <p className="text-3xl font-bold gradient-text">{jobs.length}</p>
                <p className="text-xs text-gray-500">Live from database</p>
              </div>
              <Calendar className="text-green-400" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('quotes')}
            className="glass card-modern rounded-xl p-6 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-400">Pending Quotes</p>
                <p className="text-3xl font-bold text-blue-400">{quotes.length}</p>
                <p className="text-xs text-gray-500">Needs approval</p>
              </div>
              <DollarSign className="text-blue-400" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('crew')}
            className="glass card-modern rounded-xl p-6 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-400">Crew Members</p>
                <p className="text-3xl font-bold text-purple-400">{crewMembers.length}</p>
                <p className="text-xs text-gray-500">Active today</p>
              </div>
              <Users className="text-purple-400" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('messages')}
            className="glass card-modern rounded-xl p-6 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-400">Messages</p>
                <p className="text-3xl font-bold text-orange-400">{messages.length}</p>
                <p className="text-xs text-gray-500">Customer messages</p>
              </div>
              <MessageSquare className="text-orange-400" size={32} />
            </div>
          </button>

          <div className="glass card-modern rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Needs Review</p>
                <p className="text-3xl font-bold text-red-400">{messages.filter(m => m.status === 'needs-review').length}</p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
              <Bell className="text-red-400" size={32} />
            </div>
          </div>
        </div>
        
        {/* Only show rest of dashboard if AI Status is not displayed */}
        {!showAIStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass card-modern rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-100">Recent Jobs</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setJobFilter('today')}
                    className={`px-3 py-1 text-sm rounded ${jobFilter === 'today' ? 'btn-gradient-primary' : 'glass text-gray-400'}`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setJobFilter('week')}
                    className={`px-3 py-1 text-sm rounded ${jobFilter === 'week' ? 'btn-gradient-primary' : 'glass text-gray-400'}`}
                  >
                    Week
                  </button>
                </div>
              </div>
              
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="mx-auto mb-2" size={48} />
                  <p>No jobs found</p>
                  <p className="text-sm text-gray-500">Import data or add jobs manually</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredJobs.slice(0, 5).map(job => (
                    <div key={job.id} className="glass rounded-lg p-3 hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-100">{job.customer}</h4>
                          <p className="text-sm text-gray-400">{job.type} • {job.address}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-300">{job.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500">{job.crew}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Crew Tracking Map */}
            <div className="glass card-modern rounded-xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Live Crew Tracking</h3>
              <CrewTrackingMap crewMembers={crewMembers} jobs={jobs} />
            </div>
          </div>
        )}
      </div>
    );
  };

const SchedulingView = ({ isMobile }) => {
  const [newJob, setNewJob] = useState({
    customer: '',
    type: '',
    address: '',
    crew: 'Team Alpha',
    price: '',
    instructions: '',
    phone: '',
    equipment: 'Zero Turn',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  });
  
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', 'team', or 'recurring'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('all');

   const QuickJobTransfer = ({ job }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async () => {
      if (!selectedTeam || selectedTeam === (job.crew || job.assigned_crew)) return;
      
      setLoading(true);
      try {
        const result = await supabase.updateData('jobs', job.id, { 
          assigned_crew: selectedTeam,
          crew: selectedTeam,
          team: selectedTeam
        });
        
        if (result !== false) {
          fetchAllData();
          setShowDropdown(false);
          setSelectedTeam('');
        }
      } catch (error) {
        console.error('Transfer failed:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="relative">
        {!showDropdown ? (
          <button
            onClick={() => setShowDropdown(true)}
            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm flex items-center gap-1"
          >
            <ArrowLeftRight size={14} />
            Transfer
          </button>
        ) : (
          <div className="absolute right-0 z-20 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-2 min-w-[150px]">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-1 bg-gray-900 border border-gray-700 rounded text-white text-sm mb-2"
            >
              <option value="">Select team...</option>
              <option value="Team Alpha">Team Alpha</option>
              <option value="Team Beta">Team Beta</option>
              <option value="Team Gamma">Team Gamma</option>
              <option value="Team Delta">Team Delta</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={handleTransfer}
                disabled={!selectedTeam || loading}
                className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '...' : 'OK'}
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setSelectedTeam('');
                }}
                className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  // END OF TRANSFER COMPONENT
  
  // Get current week dates
  const getWeekDates = () => {
    const week = [];
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };
  
  const weekDates = getWeekDates();
  
  // Organize jobs by date and team
  const getJobsByDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter(job => {
      const jobDate = job.date || dateStr;
      return jobDate === dateStr && (selectedTeam === 'all' || job.crew === selectedTeam);
    });
  };
  
  // Team colors
  const teamColors = {
    'Team Alpha': { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
    'Team Beta': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    'Team Gamma': { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' }
  };
  
  // Calculate team workload
  const getTeamWorkload = (teamName) => {
    const teamJobs = jobs.filter(job => job.crew === teamName);
    const completed = teamJobs.filter(job => job.status === 'Completed').length;
    const active = teamJobs.filter(job => job.status === 'In Progress').length;
    const scheduled = teamJobs.filter(job => job.status === 'Scheduled').length;
    const revenue = teamJobs.reduce((sum, job) => {
      if (job.price) {
        return sum + parseInt(job.price.replace(/[^0-9]/g, '') || 0);
      }
      return sum;
    }, 0);
    
    return { total: teamJobs.length, completed, active, scheduled, revenue };
  };

  const handleAddJob = async () => {
  if (!newJob.customer || !newJob.type) {
    alert('Please fill in customer and job type');
    return;
  }
  
  // Create customer data with only available fields
  const customerData = {};
  if (newJob.customer?.trim()) customerData.name = newJob.customer.trim();
  if (newJob.phone?.trim()) customerData.phone = newJob.phone.trim();
  if (newJob.address?.trim()) customerData.address = newJob.address.trim();
  
  // Only try to create customer if we have some data
  if (Object.keys(customerData).length > 0) {
    try {
      if (customerData.phone) {
        // Check if customer exists by phone
        const existingCustomers = await supabase.fetchData('customers');
        const existing = existingCustomers?.find(c => c.phone === customerData.phone);
        
        if (!existing) {
          // Create new customer
          await supabase.insertData('customers', customerData);
        }
      } else {
        // No phone, just create (might create duplicates)
        await supabase.insertData('customers', customerData);
      }
    } catch (error) {
      console.log('Customer creation failed:', error);
      // Don't block job creation
    }
  }
  
  // Continue with job creation
  const success = await addNewJob({
    ...newJob,
    customer_phone: newJob.phone || null,
    status: 'Scheduled'
  });
  
  if (success) {
    alert('Job added successfully!');
    setNewJob({
      customer: '',
      type: '',
      address: '',
      crew: 'Team Alpha',
      price: '',
      instructions: '',
      phone: '',
      equipment: 'Zero Turn',
      date: new Date().toISOString().split('T')[0],
      time: '09:00'
    });
  } else {
    alert('Error adding job. Please try again.');
  }
};

const CalendarView = ({ isMobile }) => {
  // Step 3: Add these state variables
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete job function
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      // Delete from Supabase
      const success = await supabase.deleteData('jobs', jobId);
      
      if (success) {
        // Update local state
        const updatedJobs = jobs.filter(job => job.id !== jobId);
        setJobs(updatedJobs);
        
        // Close modal and reset
        setShowJobModal(false);
        setSelectedJob(null);
        
        alert('✅ Job deleted successfully');
      } else {
        alert('❌ Failed to delete job. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('❌ Error deleting job: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Job Details Modal Component
  const JobDetailsModal = () => {
    if (!selectedJob) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass card-modern rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-100">Job Details</h3>
            <button 
              onClick={() => {
                setShowJobModal(false);
                setSelectedJob(null);
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-xs text-gray-400">Customer</label>
              <p className="text-gray-100 font-medium">{selectedJob.customer}</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-400">Service Type</label>
              <p className="text-gray-100">{selectedJob.type || selectedJob.service || 'Lawn Maintenance'}</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-400">Address</label>
              <p className="text-gray-100">{selectedJob.address || 'No address provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Date</label>
                <p className="text-gray-100">{selectedJob.date || 'Today'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Time</label>
                <p className="text-gray-100">{selectedJob.time || '9:00 AM'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Crew</label>
                <p className="text-gray-100">{selectedJob.crew || 'Unassigned'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Price</label>
                <p className="text-green-400 font-medium">{selectedJob.price || '$0'}</p>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-400">Phone</label>
              <p className="text-gray-100">{selectedJob.phone || selectedJob.customer_phone || 'No phone'}</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-400">Status</label>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                selectedJob.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                selectedJob.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                selectedJob.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {selectedJob.status || 'Scheduled'}
              </span>
            </div>
            
            {selectedJob.instructions && (
              <div>
                <label className="text-xs text-gray-400">Instructions</label>
                <p className="text-gray-100 text-sm">{selectedJob.instructions}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                updateJobStatus(selectedJob.id, 'In Progress');
                setShowJobModal(false);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Start Job
            </button>
            
            <button
              onClick={() => {
                handleDeleteJob(selectedJob.id);
              }}
              disabled={deleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Return the component JSX
  return (
    <>
      {/* Job Details Modal */}
      {showJobModal && <JobDetailsModal />}
      
      <div className="glass card-modern rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
              className="p-2 glass rounded-lg hover:bg-white/10"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-100">
              Week of {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                setSelectedDate(newDate);
              }}
              className="p-2 glass rounded-lg hover:bg-white/10"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 glass rounded-lg text-sm text-gray-100 bg-transparent"
            >
              <option value="all">All Teams</option>
              <option value="Team Alpha">Team Alpha</option>
              <option value="Team Beta">Team Beta</option>
              <option value="Team Gamma">Team Gamma</option>
            </select>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 btn-gradient-primary rounded-lg text-sm"
            >
              Today
            </button>
          </div>
        </div>
        
        {/* Calendar Grid - Updated with click handlers */}
        <div className={isMobile ? 'space-y-3' : 'grid grid-cols-7 gap-2'}>
          {weekDates.map((date, index) => {
            const dayJobs = getJobsByDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            
            if (isMobile) {
              return (
                <div 
                  key={index} 
                  className={`glass rounded-lg p-4 ${isToday ? 'ring-2 ring-green-400/50' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${isToday ? 'text-green-400' : 'text-gray-100'}`}>
                        {dayName} {dayNum}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">{dayJobs.length} jobs</span>
                      <span className="text-green-400 font-bold">
                        ${dayJobs.reduce((sum, job) => sum + parseInt(job.price?.replace(/[^0-9]/g, '') || 0), 0)}
                      </span>
                    </div>
                  </div>
                  {dayJobs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dayJobs.slice(0, 2).map((job, idx) => (
                        <div 
                          key={idx} 
                          className="text-xs text-gray-400 pl-3 border-l-2 border-gray-600 cursor-pointer hover:text-gray-200"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobModal(true);
                          }}
                        >
                          {job.time || '9:00'} - {job.customer}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <div className="text-xs text-gray-500 pl-3">
                          +{dayJobs.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div 
                key={index} 
                className={`glass rounded-lg p-3 min-h-[200px] ${
                  isToday ? 'ring-2 ring-green-400/50' : ''
                }`}
              >
                <div className="text-center mb-2">
                  <div className={`text-xs font-medium ${
                    isToday ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {dayName}
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-green-400' : 'text-gray-100'
                  }`}>
                    {dayNum}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayJobs.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-4">
                      No jobs scheduled
                    </div>
                  ) : (
                    dayJobs.slice(0, 3).map((job, jobIndex) => {
                      const colors = teamColors[job.crew] || teamColors['Team Alpha'];
                      return (
                        <div 
                          key={jobIndex}
                          className={`p-2 rounded text-xs ${colors.bg} ${colors.border} border cursor-pointer hover:scale-105 transition-transform`}
                          title={`${job.customer} - ${job.type}\nClick to view details`}
                          onClick={() => {
                            setSelectedJob(job);
                            setShowJobModal(true);
                          }}
                        >
                          <div className="font-medium text-gray-100 truncate">
                            {job.time || '9:00'} - {job.customer}
                          </div>
                          <div className={`text-xs ${colors.text} truncate`}>
                            {job.crew}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {dayJobs.length > 3 && (
                    <div className="text-xs text-gray-400 text-center">
                      +{dayJobs.length - 3} more
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-2 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Jobs</span>
                    <span className="text-gray-300 font-medium">{dayJobs.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Revenue</span>
                    <span className="text-green-400 font-medium">
                      ${dayJobs.reduce((sum, job) => {
                        return sum + parseInt(job.price?.replace(/[^0-9]/g, '') || 0);
                      }, 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Week Summary */}
        <div className="mt-6 p-4 glass rounded-lg">
          <h4 className="text-sm font-semibold text-gray-100 mb-3">Week Summary</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {jobs.filter(j => selectedTeam === 'all' || j.crew === selectedTeam).length}
              </div>
              <div className="text-xs text-gray-400">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {jobs.filter(j => j.status === 'Completed' && (selectedTeam === 'all' || j.crew === selectedTeam)).length}
              </div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {jobs.filter(j => j.status === 'In Progress' && (selectedTeam === 'all' || j.crew === selectedTeam)).length}
              </div>
              <div className="text-xs text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {jobs.filter(j => j.status === 'Scheduled' && (selectedTeam === 'all' || j.crew === selectedTeam)).length}
              </div>
              <div className="text-xs text-gray-400">Scheduled</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
  
  // Team View Component (YOUR EXISTING CODE - NO CHANGES)
  const TeamView = () => (
    <div className="space-y-4">
      {['Team Alpha', 'Team Beta', 'Team Gamma'].map(teamName => {
        const workload = getTeamWorkload(teamName);
        const colors = teamColors[teamName];
        const teamJobs = jobs.filter(job => job.crew === teamName);
        
        return (
          <div key={teamName} className="glass card-modern rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border-2`}></div>
                <h3 className="text-lg font-semibold text-gray-100">{teamName}</h3>
                <span className={`px-3 py-1 text-xs rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                  {workload.total} jobs
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Revenue</div>
                <div className="text-xl font-bold gradient-text">${workload.revenue}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-2 glass rounded-lg">
                <div className="text-lg font-bold text-green-400">{workload.completed}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center p-2 glass rounded-lg">
                <div className="text-lg font-bold text-blue-400">{workload.active}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
              <div className="text-center p-2 glass rounded-lg">
                <div className="text-lg font-bold text-yellow-400">{workload.scheduled}</div>
                <div className="text-xs text-gray-400">Scheduled</div>
              </div>
              <div className="text-center p-2 glass rounded-lg">
                <div className="text-lg font-bold text-purple-400">
                  {workload.total > 0 ? Math.round((workload.completed / workload.total) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400">Complete</div>
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamJobs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No jobs assigned to this team
                </div>
              ) : (
                teamJobs.slice(0, 5).map((job, index) => (
                  <div key={index} className="flex justify-between items-center p-3 glass rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-100">{job.customer}</div>
                      <div className="text-xs text-gray-400">
                        {job.type} • {job.date || 'Today'} at {job.time || '9:00 AM'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                        job.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-sm font-medium text-gray-300">{job.price}</span>
                    </div>
                  </div>
                ))
              )}
              {teamJobs.length > 5 && (
                <div className="text-center text-xs text-gray-400 py-2">
                  +{teamJobs.length - 5} more jobs
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100 gradient-text">Job Scheduling</h1>
        <div className="flex items-center gap-2">
          {/* UPDATED View Mode Switcher - ADDED RECURRING BUTTON */}
          <div className="glass rounded-lg p-1 flex gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'btn-gradient-primary'
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Calendar className="inline mr-2" size={16} />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'team'
                  ? 'btn-gradient-primary'
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Users className="inline mr-2" size={16} />
              Teams
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'btn-gradient-primary'
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Filter className="inline mr-2" size={16} />
              List
            </button>
            {/* NEW RECURRING JOBS BUTTON */}
            <button
              onClick={() => setViewMode('recurring')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'recurring'
                  ? 'btn-gradient-primary'
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Repeat className="inline mr-2" size={16} />
              Recurring
            </button>
          </div>
          
          <button onClick={fetchAllData} className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10">
            <RefreshCw className="inline mr-2" size={16} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA WITH NEW RECURRING VIEW */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
        <div className={viewMode === 'recurring' ? 'lg:col-span-3' : (isMobile ? 'w-full' : 'lg:col-span-2')}>
          {viewMode === 'calendar' && <CalendarView isMobile={isMobile} />}
          {viewMode === 'team' && <TeamView />}
          {viewMode === 'list' && (
  <div className="glass card-modern rounded-xl p-6">
    <h3 className="font-semibold text-gray-100 mb-4">All Jobs ({jobs.length})</h3>
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {jobs.map((job) => (
        <div key={job.id} className="glass rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium text-gray-100">{job.customer}</h4>
              <p className="text-sm text-gray-400">{job.type}</p>
              <p className="text-xs text-gray-500 mt-1">
                {job.date || 'Today'} at {job.time || '9:00 AM'} • {job.crew}
              </p>
            </div>
            <div className="flex gap-2">
              <QuickJobTransfer job={job} />
              <select
                value={job.status}
                onChange={(e) => updateJobStatus(job.id, e.target.value)}
                className="text-sm px-2 py-1 glass rounded text-gray-100 bg-transparent"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              {/* ADD THIS DELETE BUTTON RIGHT HERE */}
              <button
                onClick={async () => {
                  if (window.confirm(`Delete job for ${job.customer}?`)) {
                    const success = await supabase.deleteData('jobs', job.id);
                    if (success) {
                      fetchAllData();
                    } else {
                      alert('Failed to delete job');
                    }
                  }
                }}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <p>{job.address}</p>
            <p className="mt-1">Equipment: {job.equipment} • Price: {job.price}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          {/* NEW RECURRING JOBS VIEW */}
          {viewMode === 'recurring' && (
            <RecurringJobsManager supabase={supabase} />
          )}
        </div>
        
        {/* Side Panel - Only show when not in recurring view */}
        {viewMode !== 'recurring' && (
          <div className="space-y-4">
            <div className="glass card-modern rounded-xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Quick Add Job</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer name"
                  value={newJob.customer}
                  onChange={(e) => setNewJob({...newJob, customer: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Job type"
                  value={newJob.type}
                  onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 placeholder-gray-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newJob.address}
                  onChange={(e) => setNewJob({...newJob, address: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 placeholder-gray-500"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newJob.date}
                    onChange={(e) => setNewJob({...newJob, date: e.target.value})}
                    className="p-2 glass rounded-lg text-gray-100"
                  />
                  <input
                    type="time"
                    value={newJob.time}
                    onChange={(e) => setNewJob({...newJob, time: e.target.value})}
                    className="p-2 glass rounded-lg text-gray-100"
                  />
                </div>
                
                <select
                  value={newJob.crew}
                  onChange={(e) => setNewJob({...newJob, crew: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 bg-transparent"
                >
                  <option value="Team Alpha">Team Alpha</option>
                  <option value="Team Beta">Team Beta</option>
                  <option value="Team Gamma">Team Gamma</option>
                </select>
                
                <select
                  value={newJob.equipment}
                  onChange={(e) => setNewJob({...newJob, equipment: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 bg-transparent"
                >
                  <option value="Zero Turn">Zero Turn</option>
                  <option value="V Ride">V Ride</option>
                  <option value="Push Mower">Push Mower</option>
                  <option value="Other">Other</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Price (e.g., $150)"
                  value={newJob.price}
                  onChange={(e) => setNewJob({...newJob, price: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 placeholder-gray-500"
                />
                
                <input
                  type="text"
                  placeholder="Phone number"
                  value={newJob.phone}
                  onChange={(e) => setNewJob({...newJob, phone: e.target.value})}
                  className="w-full p-2 glass rounded-lg text-gray-100 placeholder-gray-500"
                />
                
                <textarea
                  placeholder="Special instructions"
                  value={newJob.instructions}
                  onChange={(e) => setNewJob({...newJob, instructions: e.target.value})}
                  className="w-full p-2 glass rounded-lg h-20 text-gray-100 placeholder-gray-500"
                />
                
                <button 
                  onClick={handleAddJob}
                  className="w-full py-2 btn-gradient-primary rounded-lg font-medium"
                >
                  Add Job to Schedule
                </button>
              </div>
            </div>
            
            <div className="glass card-modern rounded-xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Today's Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Jobs</span>
                  <span className="text-lg font-bold gradient-text">
                    {jobs.filter(j => {
                      const today = new Date().toISOString().split('T')[0];
                      return (j.date || today) === today;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Teams Active</span>
                  <span className="text-lg font-bold text-green-400">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Est. Revenue</span>
                  <span className="text-lg font-bold text-blue-400">
                    ${jobs.filter(j => {
                      const today = new Date().toISOString().split('T')[0];
                      return (j.date || today) === today;
                    }).reduce((sum, job) => {
                      return sum + parseInt(job.price?.replace(/[^0-9]/g, '') || 0);
                    }, 0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="glass card-modern rounded-xl p-6">
              <h3 className="font-semibold text-gray-100 mb-4">Equipment Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-400">Zero Turn</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Available</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-400">V Ride</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Available</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-400">Push Mower</span>
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">In Use</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuotesView = ({ isMobile }) => (
      <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-100 gradient-text">Quotes Management</h1>
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        <div className="glass card-modern rounded-xl p-6">
          <h3 className="font-semibold text-gray-100 mb-4">Pending Quotes ({quotes.length})</h3>
          <div className="space-y-3">
            {quotes.map(quote => (
              <div key={quote.id} className="glass rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-100">{quote.customer}</h4>
                    <p className="text-sm text-gray-400">{quote.service}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold gradient-text">{quote.price_range}</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm btn-gradient-primary rounded">
                      Approve
                    </button>
                    <button className="px-3 py-1 text-sm glass text-gray-300 rounded hover:bg-white/10">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass card-modern rounded-xl p-6">
          <h3 className="font-semibold text-gray-100 mb-4">Quote Generator</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Customer name" className="w-full p-2 glass rounded text-gray-100 placeholder-gray-500" />
            <input type="text" placeholder="Service type" className="w-full p-2 glass rounded text-gray-100 placeholder-gray-500" />
            <textarea placeholder="Service description" className="w-full p-2 glass rounded h-24 text-gray-100 placeholder-gray-500" />
            <button className="w-full py-2 btn-gradient-primary rounded">
              Generate Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );

const MessagesView = ({ isMobile }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [customResponse, setCustomResponse] = useState('');
  const [viewMode, setViewMode] = useState('messages');
  
  // Calculate real AI statistics from actual messages
  const calculateStats = () => {
    const processed = messages.filter(m => 
      m.status === 'processed' || m.status === 'approved' || m.status === 'auto-processed'
    ).length;
    const total = messages.length;
    const today = messages.filter(m => {
      const msgDate = new Date(m.created_at).toDateString();
      return msgDate === new Date().toDateString();
    }).length;
    const urgent = messages.filter(m => m.status === 'urgent').length;
    const needsReview = messages.filter(m => 
      m.status === 'review' || m.status === 'needs-review'
    ).length;
    
    return {
      totalProcessed: processed,
      successRate: total > 0 ? ((processed / total) * 100).toFixed(1) : 0,
      avgResponseTime: 1.2,
      autoScheduled: messages.filter(m => m.aiAction?.includes('schedule')).length,
      quotesGenerated: messages.filter(m => m.aiAction?.includes('quote')).length,
      escalated: messages.filter(m => m.status === 'rejected' || m.needsManualReview).length,
      todayProcessed: today,
      activeTasks: needsReview
    };
  };

  const [aiStats, setAiStats] = useState(calculateStats());

  // Update stats when messages change
  useEffect(() => {
    setAiStats(calculateStats());
  }, [messages]);

  // Add clear all messages function
  const clearAllMessages = async () => {
    if (!window.confirm('Delete ALL messages? This action cannot be undone.')) {
      return;
    }
    
    let deletedCount = 0;
    for (const message of messages) {
      const success = await supabase.deleteData('messages', message.id);
      if (success) deletedCount++;
    }
    
    if (deletedCount > 0) {
      alert(`Successfully cleared ${deletedCount} messages`);
      fetchAllData();
    } else {
      alert('Failed to clear messages');
    }
  };

  // Add delete single message function
  const deleteMessage = async (messageId, messageName) => {
    if (!window.confirm(`Delete message from ${messageName}?`)) {
      return;
    }
    
    const success = await supabase.deleteData('messages', messageId);
    if (success) {
      setMessages(messages.filter(m => m.id !== messageId));
    } else {
      alert('Failed to delete message');
    }
  };

  // Process individual message with AI
  const processMessageWithAI = async (msg) => {
    setIsProcessing(true);
    setSelectedMessage(msg);
    
    // Send to n8n for actual AI processing
    const n8nResult = await n8nAutomation.processCustomerMessage({
      message: msg.message,
      from_phone: msg.from_phone || msg.phone,
      from_name: msg.from_name || msg.customer
    });
    
    // Update message based on n8n response
    const updatedMessage = {
      ...msg,
      status: n8nResult.success ? 'processed' : 'needs-review',
      aiAction: n8nResult.success 
        ? `AI: ${n8nResult.intent || 'processed'} - ${n8nResult.data?.response || 'Handled automatically'}`
        : 'Requires manual review',
      confidence: n8nResult.success ? 95 : 0,
      aiResponse: n8nResult.data?.response || 'Processing complete',
      actionTaken: {
        type: n8nResult.intent || 'processed',
        details: n8nResult.data?.action || 'Automated processing',
        jobCreated: n8nResult.data?.jobCreated || false,
        jobId: n8nResult.data?.jobId || null
      }
    };
    setMessages(messages.map(m => m.id === msg.id ? updatedMessage : m));
    
    setIsProcessing(false);
    setSelectedMessage(null);
  };

  // Process all pending messages
  const processAllMessages = async () => {
    const pendingMessages = messages.filter(m => m.status === 'review' || m.status === 'urgent' || m.status === 'needs-review');
    for (const msg of pendingMessages) {
      await processMessageWithAI(msg);
    }
  };

  // Approve AI action
  const approveAction = (messageId) => {
    setMessages(messages.map(m => 
      m.id === messageId 
        ? { ...m, status: 'approved', approvedBy: 'Admin', approvedAt: new Date() }
        : m
    ));
  };

  // Reject AI action
  const rejectAction = (messageId) => {
    setMessages(messages.map(m => 
      m.id === messageId 
        ? { ...m, status: 'rejected', needsManualReview: true }
        : m
    ));
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'processed') return msg.status === 'processed' || msg.status === 'approved' || msg.status === 'auto-processed';
    if (activeFilter === 'review') return msg.status === 'review' || msg.status === 'needs-review';
    if (activeFilter === 'urgent') return msg.status === 'urgent';
    return true;
  });

  // Group messages
  const processedMessages = filteredMessages.filter(m => 
    m.status === 'processed' || m.status === 'approved' || m.status === 'auto-processed'
  );
  const reviewMessages = filteredMessages.filter(m => 
    m.status === 'review' || m.status === 'urgent' || m.status === 'needs-review'
  );

  // Use existing icons
  const CheckCircle2 = CheckCircle;
  const Brain = Bot;
  const XCircle = AlertCircle;
  const Settings = Edit;

  return (
    <div className="p-6 space-y-6">
      {/* UPDATED HEADER WITH TOGGLE BUTTON */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 gradient-text">AI Message Center</h1>
          <p className="text-sm text-gray-400">Intelligent message processing and automation</p>
        </div>
        <div className="flex gap-2">
          {/* NEW TOGGLE BUTTON FOR SWITCHING VIEWS */}
          <button 
            onClick={() => setViewMode(viewMode === 'messages' ? 'simulator' : 'messages')}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 flex items-center gap-2 shadow-lg"
          >
            <MessageSquare size={16} />
            {viewMode === 'messages' ? 'Test Messages' : 'View Messages'}
          </button>
          
          {/* ONLY SHOW THESE BUTTONS IN MESSAGES VIEW */}
          {viewMode === 'messages' && (
            <>
              <button 
                onClick={processAllMessages}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 shadow-lg"
                disabled={isProcessing}
              >
                <Brain size={16} className={isProcessing ? 'animate-pulse' : ''} />
                {isProcessing ? 'AI Processing...' : 'Process All with AI'}
              </button>
              
              {messages.length > 0 && (
                <button 
                  onClick={clearAllMessages}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Clear All ({messages.length})
                </button>
              )}
            </>
          )}
          
          <button className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10 flex items-center gap-2">
            <Settings size={16} />
            AI Settings
          </button>
        </div>
      </div>

      {/* CONDITIONAL RENDERING BASED ON VIEW MODE */}
      {viewMode === 'simulator' ? (
        <CustomerMessageSimulator />
      ) : (
        <>
          {/* AI Statistics Dashboard - Using Real Data */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity size={20} />
                AI Performance Metrics
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
                <span className="text-sm">Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.totalProcessed}</div>
                <div className="text-xs opacity-90">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.todayProcessed}</div>
                <div className="text-xs opacity-90">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.successRate}%</div>
                <div className="text-xs opacity-90">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.avgResponseTime}s</div>
                <div className="text-xs opacity-90">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.autoScheduled}</div>
                <div className="text-xs opacity-90">Auto-Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.quotesGenerated}</div>
                <div className="text-xs opacity-90">Quotes Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{aiStats.escalated}</div>
                <div className="text-xs opacity-90">Escalated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{aiStats.activeTasks}</div>
                <div className="text-xs opacity-90">Active Now</div>
              </div>
            </div>

            {/* AI Activity Graph - Real activity based on message timestamps */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-90">AI Activity (Last 24h)</span>
                <span className="text-xs opacity-75">Total: {messages.length} messages</span>
              </div>
              <div className="flex items-end gap-1 h-12">
                {Array.from({length: 24}, (_, i) => {
                  const hour = new Date().getHours() - 23 + i;
                  const hourMessages = messages.filter(m => {
                    const msgHour = new Date(m.created_at).getHours();
                    return msgHour === (hour < 0 ? hour + 24 : hour);
                  }).length;
                  const maxMessages = Math.max(...Array.from({length: 24}, (_, j) => {
                    const h = new Date().getHours() - 23 + j;
                    return messages.filter(m => {
                      const mh = new Date(m.created_at).getHours();
                      return mh === (h < 0 ? h + 24 : h);
                    }).length;
                  }), 1);
                  return (
                    <div 
                      key={i} 
                      className="flex-1 bg-white/30 rounded-t transition-all hover:bg-white/50"
                      style={{ height: `${(hourMessages/maxMessages)*100}%` }}
                      title={`${hourMessages} messages`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={`glass rounded-xl p-1 ${isMobile ? 'grid grid-cols-2 gap-2 p-2' : 'flex gap-1'}`}>
            {[
              { id: 'all', label: 'All Messages', count: messages.length, icon: MessageSquare },
              { id: 'processed', label: 'AI Processed', count: processedMessages.length, icon: CheckCircle2 },
              { id: 'review', label: 'Needs Review', count: reviewMessages.length, icon: AlertCircle },
              { id: 'urgent', label: 'Urgent', count: messages.filter(m => m.status === 'urgent').length, icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeFilter === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/10'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
            {/* AI Processed Section */}
            <div className="glass card-modern rounded-xl">
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-400" />
                  AI Processed ({processedMessages.length})
                </h3>
                <p className="text-sm text-gray-400">Successfully handled by AI</p>
              </div>
              
              <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                {processedMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bot size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No processed messages yet</p>
                  </div>
                ) : (
                  processedMessages.map(msg => (
                    <div key={msg.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-100">{msg.from_name}</span>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              AI Handled
                            </span>
                            {msg.confidence && (
                              <span className="text-xs text-gray-500">
                                {msg.confidence}% confidence
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{msg.message}</p>
                          
                          {/* AI Action Taken */}
                          <div className="bg-blue-500/10 rounded-lg p-3 mb-2 border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Bot size={14} className="text-blue-400" />
                              <span className="text-xs font-medium text-blue-300">AI Action</span>
                            </div>
                            <p className="text-sm text-gray-300">{msg.aiAction || 'Processed automatically'}</p>
                          </div>

                          {/* Admin Actions - WITH DELETE BUTTON */}
                          <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs glass text-gray-300 rounded hover:bg-white/10">
                              View Details
                            </button>
                            
                            <button 
                              onClick={() => deleteMessage(msg.id, msg.from_name)}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-1"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                            
                            {msg.status === 'processed' && (
                              <>
                                <button 
                                  onClick={() => approveAction(msg.id)}
                                  className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => rejectAction(msg.id)}
                                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Needs Review Section */}
            <div className="glass card-modern rounded-xl">
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-red-500/10">
                <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                  <AlertCircle size={20} className="text-yellow-400" />
                  Needs Admin Review ({reviewMessages.length})
                </h3>
                <p className="text-sm text-gray-400">Requires manual intervention</p>
              </div>
              
              <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                {reviewMessages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle2 size={48} className="mx-auto mb-2 opacity-50" />
                    <p>All messages processed!</p>
                  </div>
                ) : (
                  reviewMessages.map(msg => (
                    <div key={msg.id} className={`p-4 hover:bg-white/5 transition-colors ${
                      msg.status === 'urgent' ? 'bg-red-500/5' : ''
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-100">{msg.from_name}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                              msg.status === 'urgent' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {msg.status === 'urgent' && <Zap size={10} />}
                              {msg.status === 'urgent' ? 'Urgent' : 'Review Required'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{msg.message}</p>

                          {/* Action Buttons - WITH DELETE BUTTON */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => processMessageWithAI(msg)}
                              className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 flex items-center gap-1"
                            >
                              <Bot size={12} />
                              Process with AI
                            </button>
                            <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30">
                              Manual Reply
                            </button>
                            <button className="px-3 py-1 text-xs glass text-gray-300 rounded hover:bg-white/10">
                              Create Job
                            </button>
                            
                            <button 
                              onClick={() => deleteMessage(msg.id, msg.from_name)}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-1"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Processing Overlay - Only show in messages view */}
      {isProcessing && viewMode === 'messages' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="glass rounded-xl shadow-2xl p-8 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <Brain size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">AI Processing</h3>
              <p className="text-sm text-gray-400 mb-4">
                Analyzing message and determining best action...
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></div>
                  <span>Understanding intent...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full pulse-dot"></div>
                  <span>Extracting information...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-purple-500 rounded-full pulse-dot"></div>
                  <span>Generating response...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scheduling', label: 'Job Scheduling', icon: Calendar },
    { id: 'quotes', label: 'Quotes', icon: DollarSign },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'crew_accounts', label: 'Crew Management', icon: Shield },
    { id: 'weather', label: 'Weather AI', icon: Cloud },
    { id: 'predictive', label: 'Predictive AI', icon: TrendingUp },
    

  ];

  return (
    <div className="flex h-screen">
      {/* ADD: Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white shadow-lg"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* MODIFY: Make sidebar responsive */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
        ${isMobile && !mobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        w-64 glass-dark transition-transform duration-300 ease-in-out
      `}>
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold gradient-text">🌱 Bright.AI</h1>
          <p className="text-sm text-gray-400">Admin Dashboard</p>
        </div>
        <nav className="p-4 space-y-2">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                  : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

       {/* ADD: Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
<div className={`flex-1 overflow-auto ${isMobile ? 'w-full' : ''}`}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-gray-800 p-4 pl-14 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-lg font-semibold text-white">
              {adminTabs.find(t => t.id === activeTab)?.label}
            </h2>
            <button
              onClick={fetchAllData}
              className="p-2 text-gray-400 hover:text-white"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
        
        {/* Wrap content with padding on mobile */}
        <div className={isMobile ? 'pb-20' : ''}>
          {activeTab === 'dashboard' && <DashboardView isMobile={isMobile} />}
          {activeTab === 'scheduling' && <SchedulingView isMobile={isMobile} />}
          {activeTab === 'quotes' && <QuotesView isMobile={isMobile} />}
          {activeTab === 'messages' && <MessagesView isMobile={isMobile} />}
          {activeTab === 'crew' && <CrewManagementPanel isMobile={isMobile} />}
          {activeTab === 'weather' && <WeatherIntelligence isMobile={isMobile} />}
          {activeTab === 'predictive' && <PredictiveMaintenance isMobile={isMobile} />}
          {activeTab === 'crew_accounts' && <CrewManagementPanel isMobile={isMobile}/>}
          {activeTab === 'reset' && <DataResetTool isMobile={isMobile} />}
       </div>
      </div>
    </div>
  );
}



// Modified CrewApp with real user data and proper syncing
// COMPLETE REPLACEMENT for your CrewApp function
// This removes ALL map code and fixes all glitches

function CrewApp({ currentUser }) {
  const [activeView, setActiveView] = useState('menu');
  const [clockedIn, setClockedIn] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    rating: 5.0,
    totalHours: 0,
    weeklyJobs: 0
  });

  // Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadUserData();
      fetchJobs();
    }
  }, [currentUser]);

  // Load user stats
  const loadUserData = async () => {
    try {
      const crewData = await supabase.fetchData('crew_members');
      const member = crewData.find(c => 
        c.employee_id === currentUser?.employeeId || 
        c.id === currentUser?.id
      );
      
      if (member) {
        setUserStats({
          rating: member.rating || 5.0,
          totalHours: member.hours_worked || 0,
          weeklyJobs: member.jobs_completed || 0
        });
        setClockedIn(member.clock_status === 'clocked_in');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Fetch jobs for team
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const jobsData = await supabase.fetchData('jobs');
      const teamJobs = jobsData.filter(job => 
        job.crew === currentUser?.team || 
        job.assigned_crew === currentUser?.team ||
        job.status === 'Scheduled'
      );
      setJobs(teamJobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Update job status
  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const result = await supabase.updateData('jobs', jobId, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      if (result) {
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, status: newStatus, completedAt: newStatus === 'Completed' ? new Date().toISOString() : null }
            : job
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
    return false;
  };

  // Handle clock in/out
  const handleClockInOut = async () => {
    const newStatus = !clockedIn;
    setClockedIn(newStatus);
    
    try {
      const crewData = await supabase.fetchData('crew_members');
      const member = crewData.find(c => 
        c.employee_id === currentUser?.employeeId || c.id === currentUser?.id
      );
      
      if (member) {
        await supabase.updateData('crew_members', member.id, {
          clock_status: newStatus ? 'clocked_in' : 'clocked_out',
          last_clock: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating clock:', error);
      setClockedIn(!newStatus);
    }
  };

  // Menu View
  const MenuView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="px-6 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Bright.AI</h1>
        <p className="text-green-300 mb-1 font-semibold">{currentUser?.team || 'Team'}</p>
        <p className="text-green-400 text-sm">
          {clockedIn ? '🟢 Online' : '⚪ Offline'}
        </p>
      </div>

      <div className="px-6 pb-8">
        <div className="space-y-4">
          <button 
            onClick={() => setActiveView('work')}
            className="w-full glass card-modern rounded-xl p-6"
          >
            <Briefcase className="mx-auto mb-3 text-green-400" size={40} />
            <h2 className="text-xl font-bold text-gray-100 mb-1">WORK</h2>
            <p className="text-gray-400 text-sm">View jobs and clock in/out</p>
            {jobs.filter(j => j.status !== 'Completed').length > 0 && (
              <span className="inline-block mt-2 px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-xs font-bold">
                {jobs.filter(j => j.status !== 'Completed').length} Active
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className="w-full glass card-modern rounded-xl p-6"
          >
            <User className="mx-auto mb-3 text-blue-400" size={40} />
            <h2 className="text-xl font-bold text-gray-100 mb-1">PROFILE</h2>
            <p className="text-gray-400 text-sm">View your stats</p>
          </button>
        </div>
        
        <button 
          onClick={() => {
            authService.logout();
            window.location.reload();
          }}
          className="w-full mt-8 py-3 border-2 border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
        >
          <LogOut className="inline mr-2" size={18} />
          Log Out
        </button>
      </div>
    </div>
  );

// Fixed WorkView Component - Replace this entire function in your App.js
const WorkView = () => {
  // LOCAL STATE MANAGEMENT - No dependencies on parent state updates
  const [localJobs, setLocalJobs] = useState(jobs);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [expandedJob, setExpandedJob] = useState(true);
  const [bottomFilter, setBottomFilter] = useState('upcoming');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Update local jobs when parent jobs change
  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);
  
  // Filter jobs locally
  const activeJobs = localJobs.filter(j => 
    j.status === 'Scheduled' || j.status === 'In Progress'
  );
  const completedJobs = localJobs.filter(j => j.status === 'Completed');
  const skippedJobs = localJobs.filter(j => j.status === 'Skipped');
  const currentJob = activeJobs[currentJobIndex] || null;
  const upcomingJobs = activeJobs.slice(currentJobIndex + 1);
  
  // START JOB - Manages state locally first
  const handleStartJob = () => {
    if (!currentJob || !clockedIn || isProcessing) return;
    
    console.log('Starting job locally');
    setIsWorking(true);
    
    // Update local state immediately
    const updatedJobs = localJobs.map(job => 
      job.id === currentJob.id 
        ? { ...job, status: 'In Progress' }
        : job
    );
    setLocalJobs(updatedJobs);
    
    // Sync with database in background (no await)
    supabase.updateData('jobs', currentJob.id, { 
      status: 'In Progress',
      started_at: new Date().toISOString()
    }).catch(err => console.error('DB sync failed:', err));
  };
  
  // COMPLETE JOB - Fixed with local state management
  const handleCompleteJob = () => {
    if (!currentJob || isProcessing) return;
    
    setIsProcessing(true);
    console.log('Completing job locally');
    
    // Update local state FIRST
    const updatedJobs = localJobs.map(job => 
      job.id === currentJob.id 
        ? { ...job, status: 'Completed' }
        : job
    );
    setLocalJobs(updatedJobs);
    
    // Reset work state
    setIsWorking(false);
    
    // Move to next job after a brief delay
    setTimeout(() => {
      if (currentJobIndex < activeJobs.length - 1) {
        setCurrentJobIndex(prev => prev + 1);
      } else {
        setCurrentJobIndex(0);
      }
      setIsProcessing(false);
    }, 200);
    
    // Sync with database in background
    supabase.updateData('jobs', currentJob.id, { 
      status: 'Completed',
      completed_at: new Date().toISOString()
    }).catch(err => console.error('DB sync failed:', err));
  };
  
  // SKIP JOB - Local state management
  const handleSkipJob = () => {
    if (!currentJob || isProcessing) return;
    
    console.log('Skipping job locally');
    
    // Update local state
    const updatedJobs = localJobs.map(job => 
      job.id === currentJob.id 
        ? { ...job, status: 'Skipped' }
        : job
    );
    setLocalJobs(updatedJobs);
    setIsWorking(false);
    
    // Sync with database
    supabase.updateData('jobs', currentJob.id, { 
      status: 'Skipped',
      skipped_at: new Date().toISOString()
    }).catch(err => console.error('DB sync failed:', err));
  };
  
  // REDO JOB - Restore to scheduled
  const handleRedoJob = (jobId) => {
    console.log('Restoring job:', jobId);
    
    // Update local state
    const updatedJobs = localJobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'Scheduled' }
        : job
    );
    setLocalJobs(updatedJobs);
    
    // Sync with database
    supabase.updateData('jobs', jobId, { 
      status: 'Scheduled',
      restored_at: new Date().toISOString()
    }).catch(err => console.error('DB sync failed:', err));
  };
  
  // Get filtered jobs for bottom list
  const getFilteredJobs = () => {
    switch(bottomFilter) {
      case 'upcoming': return upcomingJobs;
      case 'completed': return completedJobs;
      case 'skipped': return skippedJobs;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setActiveView('menu')} 
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-lg text-white">Today's Work</h1>
            <p className="text-xs text-gray-400">
              {activeJobs.length} active • {skippedJobs.length} skipped
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Clock Status Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              clockedIn ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {clockedIn ? 'ON' : 'OFF'}
            </div>
            
            {/* Clock Out Button - Shows only when clocked in */}
            {clockedIn && (
              <button
                onClick={handleClockInOut}
                className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
              >
                <Clock size={12} />
                Clock Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clock In Reminder - Shows when NOT clocked in */}
      {!clockedIn && (
        <div className="m-4 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
          <p className="text-yellow-300 text-sm font-medium text-center mb-3">
            ⚠️ Please clock in to start working
          </p>
          <button
            onClick={handleClockInOut}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600"
          >
            <Clock className="inline mr-2" size={20} />
            CLOCK IN TO START
          </button>
        </div>
      )}

      {/* Clocked In Status Bar - Shows when clocked in */}
      {clockedIn && (
        <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Clocked In</span>
            </div>
            <span className="text-xs text-gray-400">
              Started: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>
      )}

      {/* Current Job Card */}
      {currentJob ? (
        <div className="p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            {/* Job Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">
                    {currentJob.customer}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {currentJob.type || currentJob.service || 'Lawn Service'}
                  </p>
                  {!expandedJob && currentJob.address && (
                    <p className="text-blue-200 text-xs mt-2 truncate">
                      📍 {currentJob.address}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Skip Button - Only show if not working */}
                  {!isWorking && (
                    <button
                      onClick={handleSkipJob}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-yellow-500/30 text-yellow-200 rounded-lg text-xs font-medium hover:bg-yellow-500/40"
                    >
                      Skip
                    </button>
                  )}
                  {/* Expand Button */}
                  <button
                    onClick={() => setExpandedJob(!expandedJob)}
                    className="p-1 hover:bg-blue-500/30 rounded-lg"
                  >
                    <ChevronRight 
                      size={24} 
                      className={`text-white transform transition-transform ${
                        expandedJob ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Job Details */}
            {expandedJob && (
              <div className="p-4 space-y-3 bg-gray-850">
                {currentJob.address && (
                  <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <MapPin className="text-blue-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-300">Service Address</p>
                      <p className="text-white">{currentJob.address}</p>
                    </div>
                  </div>
                )}

                {currentJob.equipment && (
                  <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-yellow-400">🔧</span>
                    <div>
                      <p className="text-sm text-gray-300">Equipment</p>
                      <p className="text-white">{currentJob.equipment}</p>
                    </div>
                  </div>
                )}

                {currentJob.notes && (
                  <div className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                    <AlertCircle className="text-orange-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-300">Instructions</p>
                      <p className="text-white">{currentJob.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="p-4 bg-gray-850 border-t border-gray-700">
              {!isWorking ? (
                <button
                  onClick={handleStartJob}
                  disabled={!clockedIn || isProcessing}
                  className={`w-full py-3 rounded-lg font-bold text-white text-lg ${
                    !clockedIn || isProcessing
                      ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                  }`}
                >
                  {!clockedIn ? 'CLOCK IN FIRST' : isProcessing ? 'PROCESSING...' : 'START JOB'}
                </button>
              ) : (
                <button
                  onClick={handleCompleteJob}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-lg font-bold text-white text-lg ${
                    isProcessing
                      ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {isProcessing ? 'PROCESSING...' : '✅ COMPLETE JOB'}
                </button>
              )}
              
              {isWorking && !isProcessing && (
                <p className="text-center text-sm text-green-400 mt-2 animate-pulse">
                  Job in progress...
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Active Jobs</h3>
          <p className="text-gray-400 mt-1">
            {skippedJobs.length > 0 ? `${skippedJobs.length} jobs skipped` : 'All done!'}
          </p>
        </div>
      )}

      {/* Bottom Filtered Lists */}
      <div className="px-4 pb-20">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3 bg-gray-800 rounded-lg p-1">
          {['upcoming', 'completed', 'skipped'].map(filter => (
            <button
              key={filter}
              onClick={() => setBottomFilter(filter)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                bottomFilter === filter
                  ? `${filter === 'upcoming' ? 'bg-blue-600' : filter === 'completed' ? 'bg-green-600' : 'bg-yellow-600'} text-white`
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)} (
                {filter === 'upcoming' ? upcomingJobs.length : 
                 filter === 'completed' ? completedJobs.length : 
                 skippedJobs.length}
              )
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-2">
          {getFilteredJobs().length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">
              No {bottomFilter} jobs
            </p>
          ) : (
            getFilteredJobs().map((job, index) => (
              <div
                key={job.id}
                className={`rounded-lg p-4 border ${
                  bottomFilter === 'completed' 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : bottomFilter === 'skipped'
                    ? 'bg-yellow-900/20 border-yellow-800'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${
                      bottomFilter === 'completed' ? 'text-gray-300 line-through' : 'text-white'
                    }`}>
                      {job.customer}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {job.type || job.service || 'Service'}
                    </p>
                    {job.address && (
                      <p className="text-xs text-gray-500 mt-1">📍 {job.address}</p>
                    )}
                  </div>
                  
                  {(bottomFilter === 'completed' || bottomFilter === 'skipped') && (
                    <button
                      onClick={() => handleRedoJob(job.id)}
                      className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded text-xs font-medium"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
  // Profile View
  const ProfileView = () => {
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const initials = currentUser?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'U';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="glass-dark">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setActiveView('menu')} className="p-2">
              <ChevronLeft size={24} />
            </button>
            <h1 className="font-bold text-lg text-gray-100">Profile</h1>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="glass card-modern rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-100">{currentUser?.name || 'Crew Member'}</h2>
            <p className="text-gray-400">{currentUser?.team || 'Team'}</p>
            <p className="text-sm text-gray-500">ID: {currentUser?.employeeId || 'N/A'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="text-yellow-400 fill-current" size={16} />
              <span className="font-semibold text-gray-100">{userStats.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">rating</span>
            </div>
          </div>

          <div className="glass card-modern rounded-xl p-4">
            <h3 className="font-semibold text-gray-100 mb-3">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Jobs Completed Today</span>
                <span className="font-bold text-gray-100">{completedJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total This Week</span>
                <span className="font-bold text-gray-100">{userStats.weeklyJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Hours Worked</span>
                <span className="font-bold text-gray-100">{userStats.totalHours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${clockedIn ? 'text-green-400' : 'text-gray-400'}`}>
                  {clockedIn ? 'Working' : 'Off Duty'}
                </span>
              </div>
            </div>
          </div>

          {(currentUser?.email || currentUser?.phone) && (
            <div className="glass card-modern rounded-xl p-4">
              <h3 className="font-semibold text-gray-100 mb-3">Contact Info</h3>
              <div className="space-y-2">
                {currentUser?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="text-gray-400" size={16} />
                    <span className="text-gray-300 text-sm">{currentUser.email}</span>
                  </div>
                )}
                {currentUser?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="text-gray-400" size={16} />
                    <span className="text-gray-300 text-sm">{currentUser.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <>
      {activeView === 'menu' && <MenuView />}
      {activeView === 'work' && <WorkView />}
      {activeView === 'profile' && <ProfileView />}
      {activeView === 'reset' && <DataResetTool />}
    </>
  );
}

// First-Time Setup Component
function FirstTimeSetup({ onSetupComplete, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState({
    companyName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const handleSetup = async () => {
  if (!setupData.companyName || !setupData.adminEmail || !setupData.adminPassword) {
    setError('Please fill in all fields');
    return;
  }

  if (setupData.adminPassword !== setupData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (setupData.adminPassword.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Generate unique company ID
    const companyId = 'company_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Set company context
    localStorage.setItem('currentCompanyId', companyId);
    
    // Create company in Supabase
    const companyData = {
      id: companyId,
      name: setupData.companyName,
      email: setupData.adminEmail,
      subscription_plan: 'trial',
      subscription_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    await supabase.insertData('companies', companyData);
    
    // Create admin account
    const adminData = {
      email: setupData.adminEmail,
      password_hash: btoa(setupData.adminPassword),
      company_name: setupData.companyName,
      company_id: companyId,
      role: 'admin',
      is_active: true
    };
    
    await supabase.insertData('admin_accounts', adminData);
    
    // Wait a moment for database to sync
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to auto-login
    const loginResult = await authService.loginAdmin(
      setupData.adminEmail,
      setupData.adminPassword
    );

    if (loginResult.success) {
      onSetupComplete(loginResult.data);
    } else {
      // If auto-login fails, show success message and redirect to login
      alert('Account created successfully! Please login with your credentials.');
      window.location.reload();
    }
  } catch (err) {
    console.error('Setup error:', err);
    setError('Setup failed. Please try again.');
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 glass rounded-full mb-4">
            <div className="text-3xl font-bold text-white">BRIGHT</div>
            <div className="text-xs text-green-200">LANDSCAPING AI</div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Bright.AI</h1>
          <p className="text-green-200">Let's set up your landscaping business</p>
        </div>

        <div className="glass backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-2xl border border-white/20">
          {step === 1 ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Company Setup</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={setupData.companyName}
                    onChange={(e) => setSetupData({ ...setupData, companyName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400"
                    placeholder="Bright Landscaping LLC"
                  />
                </div>
                <button
                  onClick={() => {
                    if (setupData.companyName) {
                      setStep(2);
                      setError('');
                    } else {
                      setError('Please enter your company name');
                    }
                  }}
                  className="w-full py-3 btn-gradient-primary rounded-lg font-semibold"
                >
                  Next: Create Admin Account
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Admin Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={setupData.adminEmail}
                    onChange={(e) => setSetupData({ ...setupData, adminEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400"
                    placeholder="admin@company.com"
                  />
                </div>
                
                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={setupData.adminPassword}
                    onChange={(e) => setSetupData({ ...setupData, adminPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-green-200 text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={setupData.confirmPassword}
                    onChange={(e) => setSetupData({ ...setupData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-green-200/50 focus:outline-none focus:border-green-400"
                    placeholder="Re-enter password"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 glass text-gray-300 rounded-lg font-semibold hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSetup}
                    disabled={loading}
                    className="flex-1 py-3 btn-gradient-primary rounded-lg font-semibold"
                  >
                    {loading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </div>
            </>
          )}
       </div>
        
        {/* Add login link */}
        <div className="text-center mt-4">
  <button
    type="button"
    onClick={() => {
      localStorage.setItem('showLogin', 'true')
      window.location.reload();
    }}
    className="text-green-200 hover:text-white underline text-base p-3"
  >
    Already have an account? Login here
  </button>
</div>
      </div>
    </div>
  );
}


// Main App Component
function BrightAIApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
  const initAuth = async () => {
    // Check if user wants to skip setup
    const forceLogin = localStorage.getItem('forceLogin');
    if (forceLogin === 'true') {
      setIsFirstTimeSetup(false);
      setShowSetup(false);
      localStorage.removeItem('forceLogin');
      setLoading(false);
      return;
    }

    // Normal auth check
    const authData = await authService.init();
    if (authData) {
      setIsAuthenticated(true);
      setUserRole(authData.role);
      setCurrentUser(authData.user);
    } else {
      const needsSetup = await authService.checkFirstTimeSetup();
      setIsFirstTimeSetup(needsSetup);
    }
    setLoading(false);
  };
  initAuth();
}, []);

  const handleLoginSuccess = (authData) => {
    setIsAuthenticated(true);
    setUserRole(authData.role);
    setCurrentUser(authData.user);
  };

  const handleLogout = () => {
  authService.logout();
  supabase.clearCompanyContext(); // ADD THIS LINE
  localStorage.clear(); // Clear all localStorage
  setIsAuthenticated(false);
  setUserRole(null);
  setCurrentUser(null);
  window.location.reload(); // Force clean reload
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-white mb-4" size={48} />
          <p className="text-white text-lg">Loading Bright.AI...</p>
        </div>
      </div>
    );
  }

// Show setup or login based on state
if (!isAuthenticated) {
  // Check localStorage for what to show
  const showLoginPage = localStorage.getItem('showLogin') === 'true';
  
  if (showLoginPage) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSetup={() => {
          localStorage.removeItem('showLogin');
          window.location.reload();
        }}
      />
    );
  } else if (isFirstTimeSetup || showSetup) {
    return (
      <FirstTimeSetup 
        onSetupComplete={handleLoginSuccess}
        onSwitchToLogin={() => {
          localStorage.setItem('showLogin', 'true');
          window.location.reload();
        }}
      />
    );
  } else {
    // Default to login if no setup needed
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSetup={() => setShowSetup(true)}
      />
    );
  }
}
  // Show appropriate app based on user role
  if (userRole === 'admin') {
    return (
      <div className="min-h-screen">
        {/* Add logout button in top-right */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
        
        {/* Your existing AdminApp component */}
        <AdminApp />
      </div>
    );
  } else if (userRole === 'crew') {
    return (
      <div className="min-h-screen">
        {/* Add logout button for crew */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="px-3 py-2 glass text-white rounded-lg flex items-center gap-2"
          >
            <LogOut size={16} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
        
        {/* Pass currentUser to CrewApp - THIS IS THE FIX! */}
        <CrewApp currentUser={currentUser} />
      </div>
    );
  }

  return null;
}

export default BrightAIApp;
window.authService = authService;