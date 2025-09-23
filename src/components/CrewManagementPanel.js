// components/CrewManagementPanel.js
// ENHANCED VERSION - Replace your existing CrewManagementPanel.js with this

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit2, Trash2, Key, Save, X, 
  Shield, Phone, Mail, MapPin, Clock, Award,
  AlertCircle, CheckCircle, Eye, EyeOff, Search,
  Download, Upload, Filter, Star, TrendingUp,
  Calendar, DollarSign, Activity, ChevronDown,
  UserCheck, Settings, RefreshCw, BarChart3,
  Briefcase, ArrowLeftRight, Info
} from 'lucide-react';
import { supabase } from '../services/database/supabase';
import { authService } from '../services/auth/authService';

const CrewManagementPanel = ({ isMobile }) => {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [showPinReset, setShowPinReset] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPin, setShowPin] = useState({});
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [showTeamTransfer, setShowTeamTransfer] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    pin: '',
    email: '',
    phone: '',
    team: 'Team Alpha',
    role: 'crew',
    hourlyRate: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Teams configuration
  const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Unassigned'];
  const roles = ['crew', 'crew_leader', 'supervisor', 'manager'];
  
  // Team colors for visual distinction
  const teamColors = {
    'Team Alpha': 'green',
    'Team Beta': 'blue', 
    'Team Gamma': 'purple',
    'Team Delta': 'orange',
    'Unassigned': 'gray'
  };

  // Load crew members on mount
  useEffect(() => {
    loadCrewMembers();
  }, []);

  const loadCrewMembers = async () => {
    setLoading(true);
    try {
      const crewData = await supabase.fetchData('crew_members');
      // Ensure all crew members have required fields
      const processedCrew = (crewData || []).map(member => ({
        ...member,
        team: member.team || 'Unassigned',
        status: member.status || 'active',
        is_active: member.is_active !== false,
        rating: member.rating || 5.0,
        hours_worked: member.hours || 0,
        jobs_completed: member.jobs_completed || 0,
        hourly_rate: member.hourly_rate || 0
      }));
      setCrews(processedCrew);
    } catch (error) {
      console.error('Error loading crew:', error);
      showMessage('error', 'Failed to load crew members');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const generateEmployeeId = () => {
    const prefix = 'EMP';
    const number = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${prefix}${number}`;
  };

  const generatePin = () => {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  };

  const handleAddCrew = async () => {
    if (!formData.name || !formData.employeeId || !formData.pin) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.createCrewMember({
        ...formData,
        status: 'active',
        is_active: true
      });
      
      if (result.success) {
        showMessage('success', `${formData.name} added to ${formData.team}! Employee ID: ${formData.employeeId}, PIN: ${formData.pin}`);
        setShowAddForm(false);
        setFormData({
          name: '',
          employeeId: '',
          pin: '',
          email: '',
          phone: '',
          team: 'Team Alpha',
          role: 'crew',
          hourlyRate: '',
          startDate: new Date().toISOString().split('T')[0]
        });
        loadCrewMembers();
      } else {
        showMessage('error', result.error || 'Failed to add crew member');
      }
    } catch (error) {
      console.error('Error adding crew:', error);
      showMessage('error', 'Failed to add crew member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCrew = async (employeeId, updates) => {
    setLoading(true);
    try {
      const result = await authService.updateCrewMember(employeeId, updates);
      
      if (result.success) {
        showMessage('success', 'Crew member updated successfully');
        setEditingCrew(null);
        loadCrewMembers();
      } else {
        showMessage('error', result.error || 'Failed to update crew member');
      }
    } catch (error) {
      console.error('Error updating crew:', error);
      showMessage('error', 'Failed to update crew member');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamTransfer = async (employeeId, currentTeam, newTeam) => {
    if (currentTeam === newTeam) {
      showMessage('error', 'Please select a different team');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.updateCrewMember(employeeId, { team: newTeam });
      
      if (result.success) {
        showMessage('success', `Crew member transferred from ${currentTeam} to ${newTeam}`);
        setShowTeamTransfer(null);
        loadCrewMembers();
      } else {
        showMessage('error', 'Failed to transfer crew member');
      }
    } catch (error) {
      console.error('Error transferring crew member:', error);
      showMessage('error', 'Failed to transfer crew member');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (employeeId, crewName) => {
    const newPin = generatePin();
    setLoading(true);
    
    try {
      const result = await authService.resetCrewPin(employeeId, newPin);
      
      if (result.success) {
        showMessage('success', `PIN reset for ${crewName}. New PIN: ${newPin} (Write this down!)`);
        setShowPinReset(null);
        setShowPin({ ...showPin, [employeeId]: newPin });
        setTimeout(() => {
          const updatedShowPin = { ...showPin };
          delete updatedShowPin[employeeId];
          setShowPin(updatedShowPin);
        }, 15000);
        loadCrewMembers();
      } else {
        showMessage('error', result.error || 'Failed to reset PIN');
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      showMessage('error', 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrew = async (employeeId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}? They won't be able to log in.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await authService.deleteCrewMember(employeeId);
      
      if (result.success) {
        showMessage('success', 'Crew member deactivated successfully');
        loadCrewMembers();
      } else {
        showMessage('error', result.error || 'Failed to deactivate crew member');
      }
    } catch (error) {
      console.error('Error deleting crew:', error);
      showMessage('error', 'Failed to deactivate crew member');
    } finally {
      setLoading(false);
    }
  };

  // Filter crew members
  const filteredCrews = crews.filter(crew => {
    const matchesSearch = crew.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crew.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crew.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === 'all' || crew.team === filterTeam;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && crew.is_active !== false) ||
                         (filterStatus === 'inactive' && crew.is_active === false);
    return matchesSearch && matchesTeam && matchesStatus;
  });

  // Calculate team stats
  const getTeamStats = (teamName) => {
    const teamMembers = crews.filter(c => c.team === teamName && c.is_active !== false);
    return {
      count: teamMembers.length,
      avgRating: teamMembers.length > 0 
        ? (teamMembers.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / teamMembers.length).toFixed(1)
        : 0,
      totalHours: teamMembers.reduce((sum, m) => sum + (m.hours_worked || 0), 0),
      totalJobs: teamMembers.reduce((sum, m) => sum + (m.jobs_completed || 0), 0)
    };
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {teams.map(team => {
          const stats = getTeamStats(team);
          const color = teamColors[team];
          
          return (
            <div key={team} className="glass card-modern rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
                 onClick={() => setFilterTeam(team)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-100">{team}</h3>
                <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Members</span>
                  <span className="text-xl font-bold text-white">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Avg Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-current" size={14} />
                    <span className="font-semibold text-white">{stats.avgRating}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Hours</span>
                  <span className="font-semibold text-white">{stats.totalHours}</span>
                </div>
              </div>

              <button className={`w-full mt-4 py-2 bg-${color}-500/20 text-${color}-400 rounded-lg hover:bg-${color}-500/30 text-sm font-medium`}>
                View Team
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Crew</p>
          <p className="text-2xl font-bold text-white">{crews.length}</p>
        </div>
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Active Today</p>
          <p className="text-2xl font-bold text-green-400">
            {crews.filter(c => c.clock_status === 'clocked_in').length}
          </p>
        </div>
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-400">
            {crews.length > 0 
              ? (crews.reduce((sum, c) => sum + (parseFloat(c.rating) || 0), 0) / crews.length).toFixed(1)
              : '0.0'} ★
          </p>
        </div>
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Teams Active</p>
          <p className="text-2xl font-bold text-blue-400">
            {teams.filter(t => getTeamStats(t).count > 0).length}
          </p>
        </div>
      </div>
    </div>
  );

  // Crew List Tab Component  
  const CrewListTab = () => (
    <div className="space-y-4">
      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
          />
        </div>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
        >
          <option value="all">All Teams</option>
          {teams.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={loadCrewMembers}
          className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Crew Members Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading crew members...</div>
        ) : filteredCrews.length === 0 ? (
          <div className="glass p-8 rounded-xl text-center">
            <Users className="mx-auto mb-4 text-gray-500" size={48} />
            <p className="text-gray-400">
              {searchTerm || filterTeam !== 'all' || filterStatus !== 'all'
                ? 'No crew members found matching your filters'
                : 'No crew members added yet'}
            </p>
            {!searchTerm && filterTeam === 'all' && filterStatus === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 btn-gradient-primary rounded-lg inline-flex items-center gap-2"
              >
                <UserPlus size={18} />
                Add First Crew Member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCrews.map((crew) => {
              const employeeId = crew.employee_id || crew.employeeId;
              const color = teamColors[crew.team] || 'gray';
              
              return (
                <div
                  key={crew.id}
                  className={`glass p-4 rounded-xl transition-all hover:scale-102 ${
                    crew.is_active === false || crew.status === 'inactive' 
                      ? 'opacity-60' 
                      : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-${color}-500/20 flex items-center justify-center`}>
                        <span className={`text-${color}-400 font-bold`}>
                          {crew.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{crew.name}</h3>
                        <p className="text-xs text-gray-400">{employeeId || 'No ID'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {crew.clock_status === 'clocked_in' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          Active
                        </span>
                      )}
                      {(crew.is_active === false || crew.status === 'inactive') && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Team</span>
                      <span className={`px-2 py-1 bg-${color}-500/20 text-${color}-400 rounded font-medium`}>
                        {crew.team}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Role</span>
                      <span className="text-white">
                        {crew.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-current" size={14} />
                        <span className="text-white">{crew.rating || '5.0'}</span>
                      </div>
                    </div>
                    {crew.phone && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Phone</span>
                        <span className="text-white">{crew.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Show PIN if recently reset */}
                  {showPin[employeeId] && (
                    <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                      <p className="text-yellow-300 text-sm font-mono">
                        🔑 PIN: {showPin[employeeId]} (Write this down!)
                      </p>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex gap-2">
                    {employeeId && (
                      <>
                        <button
                          onClick={() => setShowTeamTransfer(crew.id)}
                          className="flex-1 py-2 glass text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm flex items-center justify-center gap-1"
                          title="Transfer Team"
                        >
                          <ArrowLeftRight size={16} />
                          Transfer
                        </button>
                        <button
                          onClick={() => setEditingCrew(crew.id)}
                          className="flex-1 py-2 glass text-gray-300 rounded-lg hover:bg-white/10 text-sm"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPin(employeeId, crew.name)}
                          className="p-2 glass text-yellow-400 rounded-lg hover:bg-yellow-500/20"
                          title="Reset PIN"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCrew(employeeId, crew.name)}
                          className="p-2 glass text-red-400 rounded-lg hover:bg-red-500/20"
                          title="Deactivate"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Team Transfer Modal */}
                  {showTeamTransfer === crew.id && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm mb-2">Transfer {crew.name} to:</p>
                      <select
                        className="w-full p-2 bg-black/30 border border-white/10 rounded text-white mb-2"
                        onChange={(e) => handleTeamTransfer(employeeId, crew.team, e.target.value)}
                      >
                        <option value="">Select new team...</option>
                        {teams.filter(t => t !== crew.team).map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowTeamTransfer(null)}
                        className="w-full py-1 glass text-gray-400 rounded hover:bg-white/10 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Edit Mode */}
                  {editingCrew === crew.id && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="glass rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-white mb-4">Edit Crew Member</h3>
                        <div className="space-y-3">
                          <input
                            type="text"
                            defaultValue={crew.name}
                            placeholder="Name"
                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                            id={`name-${crew.id}`}
                          />
                          <input
                            type="email"
                            defaultValue={crew.email}
                            placeholder="Email"
                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                            id={`email-${crew.id}`}
                          />
                          <input
                            type="tel"
                            defaultValue={crew.phone}
                            placeholder="Phone"
                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                            id={`phone-${crew.id}`}
                          />
                          <select
                            defaultValue={crew.team}
                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                            id={`team-${crew.id}`}
                          >
                            {teams.map(team => (
                              <option key={team} value={team}>{team}</option>
                            ))}
                          </select>
                          <select
                            defaultValue={crew.role}
                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                            id={`role-${crew.id}`}
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>
                                {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                const updates = {
                                  name: document.getElementById(`name-${crew.id}`).value,
                                  email: document.getElementById(`email-${crew.id}`).value,
                                  phone: document.getElementById(`phone-${crew.id}`).value,
                                  team: document.getElementById(`team-${crew.id}`).value,
                                  role: document.getElementById(`role-${crew.id}`).value
                                };
                                handleUpdateCrew(employeeId, updates);
                              }}
                              className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingCrew(null)}
                              className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 max-w-7xl mx-auto`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 gradient-text">Crew Management Center</h1>
          <p className="text-gray-400 mt-1">Manage all crew members, teams, and accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-gradient-primary px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add Crew Member
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300'
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <div className="flex-1">{message.text}</div>
        </div>
      )}

      {/* Add Crew Form */}
      {showAddForm && (
        <div className="glass p-6 rounded-xl space-y-4">
          <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
            <UserPlus size={20} />
            Add New Crew Member
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Employee ID *
                <button
                  onClick={() => setFormData({ ...formData, employeeId: generateEmployeeId() })}
                  className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Generate
                </button>
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                PIN (4-6 digits) *
                <button
                  onClick={() => setFormData({ ...formData, pin: generatePin() })}
                  className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Generate
                </button>
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="1234"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Team *</label>
              <select
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              >
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Hourly Rate</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="$25.00"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    name: '',
                    employeeId: '',
                    pin: '',
                    email: '',
                    phone: '',
                    team: 'Team Alpha',
                    role: 'crew',
                    hourlyRate: '',
                    startDate: new Date().toISOString().split('T')[0]
                  });
                }}
                className="px-4 py-2 glass text-gray-300 rounded-lg hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCrew}
                disabled={loading}
                className="px-4 py-2 btn-gradient-primary rounded-lg flex items-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Adding...' : 'Add Crew Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="glass rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'text-gray-400 hover:bg-white/10'
          }`}
        >
          <BarChart3 className="inline mr-2" size={16} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'list'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
              : 'text-gray-400 hover:bg-white/10'
          }`}
        >
          <Users className="inline mr-2" size={16} />
          All Crew ({crews.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'list' && <CrewListTab />}

      {/* Help Section */}
      <div className="glass p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <Info size={18} />
          Managing Your Crew
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div>
            <strong>Teams:</strong> Organize crew into teams for better job assignment
          </div>
          <div>
            <strong>Transfer:</strong> Move crew members between teams as needed
          </div>
          <div>
            <strong>Credentials:</strong> Each member needs Employee ID + PIN to login
          </div>
          <div>
            <strong>Status:</strong> Deactivated members cannot login but data is preserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewManagementPanel;