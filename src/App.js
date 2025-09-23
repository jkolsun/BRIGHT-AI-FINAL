import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, DollarSign, Users, MessageSquare, BarChart3, Clock, 
  CheckCircle, Bell, Camera, Send, Navigation, Star, TrendingUp, 
  Zap, Phone, RefreshCw, ChevronLeft, Home, Briefcase, 
  Activity, LogOut, ChevronRight, Filter, Download, Edit, Loader,
  Mic, MicOff, Cloud, CloudRain, Sun, Bot, Cpu, AlertCircle, Menu, X
} from 'lucide-react';

// Import services
import { supabase } from './services/database/supabase';
import { OpenAIService } from './services/ai/openai';
import { VoiceCommandService } from './services/ai/voiceCommands';
import { WeatherService } from './services/ai/weatherService';
import { Lock, User, Shield, Eye, EyeOff, Info } from 'lucide-react';
import { authService } from './services/auth/authService';

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
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [jobsData, quotesData, messagesData, crewData] = await Promise.all([
        supabase.fetchData('jobs'),
        supabase.fetchData('quotes'),
        supabase.fetchData('messages'),
        supabase.fetchData('crew_members')
      ]);
      
      setJobs(jobsData);
      setQuotes(quotesData);
      setMessages(messagesData);
      setCrewMembers(crewData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    date: new Date().toISOString().split('T')[0], // Add date field
    time: '09:00' // Add time field
  });
  
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'list', or 'team'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('all');
  
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
      // For demo purposes, distribute existing jobs across the week
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
    
    const success = await addNewJob({
      ...newJob,
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
  
  // Calendar View Component
  const CalendarView = ({ isMobile }) => (
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
      
      {/* Calendar Grid */}
<div className={isMobile ? 'space-y-3' : 'grid grid-cols-7 gap-2'}>
  {weekDates.map((date, index) => {
    const dayJobs = getJobsByDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    
    // Mobile view - simplified cards
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
                <div key={idx} className="text-xs text-gray-400 pl-3 border-l-2 border-gray-600">
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
    
    // Desktop view - YOUR EXISTING CODE
    return (
      <div 
        key={index} 
        className={`glass rounded-lg p-3 min-h-[200px] ${
          isToday ? 'ring-2 ring-green-400/50' : ''
        }`}
      >
        {/* PASTE YOUR EXISTING DESKTOP CODE HERE - lines 15-72 from your snippet */}
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
                  title={`${job.customer} - ${job.type}`}
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
  );
  
  // Team View Component
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
            
            {/* Team Stats */}
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
            
            {/* Team Jobs List */}
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
          {/* View Mode Switcher */}
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
          </div>
          
          <button onClick={fetchAllData} className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10">
            <RefreshCw className="inline mr-2" size={16} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
        {/* Main Content Area */}
        <div className={isMobile ? 'w-full' : 'lg:col-span-2'}>
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
                        <select
                          value={job.status}
                          onChange={(e) => updateJobStatus(job.id, e.target.value)}
                          className="text-sm px-2 py-1 glass rounded text-gray-100 bg-transparent"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
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
        </div>
        
        {/* Side Panel - Add New Job Form */}
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
          
          {/* Quick Stats */}
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
          
          {/* Equipment Status */}
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
  
  // Enhanced AI statistics
  const [aiStats, setAiStats] = useState({
    totalProcessed: 127,
    successRate: 94.8,
    avgResponseTime: 1.2,
    autoScheduled: 43,
    quotesGenerated: 18,
    escalated: 6,
    todayProcessed: 24,
    activeTasks: 3
  });

  // Process individual message with AI
  const processMessageWithAI = async (msg) => {
    setIsProcessing(true);
    setSelectedMessage(msg);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update message status
    const updatedMessage = {
      ...msg,
      status: 'processed',
      aiAction: 'Schedule updated automatically',
      confidence: Math.floor(Math.random() * 20) + 80,
      aiResponse: 'Thank you for your message. I\'ve updated your service schedule as requested.',
      actionTaken: {
        type: 'schedule_update',
        details: 'Rescheduled from 10 AM to 2 PM',
        jobCreated: true,
        jobId: Math.floor(Math.random() * 1000)
      }
    };
    
    setMessages(messages.map(m => m.id === msg.id ? updatedMessage : m));
    setAiStats(prev => ({
      ...prev,
      totalProcessed: prev.totalProcessed + 1,
      todayProcessed: prev.todayProcessed + 1
    }));
    
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 gradient-text">AI Message Center</h1>
          <p className="text-sm text-gray-400">Intelligent message processing and automation</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={processAllMessages}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2 shadow-lg"
            disabled={isProcessing}
          >
            <Brain size={16} className={isProcessing ? 'animate-pulse' : ''} />
            {isProcessing ? 'AI Processing...' : 'Process All with AI'}
          </button>
          <button className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10 flex items-center gap-2">
            <Settings size={16} />
            AI Settings
          </button>
        </div>
      </div>

      {/* AI Statistics Dashboard */}
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

        {/* AI Activity Graph */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">AI Activity (Last 24h)</span>
            <span className="text-xs opacity-75">Peak: 2:30 PM</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[3,5,7,4,8,12,15,18,14,20,16,22,25,19,15,12,8,10,7,5,4,3,2,3].map((val, i) => (
              <div 
                key={i} 
                className="flex-1 bg-white/30 rounded-t transition-all hover:bg-white/50"
                style={{ height: `${(val/25)*100}%` }}
              />
            ))}
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

                      {/* Admin Actions */}
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs glass text-gray-300 rounded hover:bg-white/10">
                          View Details
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

                      {/* Action Buttons */}
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

      {/* Processing Overlay */}
      {isProcessing && (
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
          {activeTab === 'crew' && <CrewManagementView isMobile={isMobile} />}
          {activeTab === 'weather' && <WeatherIntelligence isMobile={isMobile} />}
          {activeTab === 'predictive' && <PredictiveMaintenance isMobile={isMobile} />}
          {activeTab === 'crew_accounts' && <CrewManagementPanel isMobile={isMobile}/>}
       </div>
      </div>
    </div>
  );
}

// Replace your existing CrewApp function in App.js with this simplified version

// Replace your existing CrewApp function in App.js with this version that includes the map

function CrewApp() {
  const [activeView, setActiveView] = useState('menu');
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [jobsFilter, setJobsFilter] = useState('active'); // 'active' or 'completed'
  const [mapExpanded, setMapExpanded] = useState(false);
  
  // States for data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchJobs();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const jobsData = await supabase.fetchData('jobs');
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    const updated = await supabase.updateData('jobs', jobId, { status: newStatus });
    if (updated && updated.length > 0) {
      setJobs(jobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      return true;
    }
    return false;
  };

  // Map Component
  const JobMap = ({ expanded = false }) => {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);
    const [mapLoaded, setMapLoaded] = React.useState(false);

    React.useEffect(() => {
      if (typeof window !== 'undefined' && window.L && !mapLoaded) {
        initializeMap();
      }

      function initializeMap() {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }

          if (mapRef.current) {
            mapRef.current.innerHTML = '';
          }

          const map = window.L.map(mapRef.current, {
            zoomControl: expanded,
            attributionControl: false,
            dragging: expanded,
            scrollWheelZoom: expanded,
            doubleClickZoom: expanded,
            boxZoom: expanded,
            keyboard: expanded
          }).setView([40.7934, -77.8600], expanded ? 13 : 12);
          
          mapInstanceRef.current = map;
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          // Add job markers with different colors based on status
          jobs.forEach((job, index) => {
            const baseLatLng = [40.7934, -77.8600];
            const offset = 0.015;
            const lat = baseLatLng[0] + (index * offset) - 0.02;
            const lng = baseLatLng[1] + ((index % 2) * offset) - 0.01;
            
            const markerColor = job.status === 'Completed' ? '#10b981' : 
                               job.status === 'In Progress' ? '#3b82f6' : '#eab308';
            
            const marker = window.L.circleMarker([lat, lng], {
              color: markerColor,
              fillColor: markerColor,
              fillOpacity: 0.8,
              radius: expanded ? 8 : 6
            }).addTo(map);
            
            // Add popup with job info
            marker.bindPopup(`
              <div style="min-width: 150px;">
                <strong>${job.customer}</strong><br>
                ${job.type}<br>
                Status: ${job.status}<br>
                ${job.price || '$0'}
              </div>
            `);
          });

          // Add current location marker
          window.L.circleMarker([40.7934, -77.8600], {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 1,
            radius: expanded ? 10 : 8
          }).addTo(map);

          setMapLoaded(true);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [expanded, jobs]);

    return (
      <div 
        ref={mapRef} 
        className={expanded ? "h-full w-full" : "h-32 w-full"}
        style={{ minHeight: expanded ? '100vh' : '128px' }}
      />
    );
  };

  // Simple Menu View
  const MenuView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="px-6 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Bright.AI</h1>
        <p className="text-green-300 mb-1">Team Alpha</p>
        <p className="text-green-400 text-sm">Connected</p>
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
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className="w-full glass card-modern rounded-xl p-6"
          >
            <Users className="mx-auto mb-3 text-blue-400" size={40} />
            <h2 className="text-xl font-bold text-gray-100 mb-1">PROFILE</h2>
            <p className="text-gray-400 text-sm">View your stats</p>
          </button>
        </div>
        
        <button className="w-full mt-8 py-3 border-2 border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">
          Log Out
        </button>
      </div>
    </div>
  );

  // Work View with Map
  const WorkView = () => {
    // Calculate stats
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const activeJobs = jobs.filter(j => j.status === 'In Progress').length;
    const scheduledJobs = jobs.filter(j => j.status === 'Scheduled').length;
    
    // Filter jobs based on current filter
    const displayJobs = jobsFilter === 'active' 
      ? jobs.filter(job => job.status === 'Scheduled' || job.status === 'In Progress')
      : jobs.filter(job => job.status === 'Completed');

    // Expanded Map View
    if (mapExpanded) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
          <div className="absolute top-0 left-0 right-0 glass-dark z-10">
            <div className="px-4 py-3 flex items-center justify-between">
              <button onClick={() => setMapExpanded(false)} className="p-2">
                <ChevronLeft size={24} />
              </button>
              <h1 className="font-bold text-lg text-gray-100">Job Map</h1>
              <div className="w-8"></div>
            </div>
          </div>
          <div className="h-screen w-full pt-14">
            <JobMap expanded={true} />
          </div>
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-lg p-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-300">Completed</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-4">
        {/* Header */}
        <div className="glass-dark sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setActiveView('menu')} className="p-2">
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <h1 className="font-bold text-lg text-gray-100">Work Dashboard</h1>
              <p className="text-xs text-gray-400">Team Alpha</p>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${clockedIn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs">{clockedIn ? 'Active' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Map Section - Click to Expand */}
        <div className="p-4">
          <div className="glass card-modern rounded-xl overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Job Map</h3>
              <button 
                onClick={() => setMapExpanded(true)}
                className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
              >
                Expand Map
              </button>
            </div>
            <div className="relative">
              <JobMap expanded={false} />
              <div className="absolute inset-0 bg-transparent cursor-pointer" onClick={() => setMapExpanded(true)}></div>
            </div>
            <div className="p-2 bg-gray-800/50 text-xs text-center text-gray-400">
              Tap to view full map • {jobs.length} jobs in area
            </div>
          </div>
        </div>

        {/* Clock In/Out Section */}
        <div className="px-4 pb-4">
          <div className="glass card-modern rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-gray-100 mb-1">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            <button 
              onClick={() => setClockedIn(!clockedIn)}
              className={`w-full py-2 px-4 font-semibold rounded-lg transition-all text-sm ${
                clockedIn 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'btn-gradient-primary'
              }`}
            >
              {clockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-4 pb-4">
          <div className="glass card-modern rounded-xl p-3">
            <h3 className="font-semibold text-gray-100 mb-2 text-sm">Today's Statistics</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{completedJobs}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{activeJobs}</div>
                <div className="text-xs text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{scheduledJobs}</div>
                <div className="text-xs text-gray-400">Scheduled</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section with Fixed Scrolling */}
        <div className="px-4">
          <div className="glass card-modern rounded-xl p-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 500px)' }}>
            {/* Filter Buttons */}
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="font-semibold text-gray-100 text-sm">Jobs</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setJobsFilter('active')}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    jobsFilter === 'active' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' 
                      : 'glass text-gray-400'
                  }`}
                >
                  Active ({jobs.filter(job => job.status === 'Scheduled' || job.status === 'In Progress').length})
                </button>
                <button 
                  onClick={() => setJobsFilter('completed')}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                    jobsFilter === 'completed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-400/30' 
                      : 'glass text-gray-400'
                  }`}
                >
                  Completed ({jobs.filter(job => job.status === 'Completed').length})
                </button>
              </div>
            </div>
            
            {/* Jobs List with proper scrolling */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {displayJobs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <p className="font-medium text-sm">
                      {jobsFilter === 'active' ? 'No active jobs' : 'No completed jobs'}
                    </p>
                  </div>
                ) : (
                  displayJobs.map((job) => (
                    <div key={job.id} className="glass rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-100 text-sm">{job.customer}</h4>
                          <p className="text-xs text-gray-400">{job.type}</p>
                          <p className="text-xs text-gray-500">{job.address}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-100 text-sm">{job.price}</div>
                          <div className="text-xs text-gray-400">{job.equipment}</div>
                        </div>
                      </div>

                      {/* Status Badge and Actions */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          job.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {job.status}
                        </span>
                        
                        <div className="flex gap-2">
                          {job.phone && (
                            <button className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30">
                              Call
                            </button>
                          )}
                          
                          {job.status === 'Scheduled' && jobsFilter === 'active' && (
                            <button 
                              onClick={() => updateJobStatus(job.id, 'In Progress')}
                              className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            >
                              Start
                            </button>
                          )}
                          
                          {job.status === 'In Progress' && jobsFilter === 'active' && (
                            <button 
                              onClick={() => updateJobStatus(job.id, 'Completed')}
                              className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>

                      {job.instructions && (
                        <div className="mt-2 p-2 bg-amber-500/10 rounded text-xs text-gray-300 border-l-2 border-amber-400">
                          Notes: {job.instructions}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simplified Profile View
  const ProfileView = () => {
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const totalJobs = jobs.length;

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
          {/* Profile Info */}
          <div className="glass card-modern rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">JS</span>
            </div>
            <h2 className="text-xl font-bold text-gray-100">John Smith</h2>
            <p className="text-gray-400">Team Alpha</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="text-yellow-400 fill-current" size={16} />
              <span className="font-semibold text-gray-100">4.8</span>
              <span className="text-gray-500 text-sm">rating</span>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="glass card-modern rounded-xl p-4">
            <h3 className="font-semibold text-gray-100 mb-3">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Jobs Completed Today</span>
                <span className="font-bold text-gray-100">{completedJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Jobs Assigned</span>
                <span className="font-bold text-gray-100">{totalJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completion Rate</span>
                <span className="font-bold text-green-400">
                  {totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${clockedIn ? 'text-green-400' : 'text-gray-400'}`}>
                  {clockedIn ? 'Working' : 'Off Duty'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="glass card-modern rounded-xl p-4">
            <h3 className="font-semibold text-gray-100 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-3 glass text-gray-300 rounded-lg font-medium hover:bg-white/10">
                <Phone className="inline mr-2" size={18} />
                Contact Supervisor
              </button>
              <button className="w-full py-3 glass text-gray-300 rounded-lg font-medium hover:bg-white/10">
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeView === 'menu' && <MenuView />}
      {activeView === 'work' && <WorkView />}
      {activeView === 'profile' && <ProfileView />}
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
        
        {/* Your existing CrewApp component */}
        <CrewApp />
      </div>
    );
  }

  return null;
}

export default BrightAIApp;
window.authService = authService;