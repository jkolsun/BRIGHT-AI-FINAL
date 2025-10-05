import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Database, CheckCircle } from 'lucide-react';

// Import your supabase client
// import { supabase } from './services/database/supabase';

const DataResetTool = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState('');
  
  // Mock supabase for demo - replace with your actual import
  const supabase = {
    fetchData: async (table) => {
      // This is mock data - your actual implementation will work with real data
      return [];
    },
    deleteData: async (table, id) => {
      return true;
    }
  };
  
  const tables = [
    'jobs',
    'crew_members', 
    'clients',
    'quotes',
    'invoices',
    'messages',
    'schedules',
    'equipment',
    'admin_accounts',
    'teams'
  ];
  
  const handleReset = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    
    if (step === 1) {
      const confirmed = window.confirm(
        '⚠️ FINAL WARNING ⚠️\n\n' +
        'This will permanently delete ALL data including:\n' +
        '• All clients and jobs\n' +
        '• All crew members\n' +
        '• All schedules and invoices\n' +
        '• All settings and configurations\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Type "DELETE ALL" to confirm.'
      );
      
      const userInput = window.prompt('Type "DELETE ALL" to confirm:');
      
      if (userInput !== 'DELETE ALL') {
        setError('Reset cancelled - confirmation text did not match');
        setStep(0);
        return;
      }
      
      setStep(2);
      setLoading(true);
      setProgress([]);
      
      try {
        // Clear localStorage
        setProgress(prev => [...prev, '✅ Clearing browser storage...']);
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear each table
        for (const table of tables) {
          setProgress(prev => [...prev, `🔄 Clearing ${table}...`]);
          
          try {
            const records = await supabase.fetchData(table, 1000);
            
            if (records && records.length > 0) {
              for (const record of records) {
                if (record.id) {
                  await supabase.deleteData(table, record.id);
                }
              }
              setProgress(prev => [...prev, `✅ Cleared ${records.length} records from ${table}`]);
            } else {
              setProgress(prev => [...prev, `⏭️ ${table} was already empty`]);
            }
          } catch (err) {
            setProgress(prev => [...prev, `⚠️ Skipped ${table} (might not exist)`]);
          }
        }
        
        setProgress(prev => [...prev, '✅ All data cleared successfully!']);
        setStep(3);
        
        // Reload after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } catch (err) {
        setError(`Reset failed: ${err.message}`);
        setStep(0);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleCancel = () => {
    setStep(0);
    setError('');
    setProgress([]);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-red-500" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-white">Data Reset Tool</h1>
              <p className="text-gray-400">Completely reset your app to start fresh</p>
            </div>
          </div>
          
          {/* Warning Banner */}
          {step === 0 && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 mt-1" size={20} />
                <div>
                  <p className="text-red-300 font-semibold mb-2">⚠️ Warning: Permanent Data Loss</p>
                  <p className="text-red-200 text-sm">
                    This tool will permanently delete ALL data in your application including:
                  </p>
                  <ul className="text-red-200 text-sm mt-2 ml-4 list-disc">
                    <li>All client information and job history</li>
                    <li>All crew members and their records</li>
                    <li>All schedules, quotes, and invoices</li>
                    <li>All messages and communications</li>
                    <li>All settings and configurations</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmation Step */}
          {step === 1 && (
            <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-6 mb-6">
              <h3 className="text-orange-300 font-semibold mb-3">Are you absolutely sure?</h3>
              <p className="text-orange-200">
                This action cannot be undone. All your data will be permanently deleted.
                You will need to re-import or manually enter all your data again.
              </p>
            </div>
          )}
          
          {/* Progress Display */}
          {step === 2 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
              <h3 className="text-white font-semibold mb-3">Reset Progress:</h3>
              {progress.map((item, index) => (
                <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                  {item}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 mt-3">
                  <RefreshCw className="animate-spin text-blue-400" size={16} />
                  <span className="text-blue-400 text-sm">Processing...</span>
                </div>
              )}
            </div>
          )}
          
          {/* Success Message */}
          {step === 3 && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <div>
                  <h3 className="text-green-300 font-semibold">Reset Complete!</h3>
                  <p className="text-green-200">
                    All data has been cleared. The page will reload in 3 seconds...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            {step < 2 && (
              <>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  {step === 0 ? 'Start Reset Process' : 'Confirm - Delete Everything'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <h3 className="text-blue-300 font-semibold mb-2">After Reset:</h3>
            <ol className="text-blue-200 text-sm space-y-1">
              <li>1. The app will reload automatically</li>
              <li>2. You'll need to create a new admin account</li>
              <li>3. Import your client data using the Smart Import feature</li>
              <li>4. Add your crew members</li>
              <li>5. Configure your AI settings with your OpenAI API key</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataResetTool;