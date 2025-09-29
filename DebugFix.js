import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Settings, Database, Key, Users, RefreshCw, Shield } from 'lucide-react';

const DebugFixTool = () => {
  const [status, setStatus] = useState({
    companyId: null,
    adminAccount: null,
    supabaseConnection: 'checking',
    crewMembers: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fixApplied, setFixApplied] = useState(false);

  // Supabase config (same as your app)
  const SUPABASE_URL = 'https://mgpwaxgfbmwouvcqbpxo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHdheGdmYm13b3V2Y3FicHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAyMTgsImV4cCI6MjA3MzEyNjIxOH0.cMR6r1L-cCkHHDnFB7s3o0VKeNzZOlCWpVBvevux8rU';

  const supabaseHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setMessage('Checking system status...');
    
    // Check company ID
    const companyId = localStorage.getItem('currentCompanyId');
    
    // Check admin account
    const adminAccount = localStorage.getItem('adminAccount');
    
    // Check Supabase connection
    let supabaseStatus = 'disconnected';
    let crewCount = 0;
    
    try {
      const testUrl = companyId 
        ? `${SUPABASE_URL}/rest/v1/crew_members?company_id=eq.${companyId}&limit=100`
        : `${SUPABASE_URL}/rest/v1/crew_members?limit=100`;
        
      const response = await fetch(testUrl, { headers: supabaseHeaders });
      
      if (response.ok) {
        supabaseStatus = 'connected';
        const data = await response.json();
        crewCount = data ? data.length : 0;
      }
    } catch (error) {
      console.error('Supabase check failed:', error);
    }
    
    setStatus({
      companyId: companyId,
      adminAccount: adminAccount ? JSON.parse(adminAccount) : null,
      supabaseConnection: supabaseStatus,
      crewMembers: crewCount
    });
    
    setMessage('');
  };

  const applyQuickFix = async () => {
    setLoading(true);
    setMessage('Applying fix...');
    
    try {
      // Step 1: Create a default company if none exists
      if (!status.companyId) {
        const companyId = 'company_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('currentCompanyId', companyId);
        
        // Try to create company in Supabase
        try {
          const companyData = {
            id: companyId,
            name: 'Bright Landscaping Co',
            email: 'admin@brightlandscaping.com',
            subscription_plan: 'trial',
            subscription_status: 'active',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          };
          
          await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
            method: 'POST',
            headers: {
              ...supabaseHeaders,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(companyData)
          });
        } catch (err) {
          console.log('Company table might not exist, continuing...');
        }
        
        setMessage('✅ Company context created');
      }
      
      // Step 2: Create default admin if none exists
      if (!status.adminAccount) {
        const adminData = {
          id: 'admin_' + Date.now(),
          email: 'admin@brightlandscaping.com',
          password: btoa('admin123'), // Default password
          company: 'Bright Landscaping Co',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('adminAccount', JSON.stringify(adminData));
        
        // Also try to create in Supabase
        try {
          const companyId = localStorage.getItem('currentCompanyId');
          await fetch(`${SUPABASE_URL}/rest/v1/admin_accounts`, {
            method: 'POST',
            headers: {
              ...supabaseHeaders,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              email: adminData.email,
              password_hash: adminData.password,
              company_name: adminData.company,
              company_id: companyId,
              role: 'admin',
              is_active: true,
              created_at: adminData.createdAt
            })
          });
        } catch (err) {
          console.log('Admin might already exist, continuing...');
        }
        
        setMessage('✅ Default admin created (email: admin@brightlandscaping.com, password: admin123)');
      }
      
      // Step 3: Create a test crew member
      const companyId = localStorage.getItem('currentCompanyId');
      const testCrewMember = {
        employee_id: 'EMP0001',
        pin: '1234',
        name: 'Test Employee',
        email: 'test@example.com',
        phone: '(555) 000-0001',
        team: 'Team Alpha',
        role: 'crew',
        status: 'active',
        is_active: true,
        clock_status: 'clocked_out',
        rating: 5.0,
        hours_worked: 0,
        jobs_completed: 0,
        hourly_rate: 25,
        created_at: new Date().toISOString(),
        company_id: companyId
      };
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/crew_members`, {
          method: 'POST',
          headers: {
            ...supabaseHeaders,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(testCrewMember)
        });
        
        if (response.ok) {
          setMessage('✅ Test crew member created (ID: EMP0001, PIN: 1234)');
        }
      } catch (err) {
        console.log('Test crew member might already exist');
      }
      
      setFixApplied(true);
      await checkSystemStatus();
      setMessage('✅ Fix applied successfully! Please refresh your app.');
      
    } catch (error) {
      console.error('Fix failed:', error);
      setMessage('❌ Fix failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    if (confirm('This will clear all local data. Are you sure?')) {
      localStorage.clear();
      setMessage('✅ All local data cleared. Please refresh the page.');
      checkSystemStatus();
    }
  };

  const StatusIcon = ({ condition }) => {
    return condition ? (
      <CheckCircle className="text-green-400" size={20} />
    ) : (
      <AlertCircle className="text-red-400" size={20} />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-blue-400" />
            Bright.AI Debug & Fix Tool
          </h1>
          <p className="text-gray-400 mb-8">Diagnose and fix authentication issues</p>
          
          {/* Status Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Key className="text-yellow-400" size={20} />
                  Company Context
                </h3>
                <StatusIcon condition={status.companyId} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Company ID:</p>
              <p className="text-white font-mono text-xs break-all">
                {status.companyId || 'Not set (THIS IS THE PROBLEM!)'}
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="text-purple-400" size={20} />
                  Admin Account
                </h3>
                <StatusIcon condition={status.adminAccount} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Admin Email:</p>
              <p className="text-white">
                {status.adminAccount?.email || 'No admin account'}
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="text-green-400" size={20} />
                  Database Connection
                </h3>
                <StatusIcon condition={status.supabaseConnection === 'connected'} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Status:</p>
              <p className="text-white capitalize">{status.supabaseConnection}</p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="text-blue-400" size={20} />
                  Crew Members
                </h3>
                <StatusIcon condition={status.crewMembers > 0} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Total in Database:</p>
              <p className="text-white text-2xl font-bold">{status.crewMembers}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            {!status.companyId && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-300 font-semibold">⚠️ Critical Issue Detected!</p>
                <p className="text-red-200 text-sm mt-1">
                  No company context is set. This prevents all database operations.
                </p>
              </div>
            )}
            
            <button
              onClick={applyQuickFix}
              disabled={loading || fixApplied}
              className={`w-full py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                fixApplied 
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Applying Fix...
                </>
              ) : fixApplied ? (
                <>
                  <CheckCircle size={20} />
                  Fix Applied - Refresh Your App
                </>
              ) : (
                <>
                  <Settings size={20} />
                  Apply Quick Fix
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={checkSystemStatus}
                className="py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Refresh Status
              </button>
              
              <button
                onClick={clearAllData}
                className="py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-green-300 font-mono text-sm">{message}</p>
            </div>
          )}
          
          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <h3 className="text-blue-300 font-semibold mb-3">After Applying Fix:</h3>
            <ol className="space-y-2 text-blue-200 text-sm">
              <li>1. Click "Apply Quick Fix" above</li>
              <li>2. Go back to your Bright.AI app and refresh the page</li>
              <li>3. Login with: <span className="font-mono bg-gray-800 px-2 py-1 rounded">admin@brightlandscaping.com</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded">admin123</span></li>
              <li>4. Test crew login with: <span className="font-mono bg-gray-800 px-2 py-1 rounded">EMP0001</span> / <span className="font-mono bg-gray-800 px-2 py-1 rounded">1234</span></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugFixTool;