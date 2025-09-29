// services/auth/authService.js - COMPLETE FIXED VERSION
// Production-ready authentication service for Bright.AI
import { supabase } from '../database/supabase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
  }

  // ==================== ADMIN AUTHENTICATION ====================

  // Check if this is first time setup (no admin exists)
  async checkFirstTimeSetup() {
    try {
      // Check Supabase for existing admin accounts
      const response = await fetch(
        `${supabase.url}/rest/v1/admin_accounts?select=id`,
        { headers: supabase.headers }
      );
      
      if (response.ok) {
        const admins = await response.json();
        return !admins || admins.length === 0;
      }
      
      // Fallback to localStorage check
      const adminExists = localStorage.getItem('adminAccount');
      return !adminExists;
    } catch (error) {
      console.error('Error checking first time setup:', error);
      // If can't connect to Supabase, check localStorage
      const adminExists = localStorage.getItem('adminAccount');
      return !adminExists;
    }
  }

  // Create the first admin account
  async createAdminAccount(email, password, companyName) {
    try {
      // Create admin in Supabase
      const adminData = {
        email: email,
        password_hash: btoa(password), // Use proper bcrypt in production
        company_name: companyName,
        role: 'admin',
        created_at: new Date().toISOString()
      };

      // Try to save to Supabase first
      try {
        const result = await supabase.insertData('admin_accounts', adminData);
        if (result) {
          // Also save to localStorage as backup
          localStorage.setItem('adminAccount', JSON.stringify({
            ...adminData,
            id: result.id || 'admin_' + Date.now()
          }));
          return { success: true, message: 'Admin account created successfully' };
        }
      } catch (supabaseError) {
        console.warn('Supabase save failed, using localStorage:', supabaseError);
      }

      // Fallback to localStorage only
      const localAdminData = {
        id: 'admin_' + Date.now(),
        email: email,
        password: btoa(password),
        company: companyName,
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('adminAccount', JSON.stringify(localAdminData));
      
      // Initialize empty crew members list
      if (!localStorage.getItem('crewMembers')) {
        localStorage.setItem('crewMembers', JSON.stringify([]));
      }

      return { success: true, message: 'Admin account created successfully (local)' };
    } catch (error) {
      console.error('Error creating admin account:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin login
  async loginAdmin(email, password) {
    try {
      // First try Supabase
      try {
        const response = await fetch(
          `${supabase.url}/rest/v1/admin_accounts?email=eq.${email}`,
          { headers: supabase.headers }
        );
        
        if (response.ok) {
          const admins = await response.json();
          
          if (admins && admins.length > 0) {
            const admin = admins[0];
            
            // Set company context for multi-tenant
            if (admin.company_id) {
              localStorage.setItem('currentCompanyId', admin.company_id);
            }
            
            // Check password
            if (admin.password_hash && atob(admin.password_hash) !== password) {
              return { success: false, error: 'Invalid password' };
            }
            
            // Create session
            const authData = {
              user: {
                id: admin.id,
                email: admin.email,
                name: admin.name || 'Administrator',
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
          }
        }
      } catch (supabaseError) {
        console.warn('Supabase login failed, trying localStorage:', supabaseError);
      }

      // Fallback to localStorage
      const adminData = localStorage.getItem('adminAccount');
      if (!adminData) {
        return { success: false, error: 'No admin account found. Please set up your account first.' };
      }

      const admin = JSON.parse(adminData);
      
      // Check credentials
      if (admin.email !== email) {
        return { success: false, error: 'Invalid email' };
      }
      
      if (admin.password && atob(admin.password) !== password) {
        return { success: false, error: 'Invalid password' };
      }

      // Create session
      const authData = {
        user: {
          id: admin.id,
          email: admin.email,
          name: 'Administrator',
          company: admin.company
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

  // ==================== CREW AUTHENTICATION ====================

  // FIXED: Crew member login - fetches from Supabase
  async loginCrew(employeeId, pin) {
    try {
      console.log('Attempting crew login with:', { employeeId, pin });
      
      // Always fetch crew members from Supabase
      let crewMembers = [];
      
      try {
        crewMembers = await supabase.fetchData('crew_members');
        console.log(`Fetched ${crewMembers?.length || 0} crew members from Supabase`);
      } catch (dbError) {
        console.error('Error fetching from Supabase:', dbError);
        
        // Fallback to localStorage if Supabase fails
        const localData = localStorage.getItem('crewMembers');
        if (localData) {
          crewMembers = JSON.parse(localData);
          console.log(`Using ${crewMembers.length} crew members from localStorage (fallback)`);
        }
      }
      
      if (!crewMembers || crewMembers.length === 0) {
        return { success: false, error: 'No crew members found. Please contact your administrator.' };
      }

      // Find matching crew member (case-insensitive for employee ID)
      const crew = crewMembers.find(c => {
        // Handle different field name variations
        const crewEmployeeId = (c.employee_id || c.employeeId || '').toUpperCase();
        const inputEmployeeId = employeeId.toUpperCase();
        
        const matchesId = crewEmployeeId === inputEmployeeId;
        const matchesPin = String(c.pin) === String(pin);
        
        // Debug logging
        if (matchesId && !matchesPin) {
          console.log(`Found employee ${crewEmployeeId} but PIN doesn't match`);
        }
        
        return matchesId && matchesPin && (c.is_active !== false);
      });
      
      if (crew) {
        const authData = {
          user: {
            id: crew.id,
            name: crew.name,
            team: crew.team || 'Unassigned',
            role: crew.role || 'crew',
            employeeId: crew.employee_id || crew.employeeId,
            email: crew.email,
            phone: crew.phone
          },
          role: 'crew',
          token: 'tk_' + Math.random().toString(36).substr(2),
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(authData));
        this.currentUser = authData.user;
        this.userRole = 'crew';

        console.log('Crew login successful for:', crew.name);
        return { success: true, data: authData };
      }

      console.log('No matching active crew member found');
      return { success: false, error: 'Invalid employee ID or PIN. Please check your credentials.' };
    } catch (error) {
      console.error('Crew login error:', error);
      return { success: false, error: 'Login failed. Please try again or contact support.' };
    }
  }

  // ==================== CREW MANAGEMENT (Admin Only) ====================

  // Create new crew member
  async createCrewMember(memberData) {
    try {
      // Check if employee ID already exists
      const existing = await supabase.fetchData('crew_members');
      const employeeIdUpper = memberData.employeeId?.toUpperCase();
      
      const exists = existing?.find(c => 
        (c.employee_id || c.employeeId || '').toUpperCase() === employeeIdUpper
      );
      
      if (exists) {
        return { success: false, error: 'Employee ID already exists' };
      }

      const newMember = {
        employee_id: employeeIdUpper,
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
        hours_worked: 0,
        jobs_completed: 0,
        hourly_rate: memberData.hourlyRate || 25,
        created_at: new Date().toISOString()
      };

      // Save to Supabase
      const result = await supabase.insertData('crew_members', newMember);
      
      if (result && result.length > 0) {
        console.log('Crew member created successfully:', newMember.name);
        return { success: true, data: result[0] };
      }
      
      return { success: false, error: 'Failed to create crew member' };
    } catch (error) {
      console.error('Error creating crew member:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all crew members - fetches from Supabase
  async getCrewMembers() {
    try {
      const crewMembers = await supabase.fetchData('crew_members');
      return crewMembers || [];
    } catch (error) {
      console.error('Error fetching crew members:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem('crewMembers');
      return localData ? JSON.parse(localData) : [];
    }
  }

  // Delete crew member
  async deleteCrewMember(employeeId) {
    try {
      const crewMembers = await supabase.fetchData('crew_members');
      const member = crewMembers.find(m => 
        (m.employee_id || m.employeeId || '').toUpperCase() === employeeId.toUpperCase()
      );
      
      if (member && member.id) {
        await supabase.deleteData('crew_members', member.id);
        console.log('Crew member deleted:', employeeId);
        return { success: true };
      }
      
      return { success: false, error: 'Employee not found' };
    } catch (error) {
      console.error('Error deleting crew member:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset crew member PIN
  async resetCrewPin(employeeId, newPin) {
    try {
      const crewMembers = await supabase.fetchData('crew_members');
      const member = crewMembers.find(m => 
        (m.employee_id || m.employeeId || '').toUpperCase() === employeeId.toUpperCase()
      );
      
      if (member && member.id) {
        await supabase.updateData('crew_members', member.id, { 
          pin: newPin,
          updated_at: new Date().toISOString()
        });
        console.log('PIN reset for:', employeeId);
        return { success: true };
      }
      
      return { success: false, error: 'Employee not found' };
    } catch (error) {
      console.error('Error resetting PIN:', error);
      return { success: false, error: error.message };
    }
  }

  // Update crew member
  async updateCrewMember(employeeId, updates) {
    try {
      const crewMembers = await supabase.fetchData('crew_members');
      const member = crewMembers.find(m => 
        (m.employee_id || m.employeeId || '').toUpperCase() === employeeId.toUpperCase()
      );
      
      if (member && member.id) {
        const updateData = {
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        await supabase.updateData('crew_members', member.id, updateData);
        console.log('Crew member updated:', employeeId);
        return { success: true };
      }
      
      return { success: false, error: 'Employee not found' };
    } catch (error) {
      console.error('Error updating crew member:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== SESSION MANAGEMENT ====================

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
        console.log('Session restored for:', authData.user.name || authData.user.email);
        return authData;
      } else {
        console.log('Session expired');
        this.logout();
      }
    }
    return null;
  }

  // Logout
  logout() {
    localStorage.removeItem('currentSession');
    this.currentUser = null;
    this.userRole = null;
    console.log('User logged out');
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user role
  getUserRole() {
    return this.userRole;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Check if user is admin
  isAdmin() {
    return this.userRole === 'admin';
  }

  // Check if user is crew
  isCrew() {
    return this.userRole === 'crew';
  }
}

// Export singleton instance
export const authService = new AuthService();