// components/CrewManagementPanel.js
// COMPLETE VERSION with Transfer Dropdown, Fixed Edit, and DELETE Feature

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit2, Trash2, Key, Save, X, 
  Shield, Phone, Mail, MapPin, Clock, Award,
  AlertCircle, CheckCircle, Eye, EyeOff, Search,
  Download, Upload, Filter, Star, TrendingUp,
  Calendar, DollarSign, Activity, ChevronDown,
  UserCheck, Settings, RefreshCw, BarChart3,
  Briefcase, ArrowLeftRight, Info, ChevronRight,
  Hash, CreditCard, User, ArrowLeft, Plus,
  Truck, Navigation, Power
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
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamTransfer, setShowTeamTransfer] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [teams, setTeams] = useState(['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Unassigned']);
  const [teamTrucks, setTeamTrucks] = useState({
    'Team Alpha': 'Truck 1',
    'Team Beta': 'Truck 2',
    'Team Gamma': 'Truck 3',
    'Team Delta': 'Truck 4',
    'Unassigned': 'None'
  });

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

  const roles = ['crew', 'crew_leader', 'supervisor', 'manager'];
  
  // Team colors for visual distinction
  const teamColors = {
    'Team Alpha': 'green',
    'Team Beta': 'blue', 
    'Team Gamma': 'purple',
    'Team Delta': 'orange',
    'Unassigned': 'gray'
  };

  // Transfer Dropdown Component
  const TransferDropdown = ({ crew, teams, onTransfer }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');
    
    const handleTransfer = () => {
      if (selectedTeam && selectedTeam !== crew.team) {
        onTransfer(crew.id, crew.team, selectedTeam, crew.name);
        setShowDropdown(false);
        setSelectedTeam('');
      }
    };

    return (
      <div className="relative">
        {!showDropdown ? (
          <button
            onClick={() => setShowDropdown(true)}
            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
            title="Transfer Team"
          >
            <ArrowLeftRight size={16} />
            <span className="text-xs">Transfer</span>
          </button>
        ) : (
          <div className="absolute z-20 bg-gray-800 border border-gray-700 rounded-lg p-2 min-w-[150px]">
            <p className="text-xs text-gray-400 mb-2">Transfer to:</p>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-1 bg-gray-900 border border-gray-700 rounded text-white text-sm mb-2"
              autoFocus
            >
              <option value="">Select team...</option>
              {teams
                .filter(t => t !== crew.team)
                .map(team => (
                  <option key={team} value={team}>{team}</option>
                ))
              }
            </select>
            <div className="flex gap-1">
              <button
                onClick={handleTransfer}
                disabled={!selectedTeam}
                className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
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

  // Load crew members on mount
  useEffect(() => {
    loadCrewMembers();
    loadTeams();
  }, []);

  const loadTeams = async () => {
    // Load teams from localStorage or database
    const savedTeams = localStorage.getItem('landscaping_teams');
    if (savedTeams) {
      const parsed = JSON.parse(savedTeams);
      setTeams(parsed.teams || teams);
      setTeamTrucks(parsed.trucks || teamTrucks);
    }
  };

  const saveTeams = (newTeams, newTrucks) => {
    localStorage.setItem('landscaping_teams', JSON.stringify({
      teams: newTeams,
      trucks: newTrucks
    }));
  };

  const loadCrewMembers = async () => {
    setLoading(true);
    try {
      const crewData = await supabase.fetchData('crew_members');
      const processedCrew = (crewData || []).map(member => ({
        ...member,
        name: member.name || 'Unknown',
        team: member.team || 'Unassigned',
        status: member.status || 'active',
        is_active: member.is_active !== false,
        rating: member.rating || 5.0,
        hours_worked: member.hours_worked || 0,
        jobs_completed: member.jobs_completed || 0,
        hourly_rate: member.hourly_rate || 25,
        phone: member.phone || '(555) 000-0000',
        email: member.email || '',
        role: member.role || 'crew',
        employee_id: member.employee_id || member.employeeId || 'EMP' + Math.floor(Math.random() * 10000)
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
      // Create the new member object without company_id
      const newMember = {
        name: formData.name,
        employee_id: formData.employeeId.toUpperCase(), // Ensure uppercase
        pin: formData.pin,
        email: formData.email || null,
        phone: formData.phone || null,
        team: formData.team || 'Team Alpha',
        role: formData.role || 'crew',
        hourly_rate: parseFloat(formData.hourlyRate) || 25,
        status: 'active',
        is_active: true,
        clock_status: 'clocked_out',
        rating: 5.0,
        hours_worked: 0,
        jobs_completed: 0,
        jobs_completed_today: 0,
        created_at: new Date().toISOString()
        // Removed company_id - let supabase.js handle it
      };

      const result = await supabase.insertData('crew_members', newMember);
      
      if (result) {
        showMessage('success', `${formData.name} added successfully! Employee ID: ${formData.employeeId}, PIN: ${formData.pin}`);
        
        // Reset form
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
        showMessage('error', 'Failed to add crew member. Please try again.');
      }
    } catch (error) {
      console.error('Error adding crew:', error);
      // Show more specific error message
      if (error.message.includes('duplicate')) {
        showMessage('error', 'Employee ID already exists');
      } else if (error.message.includes('column')) {
        showMessage('error', 'Database configuration issue. Contact support.');
      } else {
        showMessage('error', 'Failed to add crew member: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED UPDATE METHOD
  const handleUpdateCrew = async () => {
    if (!editModalData) return;

    setLoading(true);
    try {
      // Prepare updates object with proper field names
      const updates = {};
      
      // Only include fields that have changed and are not empty
      if (editModalData.name) updates.name = editModalData.name;
      if (editModalData.email !== undefined) updates.email = editModalData.email || null;
      if (editModalData.phone !== undefined) updates.phone = editModalData.phone || null;
      if (editModalData.team) updates.team = editModalData.team;
      if (editModalData.role) updates.role = editModalData.role;
      if (editModalData.hourly_rate !== undefined) {
        updates.hourly_rate = parseFloat(editModalData.hourly_rate) || 25;
      }

      // Direct Supabase update with better error handling
      const response = await fetch(
        `${supabase.url}/rest/v1/crew_members?id=eq.${editModalData.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.key,
            'Authorization': `Bearer ${supabase.key}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updates)
        }
      );

      if (response.ok) {
        const updatedData = await response.json();
        showMessage('success', 'Crew member updated successfully');
        setEditModalData(null);
        loadCrewMembers();
      } else {
        const errorText = await response.text();
        console.error('Update error:', errorText);
        
        // Try to parse error message
        try {
          const errorObj = JSON.parse(errorText);
          showMessage('error', `Update failed: ${errorObj.message || 'Unknown error'}`);
        } catch {
          showMessage('error', 'Failed to update crew member. Check your Supabase configuration.');
        }
      }
    } catch (error) {
      console.error('Error updating crew:', error);
      showMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // DELETE CREW MEMBER FUNCTION
  const handleDeleteCrew = async (crewId, crewName) => {
    if (!window.confirm(`Delete crew member ${crewName}? This will permanently remove all their records.`)) {
      return;
    }

    // Double confirmation for safety
    if (!window.confirm(`Are you absolutely sure? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const success = await supabase.deleteData('crew_members', crewId);
      
      if (success) {
        showMessage('success', `${crewName} has been permanently removed from the system`);
        loadCrewMembers(); // Refresh the list
      } else {
        showMessage('error', 'Failed to delete crew member. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting crew member:', error);
      showMessage('error', `Failed to delete crew member: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (crewId, currentStatus, crewName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'reactivate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} ${crewName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await supabase.updateData('crew_members', crewId, { 
        is_active: newStatus,
        status: newStatus ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      });
      
      if (result !== false) {
        showMessage('success', `${crewName} has been ${newStatus ? 'reactivated' : 'deactivated'}`);
        loadCrewMembers();
      } else {
        showMessage('error', `Failed to ${action} crew member`);
      }
    } catch (error) {
      console.error(`Error ${action}ing crew:`, error);
      showMessage('error', `Failed to ${action} crew member`);
    } finally {
      setLoading(false);
    }
  };

  // ENHANCED TRANSFER METHOD
  const handleTeamTransfer = async (crewId, currentTeam, newTeam, crewName) => {
    if (currentTeam === newTeam) {
      showMessage('error', 'Please select a different team');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${supabase.url}/rest/v1/crew_members?id=eq.${crewId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.key,
            'Authorization': `Bearer ${supabase.key}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ team: newTeam })
        }
      );

      if (response.ok) {
        showMessage('success', `${crewName} transferred from ${currentTeam} to ${newTeam}`);
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

  const handleResetPin = async (crewId, crewName) => {
    const newPin = generatePin();
    setLoading(true);
    
    try {
      const result = await supabase.updateData('crew_members', crewId, { 
        pin: newPin,
        updated_at: new Date().toISOString()
      });
      
      if (result !== false) {
        showMessage('success', `PIN reset for ${crewName}. New PIN: ${newPin} (Write this down!)`);
        setShowPinReset(null);
      } else {
        showMessage('error', 'Failed to reset PIN');
      }
    } catch (error) {
      console.error('Error resetting PIN:', error);
      showMessage('error', 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  // Team Management Functions
  const handleAddTeam = (teamName, truckAssignment) => {
    if (teams.includes(teamName)) {
      showMessage('error', 'Team already exists');
      return;
    }
    
    const newTeams = [...teams, teamName];
    const newTrucks = { ...teamTrucks, [teamName]: truckAssignment };
    
    setTeams(newTeams);
    setTeamTrucks(newTrucks);
    saveTeams(newTeams, newTrucks);
    showMessage('success', `Team ${teamName} added with ${truckAssignment}`);
  };

  const handleEditTeam = (oldName, newName, newTruck) => {
    if (oldName === 'Unassigned') {
      showMessage('error', 'Cannot edit Unassigned team');
      return;
    }
    
    const newTeams = teams.map(t => t === oldName ? newName : t);
    const newTrucks = { ...teamTrucks };
    delete newTrucks[oldName];
    newTrucks[newName] = newTruck;
    
    setTeams(newTeams);
    setTeamTrucks(newTrucks);
    saveTeams(newTeams, newTrucks);
    
    // Update crew members with the old team name
    crews.forEach(crew => {
      if (crew.team === oldName) {
        supabase.updateData('crew_members', crew.id, { team: newName });
      }
    });
    
    showMessage('success', `Team ${oldName} updated to ${newName}`);
    loadCrewMembers();
  };

  const handleDeleteTeam = (teamName) => {
    if (teamName === 'Unassigned' || teams.length <= 2) {
      showMessage('error', 'Cannot delete this team');
      return;
    }
    
    if (!window.confirm(`Delete ${teamName}? Members will be moved to Unassigned.`)) {
      return;
    }
    
    const newTeams = teams.filter(t => t !== teamName);
    const newTrucks = { ...teamTrucks };
    delete newTrucks[teamName];
    
    setTeams(newTeams);
    setTeamTrucks(newTrucks);
    saveTeams(newTeams, newTrucks);
    
    // Move crew members to Unassigned
    crews.forEach(crew => {
      if (crew.team === teamName) {
        supabase.updateData('crew_members', crew.id, { team: 'Unassigned' });
      }
    });
    
    showMessage('success', `Team ${teamName} deleted`);
    loadCrewMembers();
  };

  // Filter crews based on search and filters
  const filteredCrews = crews.filter(crew => {
    const matchesSearch = crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          crew.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === 'all' || crew.team === filterTeam;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && crew.is_active) ||
                         (filterStatus === 'inactive' && !crew.is_active);
    return matchesSearch && matchesTeam && matchesStatus;
  });

  // Get team statistics
  const getTeamStats = (teamName) => {
    const teamMembers = crews.filter(c => c.team === teamName && c.is_active);
    return {
      count: teamMembers.length,
      avgRating: teamMembers.length > 0 
        ? (teamMembers.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / teamMembers.length).toFixed(1)
        : 0,
      totalHours: teamMembers.reduce((sum, m) => sum + (m.hours_worked || 0), 0),
      totalJobs: teamMembers.reduce((sum, m) => sum + (m.jobs_completed || 0), 0),
      members: teamMembers,
      truck: teamTrucks[teamName] || 'None'
    };
  };

  // Team Manager Modal
  const TeamManagerModal = () => {
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamTruck, setNewTeamTruck] = useState('');
    const [editingTeam, setEditingTeam] = useState(null);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-dark rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Team Management</h3>
            <button
              onClick={() => setShowTeamManager(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Add New Team */}
          <div className="mb-6 p-4 bg-black/30 rounded-lg">
            <h4 className="text-white font-semibold mb-3">Add New Team</h4>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Team Name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1 p-2 bg-black/30 border border-white/10 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Truck Assignment"
                value={newTeamTruck}
                onChange={(e) => setNewTeamTruck(e.target.value)}
                className="flex-1 p-2 bg-black/30 border border-white/10 rounded-lg text-white"
              />
              <button
                onClick={() => {
                  if (newTeamName && newTeamTruck) {
                    handleAddTeam(newTeamName, newTeamTruck);
                    setNewTeamName('');
                    setNewTeamTruck('');
                  }
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Existing Teams */}
          <div className="space-y-3">
            {teams.map(team => {
              const stats = getTeamStats(team);
              const isEditing = editingTeam === team;
              
              return (
                <div key={team} className="p-4 bg-black/30 rounded-lg">
                  {isEditing ? (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        defaultValue={team}
                        id={`edit-team-${team}`}
                        className="flex-1 p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        defaultValue={teamTrucks[team]}
                        id={`edit-truck-${team}`}
                        className="flex-1 p-2 bg-black/30 border border-white/10 rounded-lg text-white"
                      />
                      <button
                        onClick={() => {
                          const newName = document.getElementById(`edit-team-${team}`).value;
                          const newTruck = document.getElementById(`edit-truck-${team}`).value;
                          handleEditTeam(team, newName, newTruck);
                          setEditingTeam(null);
                        }}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingTeam(null)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{team}</h4>
                        <p className="text-gray-400 text-sm">
                          <Truck className="inline mr-1" size={14} />
                          {teamTrucks[team]} • {stats.count} members
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {team !== 'Unassigned' && (
                          <>
                            <button
                              onClick={() => setEditingTeam(team)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                            >
                              <Edit2 size={16} />
                            </button>
                            {teams.length > 2 && (
                              <button
                                onClick={() => handleDeleteTeam(team)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Team Detail View Component
  const TeamDetailView = ({ team, onBack }) => {
    const stats = getTeamStats(team);
    const teamMembers = stats.members;
    
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Overview
        </button>

        {/* Team Header */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                {team}
                <div className={`w-4 h-4 rounded-full bg-${teamColors[team]}-500`}></div>
              </h2>
              <p className="text-gray-400 mt-1">
                <Truck className="inline mr-1" size={16} />
                {stats.truck} • {stats.count} Active Members
              </p>
            </div>
            <button
              onClick={() => {
                setFilterTeam(team);
                setActiveTab('list');
                setSelectedTeam(null);
              }}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Manage Team
            </button>
          </div>

          {/* Team Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Members</p>
              <p className="text-2xl font-bold text-white">{stats.count}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Average Rating</p>
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400 fill-current" size={20} />
                <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Hours</p>
              <p className="text-2xl font-bold text-white">{stats.totalHours}</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Jobs Completed</p>
              <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>
          <div className="grid gap-4">
            {teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <div key={member.id} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{member.name}</h4>
                      <p className="text-sm text-gray-400">
                        {member.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {member.employee_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-400 fill-current" size={14} />
                        <span className="text-white">{member.rating || 5.0}</span>
                      </div>
                      <p className="text-sm text-gray-400">{member.jobs_completed || 0} jobs</p>
                    </div>
                    <button
                      onClick={() => setEditModalData(member)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No active members in this team
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Overview Tab Component
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Team Management Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowTeamManager(true)}
          className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
        >
          <Settings size={18} />
          Manage Teams
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {teams.map(team => {
          const stats = getTeamStats(team);
          const color = teamColors[team] || 'gray';
          
          return (
            <div key={team} className="glass card-modern rounded-xl p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-100">{team}</h3>
                <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    <Truck className="inline" size={12} /> Truck
                  </span>
                  <span className="text-sm font-semibold text-white">{stats.truck}</span>
                </div>
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
              </div>

              <button
                onClick={() => setSelectedTeam(team)}
                className={`w-full py-2 bg-${color}-500/20 text-${color}-400 rounded-lg hover:bg-${color}-500/30 transition-colors text-sm font-medium`}
              >
                View Team
              </button>
            </div>
          );
        })}
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Total Crew</p>
          <p className="text-2xl font-bold text-white">{crews.filter(c => c.is_active).length}</p>
        </div>
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Active Today</p>
          <p className="text-2xl font-bold text-green-400">
            {crews.filter(c => c.is_active && c.status === 'active').length}
          </p>
        </div>
        <div className="glass p-4 rounded-lg">
          <p className="text-gray-400 text-sm">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-400">
            {crews.length > 0 
              ? (crews.reduce((sum, c) => sum + (parseFloat(c.rating) || 0), 0) / crews.length).toFixed(1)
              : '0.0'} ⭐
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

  // Edit Modal Component
  const EditModal = () => {
    if (!editModalData) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-dark rounded-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Edit Crew Member</h3>
            <button
              onClick={() => setEditModalData(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Name</label>
              <input
                type="text"
                value={editModalData.name || ''}
                onChange={(e) => setEditModalData({...editModalData, name: e.target.value})}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Email</label>
              <input
                type="email"
                value={editModalData.email || ''}
                onChange={(e) => setEditModalData({...editModalData, email: e.target.value})}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Phone</label>
              <input
                type="text"
                value={editModalData.phone || ''}
                onChange={(e) => setEditModalData({...editModalData, phone: e.target.value})}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Team</label>
              <select
                value={editModalData.team || 'Unassigned'}
                onChange={(e) => setEditModalData({...editModalData, team: e.target.value})}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
              >
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Role</label>
              <select
                value={editModalData.role || 'crew'}
                onChange={(e) => setEditModalData({...editModalData, role: e.target.value})}
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
                value={editModalData.hourly_rate || ''}
                onChange={(e) => setEditModalData({...editModalData, hourly_rate: e.target.value})}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="25.00"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModalData(null)}
                className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCrew}
                disabled={loading}
                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Crew List Tab Component - UPDATED WITH DELETE FUNCTIONALITY
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
                : 'No crew members yet. Click "Add Crew Member" to get started.'}
            </p>
          </div>
        ) : (
          filteredCrews.map((crew) => {
            const employeeId = crew.employee_id || crew.employeeId || 'N/A';
            const teamColor = teamColors[crew.team] || 'gray';
            
            return (
              <div key={crew.id} className={`glass rounded-xl p-4 ${!crew.is_active ? 'opacity-50' : ''}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Crew Member Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {crew.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{crew.name}</h3>
                      <p className="text-gray-400 text-sm">{employeeId}</p>
                    </div>
                  </div>

                  {/* Team Badge */}
                  <div className={`px-3 py-1 bg-${teamColor}-500/20 text-${teamColor}-400 rounded-lg text-sm font-medium`}>
                    {crew.team}
                  </div>

                  {/* Role */}
                  <div className="text-gray-300">
                    {crew.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 fill-current" size={16} />
                    <span className="text-white font-semibold">{crew.rating || 5.0}</span>
                  </div>

                  {/* Phone */}
                  <div className="text-gray-300">
                    {crew.phone}
                  </div>

                  {/* Actions - WITH DELETE BUTTON */}
                  <div className="flex items-center gap-2">
                    <TransferDropdown 
                      crew={crew}
                      teams={teams}
                      onTransfer={handleTeamTransfer}
                    />
                    
                    <button
                      onClick={() => setEditModalData(crew)}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-1"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                      <span className="text-xs">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleResetPin(crew.id, crew.name)}
                      className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      title="Reset PIN"
                    >
                      <Key size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleToggleActive(crew.id, crew.is_active, crew.name)}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                        crew.is_active 
                          ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                      title={crew.is_active ? 'Deactivate' : 'Reactivate'}
                    >
                      <Power size={16} />
                      <span className="text-xs">{crew.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    
                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => handleDeleteCrew(crew.id, crew.name)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
                      title="Delete Permanently"
                    >
                      <Trash2 size={16} />
                      <span className="text-xs">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // Main render
  if (selectedTeam) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6 max-w-7xl mx-auto`}>
        <TeamDetailView team={selectedTeam} onBack={() => setSelectedTeam(null)} />
      </div>
    );
  }

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
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="EMP0001"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                4-Digit PIN *
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
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white"
                placeholder="1234"
                maxLength="4"
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
              <label className="block text-gray-300 text-sm mb-2">Team</label>
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
              <label className="block text-gray-300 text-sm mb-2">Role</label>
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

      {/* Edit Modal */}
      <EditModal />

      {/* Team Manager Modal */}
      {showTeamManager && <TeamManagerModal />}

      {/* Help Section */}
      <div className="glass p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
          <Info size={18} />
          Managing Your Crew
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div>
            <strong>Teams:</strong> Click "Manage Teams" to add, edit, or delete teams and assign trucks
          </div>
          <div>
            <strong>Transfer:</strong> Click Transfer to move crew members between teams
          </div>
          <div>
            <strong>Status:</strong> Deactivate members temporarily or delete them permanently
          </div>
          <div>
            <strong>Credentials:</strong> Each member needs Employee ID + PIN to login
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewManagementPanel;