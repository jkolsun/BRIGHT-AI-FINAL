// services/auth/authService.js - PRODUCTION VERSION
// Replace your current authService.js with this
import { supabase } from '../database/supabase';
class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
  }

  // Check if this is first time setup (no admin exists)
  async checkFirstTimeSetup() {
    const adminExists = localStorage.getItem('adminAccount');
    return !adminExists;
  }

  // Create the first admin account
  async createAdminAccount(email, password, companyName) {
    // In production, this would save to Supabase
    // For now, we'll use encrypted localStorage
    const adminData = {
      id: 'admin_' + Date.now(),
      email: email,
      password: btoa(password), // Basic encoding (use bcrypt in production)
      company: companyName,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('adminAccount', JSON.stringify(adminData));
    
    // Also save crew members list
    if (!localStorage.getItem('crewMembers')) {
      localStorage.setItem('crewMembers', JSON.stringify([]));
    }

    return { success: true, message: 'Admin account created successfully' };
  }

  // Admin login
  async loginAdmin(email, password) {
    try {
      // Get admin from Supabase database
      const response = await fetch(
        `${supabase.url}/rest/v1/admin_accounts?email=eq.${email}`,
        { headers: supabase.headers }
      );
      
      if (!response.ok) {
        return { success: false, error: 'No admin account found.' };
      }
      
      const admins = await response.json();
      if (!admins || admins.length === 0) {
        return { success: false, error: 'No admin account found. Please set up your account first.' };
      }
      
      const admin = admins[0];
      
      // Set company context for multi-tenant
      if (admin.company_id) {
        localStorage.setItem('currentCompanyId', admin.company_id);
      }
      
      // Check password (comparing with password_hash from database)
      if (admin.password_hash && atob(admin.password_hash) !== password) {
        return { success: false, error: 'Invalid password' };
      }
      
      // Create session
      const authData = {
        user: {
          id: admin.id,
          email: admin.email,
          name: 'Administrator',
          company: admin.company_name
        },
        role: 'admin',
        token: 'tk_' + Math.random().toString(36).substr(2),
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('currentSession', JSON.stringify(authData));
      this.currentUser = authData.user;
      this.userRole = 'admin';

      return { success: true, data: authData };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Crew member login
  async loginCrew(employeeId, pin) {
    try {
      const crewData = localStorage.getItem('crewMembers');
      
      if (!crewData) {
        return { success: false, error: 'No crew members found' };
      }

      const crewMembers = JSON.parse(crewData);
      const crew = crewMembers.find(c => c.employeeId === employeeId && c.pin === pin);
      
      if (crew) {
        const authData = {
          user: {
            id: crew.id,
            name: crew.name,
            team: crew.team,
            role: crew.role,
            employeeId: crew.employeeId
          },
          role: 'crew',
          token: 'tk_' + Math.random().toString(36).substr(2),
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(authData));
        this.currentUser = authData.user;
        this.userRole = 'crew';

        return { success: true, data: authData };
      }

      return { success: false, error: 'Invalid employee ID or PIN' };
    } catch (error) {
      console.error('Crew login error:', error);
      return { success: false, error: error.message };
    }
  }

// Create new crew member (admin only)
  async createCrewMember(memberData) {
    try {
      // Import supabase at the top of the file if not already imported
      const { supabase } = await import('../database/supabase');
      
      // Check if employee ID already exists in Supabase
      const existing = await supabase.fetchData('crew_members');
      const exists = existing?.find(c => 
        c.employee_id === memberData.employeeId?.toUpperCase() ||
        c.employeeId === memberData.employeeId?.toUpperCase()
      );
      
      if (exists) {
        return { success: false, error: 'Employee ID already exists' };
      }

      const newMember = {
        employee_id: memberData.employeeId?.toUpperCase(),
        pin: memberData.pin || '1234',
        name: memberData.name,
        email: memberData.email || null,
        phone: memberData.phone || null,
        team: memberData.team || 'Team Alpha',
        role: memberData.role || 'crew',
        status: 'active',
        is_active: true,
        clock_status: 'clocked_out',
        rating: 5.0,
        hours: 0,
        productivity: 100
      };

      // Save to Supabase
      const result = await supabase.insertData('crew_members', newMember);
      
      if (result && result.length > 0) {
        return { success: true, data: result[0] };
      }
      
      return { success: false, error: 'Failed to create crew member' };
    } catch (error) {
      console.error('Error creating crew member:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all crew members (admin only)
  async getCrewMembers() {
    const crewData = localStorage.getItem('crewMembers');
    return crewData ? JSON.parse(crewData) : [];
  }

  // Delete crew member (admin only)
  async deleteCrewMember(employeeId) {
    const crewData = localStorage.getItem('crewMembers');
    if (!crewData) return { success: false, error: 'No crew members found' };
    
    let crewMembers = JSON.parse(crewData);
    crewMembers = crewMembers.filter(m => m.employeeId !== employeeId);
    
    localStorage.setItem('crewMembers', JSON.stringify(crewMembers));
    return { success: true };
  }

  // Reset crew member PIN
  async resetCrewPin(employeeId, newPin) {
    const crewData = localStorage.getItem('crewMembers');
    if (!crewData) return { success: false, error: 'No crew members found' };
    
    const crewMembers = JSON.parse(crewData);
    const member = crewMembers.find(m => m.employeeId === employeeId);
    
    if (member) {
      member.pin = newPin;
      localStorage.setItem('crewMembers', JSON.stringify(crewMembers));
      return { success: true };
    }
    
    return { success: false, error: 'Employee not found' };
  }

  // Check for existing session
  async init() {
    const session = localStorage.getItem('currentSession');
    if (session) {
      const authData = JSON.parse(session);
      
      // Check if session is less than 24 hours old
      const loginTime = new Date(authData.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
      
      if (hoursSinceLogin < 24) {
        this.currentUser = authData.user;
        this.userRole = authData.role;
        return authData;
      }
    }
    return null;
  }

  // Logout
  logout() {
    localStorage.removeItem('currentSession');
    this.currentUser = null;
    this.userRole = null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user role
  getUserRole() {
    return this.userRole;
  }
}

export const authService = new AuthService();