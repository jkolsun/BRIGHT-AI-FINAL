import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, DollarSign, Users, MessageSquare, BarChart3, Clock, 
  CheckCircle, Bell, Camera, Send, Navigation, Star, TrendingUp, 
  Zap, Phone, RefreshCw, ChevronLeft, Home, Briefcase, 
  Activity, LogOut, ChevronRight, Filter, Download, Edit, Loader
} from 'lucide-react';

// Your Supabase credentials
const SUPABASE_URL = 'https://mgpwaxgfbmwouvcqbpxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHdheGdmYm13b3V2Y3FicHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAyMTgsImV4cCI6MjA3MzEyNjIxOH0.cMR6r1L-cCkHHDnFB7s3o0VKeNzZOlCWpVBvevux8rU';

// Simple Supabase client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async fetchData(table, orderBy = 'created_at') {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?order=${orderBy}.desc`, {
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });
      if (!response.ok) throw new Error(`Failed to fetch ${table}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }
  }

  async insertData(table, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Failed to insert into ${table}`);
      return await response.json();
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return null;
    }
  }

  async updateData(table, id, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`Failed to update ${table}`);
      return await response.json();
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  }

  async deleteData(table, id) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error(`Failed to delete from ${table}`);
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  }
}

// Initialize Supabase client
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Smart Import Modal Component
const SmartImportModal = ({ isOpen, onClose, importType, onImportComplete }) => {
  const [step, setStep] = useState(1);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');

  // Define required columns for each import type
  const requiredColumns = {
    jobs: [
      { key: 'customer', label: 'Customer Name', required: true },
      { key: 'type', label: 'Job Type', required: true },
      { key: 'address', label: 'Address', required: false },
      { key: 'crew', label: 'Team/Crew', required: false },
      { key: 'price', label: 'Price', required: false },
      { key: 'phone', label: 'Phone', required: false },
      { key: 'equipment', label: 'Equipment', required: false },
      { key: 'instructions', label: 'Instructions', required: false }
    ],
    quotes: [
      { key: 'customer', label: 'Customer Name', required: true },
      { key: 'service', label: 'Service Type', required: true },
      { key: 'price_range', label: 'Price Range', required: false },
      { key: 'notes', label: 'Notes', required: false }
    ],
    crew_members: [
      { key: 'name', label: 'Name', required: true },
      { key: 'team', label: 'Team', required: false },
      { key: 'hours', label: 'Hours', required: false },
      { key: 'rating', label: 'Rating', required: false }
    ],
    messages: [
      { key: 'from_name', label: 'Customer Name', required: true },
      { key: 'message', label: 'Message', required: true },
      { key: 'phone', label: 'Phone', required: false },
      { key: 'email', label: 'Email', required: false }
    ]
  };

  const resetWizard = () => {
    setStep(1);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setImporting(false);
    setImportResults(null);
    setGoogleSheetsUrl('');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = { _rowIndex: index + 2 };
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        return row;
      }).filter(row => Object.values(row).some(val => val && val !== ''));

      setHeaders(headers);
      setParsedData(data);
      setStep(2);
    } catch (error) {
      alert('Error parsing CSV. Please check the format and try again.');
      console.error('CSV Parse Error:', error);
    }
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl) {
      alert('Please enter a Google Sheets URL');
      return;
    }

    try {
      let sheetId;
      if (googleSheetsUrl.includes('/d/')) {
        sheetId = googleSheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
      } else {
        alert('Invalid Google Sheets URL format');
        return;
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch sheet data. Make sure the sheet is public.');
      }
      
      const csvText = await response.text();
      parseCSV(csvText);
    } catch (error) {
      alert('Error importing Google Sheets. Make sure the sheet is publicly accessible and try again.');
      console.error('Google Sheets Import Error:', error);
    }
  };

  const autoMapColumns = () => {
    const mapping = {};
    const requiredCols = requiredColumns[importType];
    
    requiredCols.forEach(dbCol => {
      const matchingHeader = headers.find(header => {
        const headerLower = header.toLowerCase();
        const labelLower = dbCol.label.toLowerCase();
        const keyLower = dbCol.key.toLowerCase();
        
        return headerLower.includes(keyLower) || 
               headerLower.includes(labelLower) ||
               labelLower.includes(headerLower);
      });
      
      if (matchingHeader) {
        mapping[dbCol.key] = matchingHeader;
      }
    });
    
    setColumnMapping(mapping);
  };

  const validateMapping = () => {
    const requiredCols = requiredColumns[importType].filter(col => col.required);
    const missingRequired = requiredCols.filter(col => !columnMapping[col.key]);
    
    if (missingRequired.length > 0) {
      alert(`Please map these required columns: ${missingRequired.map(col => col.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const processImport = async () => {
    if (!validateMapping()) return;
    
    setImporting(true);
    setStep(3);
    
    const processedData = parsedData.map(row => {
      const mappedRow = {};
      
      Object.entries(columnMapping).forEach(([dbCol, fileCol]) => {
        if (fileCol && row[fileCol] !== undefined) {
          let value = row[fileCol].toString().trim();
          
          if (dbCol === 'hours' || dbCol === 'jobs' || dbCol === 'productivity' || dbCol === 'on_time' || dbCol === 'revenue') {
            value = parseInt(value) || 0;
          } else if (dbCol === 'rating') {
            value = parseFloat(value) || 4.5;
          }
          
          mappedRow[dbCol] = value;
        }
      });
      
      // Set defaults
      if (importType === 'jobs') {
        mappedRow.status = 'Scheduled';
        mappedRow.crew = mappedRow.crew || 'Team Alpha';
        mappedRow.equipment = mappedRow.equipment || 'Zero Turn';
      } else if (importType === 'quotes') {
        mappedRow.status = 'Pending';
      } else if (importType === 'messages') {
        mappedRow.status = 'needs-review';
      } else if (importType === 'crew_members') {
        mappedRow.team = mappedRow.team || 'Team Alpha';
        mappedRow.hours = mappedRow.hours || 0;
        mappedRow.jobs = mappedRow.jobs || 0;
        mappedRow.productivity = mappedRow.productivity || 85;
        mappedRow.on_time = mappedRow.on_time || 90;
        mappedRow.rating = mappedRow.rating || 4.5;
        mappedRow.revenue = mappedRow.revenue || 0;
      }
      
      return mappedRow;
    });

    // Import data
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const [index, item] of processedData.entries()) {
      try {
        const result = await supabase.insertData(importType, item);
        if (result && result.length > 0) {
          successful++;
        } else {
          failed++;
          errors.push(`Row ${index + 2}: Failed to insert data`);
        }
      } catch (error) {
        failed++;
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    setImportResults({
      total: processedData.length,
      successful,
      failed,
      errors: errors.slice(0, 5)
    });

    setImporting(false);
    setStep(4);

    if (onImportComplete) {
      onImportComplete();
    }
  };

  const downloadTemplate = () => {
    const cols = requiredColumns[importType];
    const headers = cols.map(col => col.label);
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            Smart Import: {importType.charAt(0).toUpperCase() + importType.slice(1).replace('_', ' ')}
          </h3>
          <button onClick={() => { resetWizard(); onClose(); }} className="text-gray-500 hover:text-gray-700 text-xl">
            ✕
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium mb-4">Choose Import Method</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-6xl mb-4">📄</div>
                  <h5 className="font-medium mb-2">Upload CSV File</h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your CSV file with data to import
                  </p>
                  <div className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-green-700">
                    Choose CSV File
                  </div>
                </label>
              </div>

              {/* Google Sheets */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                <div className="text-6xl mb-4 text-center">📊</div>
                <h5 className="font-medium mb-2 text-center">Google Sheets</h5>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Import directly from Google Sheets URL
                </p>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  className="w-full p-3 border rounded mb-4 text-sm"
                />
                <button
                  onClick={handleGoogleSheetsImport}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Import from Google Sheets
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Sheet must be publicly accessible
                </p>
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <h5 className="font-medium mb-2">Need a template?</h5>
              <p className="text-sm text-gray-600 mb-4">
                Download a CSV template with the correct column headers
              </p>
              <button
                onClick={downloadTemplate}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Download Template
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Map Your Columns</h4>
              <button
                onClick={autoMapColumns}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                Auto-Map Columns
              </button>
            </div>
            
            <p className="text-sm text-gray-600">
              Found {parsedData.length} rows. Match your file columns to database fields:
            </p>

            <div className="space-y-3">
              {requiredColumns[importType].map((dbCol) => (
                <div key={dbCol.key} className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="text-sm font-medium">
                      {dbCol.label}
                      {dbCol.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                  <div>
                    <select
                      value={columnMapping[dbCol.key] || ''}
                      onChange={(e) => setColumnMapping(prev => ({...prev, [dbCol.key]: e.target.value}))}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-500">
                    {columnMapping[dbCol.key] && parsedData[0] && (
                      <span>Preview: "{parsedData[0][columnMapping[dbCol.key]]}"</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={processImport}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Import {parsedData.length} Records
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <h4 className="text-lg font-medium">Importing Data...</h4>
            <div className="flex justify-center">
              <Loader className="animate-spin text-green-600" size={48} />
            </div>
            <p className="text-gray-600">
              Processing {parsedData.length} records...
            </p>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && importResults && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium">Import Complete!</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{importResults.total}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{importResults.successful}</div>
                <div className="text-sm text-gray-600">Successfully Imported</div>
              </div>
              <div className="bg-red-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h5 className="font-medium text-red-800 mb-2">Import Errors:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  resetWizard();
                  onClose();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Done
              </button>
              <button
                onClick={resetWizard}
                className="px-6 py-2 border rounded hover:bg-gray-50"
              >
                Import More Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Crew Tracking Map Component for Admin Dashboard
const CrewTrackingMap = ({ crewMembers, jobs }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [leafletLoaded, setLeafletLoaded] = React.useState(false);

  // Define crew team colors
  const teamColors = {
    'Team Alpha': '#3b82f6',   // Blue
    'Team Beta': '#10b981',    // Green  
    'Team Gamma': '#f59e0b',   // Orange
    'Team Delta': '#8b5cf6'    // Purple
  };

  // Mock crew locations with assigned jobs
  const getCrewLocation = (member, index) => {
    const baseLatLng = [40.7934, -77.8600]; // State College, PA
    const teamPositions = {
      'Team Alpha': [baseLatLng[0] + 0.008, baseLatLng[1] - 0.008],
      'Team Beta': [baseLatLng[0] - 0.005, baseLatLng[1] + 0.012],
      'Team Gamma': [baseLatLng[0] + 0.015, baseLatLng[1] + 0.005],
      'Team Delta': [baseLatLng[0] - 0.010, baseLatLng[1] - 0.010]
    };
    return teamPositions[member.team] || [baseLatLng[0] + (index * 0.006), baseLatLng[1] + (index * 0.006)];
  };

  // Get job coordinates and assign them to crews
  const getJobCoordinates = (job, index) => {
    const baseLatLng = [40.7934, -77.8600];
    const radius = 0.02;
    const angle = (index * 2 * Math.PI) / jobs.length;
    return [
      baseLatLng[0] + radius * Math.cos(angle),
      baseLatLng[1] + radius * Math.sin(angle)
    ];
  };

  // Load Leaflet script
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.L && !leafletLoaded) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.L) {
      setLeafletLoaded(true);
    }
  }, [leafletLoaded]);

  // Initialize map
  React.useEffect(() => {
    if (leafletLoaded && window.L && mapRef.current && !mapLoaded) {
      initializeMap();
    }

    function initializeMap() {
      try {
        // Check if map container already has a map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Clear the container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }

        // Initialize new map
        const map = window.L.map(mapRef.current).setView([40.7934, -77.8600], 13);
        mapInstanceRef.current = map;
        
        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add job/lawn markers with crew assignments
        jobs.forEach((job, index) => {
          const [lat, lng] = getJobCoordinates(job, index);
          
          // Get crew team color for this job
          const teamColor = teamColors[job.crew] || '#6b7280';
          
          // Different marker styles based on job status
          let markerStyle = {
            color: teamColor,
            fillColor: teamColor,
            weight: 2,
            radius: 8
          };

          if (job.status === 'Completed') {
            markerStyle.fillOpacity = 0.9;
            markerStyle.className = 'completed-job';
          } else if (job.status === 'In Progress') {
            markerStyle.fillOpacity = 0.7;
            markerStyle.className = 'active-job';
          } else {
            markerStyle.fillOpacity = 0.4;
            markerStyle.className = 'scheduled-job';
          }
          
          const jobMarker = window.L.circleMarker([lat, lng], markerStyle).addTo(map);

          // Enhanced popup for jobs
          jobMarker.bindPopup(`
            <div class="p-3 min-w-64">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-4 h-4 rounded-full" style="background-color: ${teamColor}"></div>
                <h4 class="font-semibold text-gray-800">${job.customer}</h4>
              </div>
              
              <div class="space-y-1 text-sm">
                <p><strong>Service:</strong> ${job.type}</p>
                <p><strong>Address:</strong> ${job.address}</p>
                <p><strong>Assigned to:</strong> ${job.crew}</p>
                <p><strong>Price:</strong> ${job.price}</p>
                <p><strong>Equipment:</strong> ${job.equipment}</p>
              </div>
              
              <div class="mt-2 pt-2 border-t">
                <span class="inline-block px-2 py-1 text-xs rounded-full ${
                  job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }">${job.status}</span>
              </div>
              
              ${job.instructions ? `
                <div class="mt-2 p-2 bg-yellow-50 rounded text-xs">
                  <strong>Instructions:</strong> ${job.instructions}
                </div>
              ` : ''}
            </div>
          `);
        });

        // Add crew member markers with enhanced styling
        crewMembers.forEach((member, index) => {
          const [lat, lng] = getCrewLocation(member, index);
          const teamColor = teamColors[member.team] || '#6b7280';
          
          // Create enhanced crew marker
          const crewIcon = window.L.divIcon({
            className: 'crew-marker',
            html: `
              <div style="
                background: ${teamColor}; 
                width: 32px; 
                height: 32px; 
                border-radius: 50%; 
                border: 4px solid white; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                position: relative;
              ">
                ${member.name.charAt(0)}
                <div style="
                  position: absolute;
                  bottom: -2px;
                  right: -2px;
                  width: 12px;
                  height: 12px;
                  background: #10b981;
                  border: 2px solid white;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const crewMarker = window.L.marker([lat, lng], { icon: crewIcon }).addTo(map);
          
          // Enhanced crew popup with performance metrics
          crewMarker.bindPopup(`
            <div class="p-4 min-w-56">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-4 h-4 rounded-full" style="background-color: ${teamColor}"></div>
                <h4 class="font-semibold text-gray-800">${member.name}</h4>
                <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Online</span>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">${member.team}</p>
              
              <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                <div class="bg-blue-50 p-2 rounded text-center">
                  <div class="font-bold text-blue-800">${member.hours}h</div>
                  <div class="text-blue-600">Hours Today</div>
                </div>
                <div class="bg-green-50 p-2 rounded text-center">
                  <div class="font-bold text-green-800">${member.jobs || 0}</div>
                  <div class="text-green-600">Jobs Done</div>
                </div>
                <div class="bg-yellow-50 p-2 rounded text-center">
                  <div class="font-bold text-yellow-800">${member.rating}★</div>
                  <div class="text-yellow-600">Rating</div>
                </div>
                <div class="bg-purple-50 p-2 rounded text-center">
                  <div class="font-bold text-purple-800">${member.productivity || 85}%</div>
                  <div class="text-purple-600">Efficiency</div>
                </div>
              </div>

              <div class="text-xs text-gray-500 border-t pt-2">
                <p>Last update: ${new Date().toLocaleTimeString()}</p>
                <p>Current location: Live GPS</p>
              </div>
            </div>
          `);
        });

        setMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, crewMembers, jobs]);

  return (
    <div className="space-y-3">
      {/* Map container */}
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-inner">
        <div 
          ref={mapRef} 
          className="h-80 w-full"
          style={{ minHeight: '320px' }}
        />
      </div>
      
      {/* Enhanced Legend */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-gray-700 mb-2">Crew Teams:</p>
            <div className="space-y-1">
              {Object.entries(teamColors).map(([team, color]) => (
                <div key={team} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-white shadow" style={{ backgroundColor: color }}></div>
                  <span className="text-gray-600">{team}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-2">Job Status:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-40"></div>
                <span className="text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 opacity-70"></div>
                <span className="text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-90"></div>
                <span className="text-gray-600">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-700">{crewMembers.length}</div>
          <div className="text-xs text-blue-600">Active Crews</div>
          <div className="text-xs text-green-600 mt-1">● All Online</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">
            {jobs.filter(j => j.status === 'Completed').length}/{jobs.length}
          </div>
          <div className="text-xs text-green-600">Jobs Complete</div>
          <div className="text-xs text-gray-600 mt-1">
            {jobs.length > 0 ? Math.round((jobs.filter(j => j.status === 'Completed').length / jobs.length) * 100) : 0}% Done
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-700">
            {crewMembers.length > 0 
              ? Math.round(crewMembers.reduce((sum, member) => sum + (member.productivity || 85), 0) / crewMembers.length)
              : 0}%
          </div>
          <div className="text-xs text-purple-600">Avg Efficiency</div>
          <div className="text-xs text-green-600 mt-1">↗ Trending up</div>
        </div>
      </div>
    </div>
  );
};

// Admin App Component
function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Real data states
  const [jobs, setJobs] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [crewMembers, setCrewMembers] = useState([]);

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

  const DashboardView = () => {
    const [jobFilter, setJobFilter] = useState('today');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importType, setImportType] = useState('jobs');
    
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
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex gap-2">
            {/* Import Type Selector */}
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="jobs">Import Jobs</option>
              <option value="quotes">Import Quotes</option>
              <option value="crew_members">Import Crew</option>
              <option value="messages">Import Messages</option>
            </select>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Smart Import
            </button>
            <button onClick={fetchAllData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
            <Loader className="animate-spin text-blue-600" size={20} />
            <span className="text-blue-800">Loading data from Supabase...</span>
          </div>
        )}

        {/* Smart Import Modal */}
        <SmartImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          importType={importType}
          onImportComplete={fetchAllData}
        />

        {isDataEmpty && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Welcome to Bright.AI!</h3>
            <p className="text-yellow-700 mb-4">Get started by importing your existing data or adding your first job.</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Smart Import Data
              </button>
              <button 
                onClick={() => setActiveTab('scheduling')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add First Job
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button 
            onClick={() => setActiveTab('scheduling')}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-600">Today's Jobs</p>
                <p className="text-3xl font-bold text-green-600">{jobs.length}</p>
                <p className="text-xs text-gray-500">Live from database</p>
              </div>
              <Calendar className="text-green-500" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('quotes')}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-600">Pending Quotes</p>
                <p className="text-3xl font-bold text-blue-600">{quotes.length}</p>
                <p className="text-xs text-gray-500">Needs approval</p>
              </div>
              <DollarSign className="text-blue-500" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('crew')}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-600">Crew Members</p>
                <p className="text-3xl font-bold text-purple-600">{crewMembers.length}</p>
                <p className="text-xs text-gray-500">Active today</p>
              </div>
              <Users className="text-purple-500" size={32} />
            </div>
          </button>
          
          <button 
            onClick={() => setActiveTab('messages')}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-3xl font-bold text-orange-600">{messages.length}</p>
                <p className="text-xs text-gray-500">Customer messages</p>
              </div>
              <MessageSquare className="text-orange-500" size={32} />
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Review</p>
                <p className="text-3xl font-bold text-red-600">{messages.filter(m => m.status === 'needs-review').length}</p>
                <p className="text-xs text-gray-500">Requires attention</p>
              </div>
              <Bell className="text-red-500" size={32} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Recent Jobs</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setJobFilter('today')}
                  className={`px-3 py-1 text-sm rounded ${jobFilter === 'today' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setJobFilter('week')}
                  className={`px-3 py-1 text-sm rounded ${jobFilter === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Week
                </button>
              </div>
            </div>
            
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto mb-2" size={48} />
                <p>No jobs found</p>
                <p className="text-sm text-gray-400">Import data or add jobs manually</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{job.customer}</h4>
                        <p className="text-sm text-gray-600">{job.type} • {job.address}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{job.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Live Crew Tracking</h3>
            <CrewTrackingMap crewMembers={crewMembers} jobs={jobs} />
          </div>
        </div>
      </div>
    );
  };

  const SchedulingView = () => {
    const [newJob, setNewJob] = useState({
      customer: '',
      type: '',
      address: '',
      crew: 'Team Alpha',
      price: '',
      instructions: '',
      phone: '',
      equipment: 'Zero Turn'
    });
    
    const [equipmentFilter, setEquipmentFilter] = useState('all');

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
          equipment: 'Zero Turn'
        });
      } else {
        alert('Error adding job. Please try again.');
      }
    };

    const filteredJobsByEquipment = equipmentFilter === 'all' 
      ? jobs 
      : jobs.filter(job => job.equipment === equipmentFilter);

    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Job Scheduling</h1>
          <button onClick={fetchAllData} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <RefreshCw className="inline mr-2" size={16} />
            Refresh Jobs
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Add New Job</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Customer name"
                value={newJob.customer}
                onChange={(e) => setNewJob({...newJob, customer: e.target.value})}
                className="p-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Job type"
                value={newJob.type}
                onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                className="p-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Address"
                value={newJob.address}
                onChange={(e) => setNewJob({...newJob, address: e.target.value})}
                className="col-span-2 p-2 border rounded-lg"
              />
              <select
                value={newJob.crew}
                onChange={(e) => setNewJob({...newJob, crew: e.target.value})}
                className="p-2 border rounded-lg"
              >
                <option value="Team Alpha">Team Alpha</option>
                <option value="Team Beta">Team Beta</option>
              </select>
              <select
                value={newJob.equipment}
                onChange={(e) => setNewJob({...newJob, equipment: e.target.value})}
                className="p-2 border rounded-lg"
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
                className="p-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Phone number"
                value={newJob.phone}
                onChange={(e) => setNewJob({...newJob, phone: e.target.value})}
                className="p-2 border rounded-lg"
              />
              <textarea
                placeholder="Special instructions"
                value={newJob.instructions}
                onChange={(e) => setNewJob({...newJob, instructions: e.target.value})}
                className="col-span-2 p-2 border rounded-lg h-24"
              />
            </div>
            <button 
              onClick={handleAddJob}
              className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Job to Schedule
            </button>

            <div className="flex justify-between items-center mt-6 mb-4">
              <h3 className="font-semibold text-gray-800">Current Jobs ({jobs.length})</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEquipmentFilter('all')}
                  className={`px-3 py-1 text-sm rounded ${equipmentFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setEquipmentFilter('Zero Turn')}
                  className={`px-3 py-1 text-sm rounded ${equipmentFilter === 'Zero Turn' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Zero Turn
                </button>
                <button 
                  onClick={() => setEquipmentFilter('V Ride')}
                  className={`px-3 py-1 text-sm rounded ${equipmentFilter === 'V Ride' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  V Ride
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredJobsByEquipment.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">{job.customer}</h4>
                      <p className="text-sm text-gray-600">{job.type}</p>
                      {job.equipment && (
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {job.equipment}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id, e.target.value)}
                        className="text-sm px-2 py-1 border rounded"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{job.address}</p>
                    <p className="mt-1">Team: {job.crew} • Price: {job.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Equipment Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-600">Zero Turn</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Available</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-600">V Ride</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Available</span>
                </div>
                <div className="flex justify-between items-center p-2">
                  <span className="text-sm text-gray-600">Push Mower</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">In Use</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Database Info</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Supabase Connected</p>
                  <p className="text-xs text-gray-600">Real-time sync active</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">{jobs.length} jobs in database</p>
                  <p className="text-xs text-gray-600">Updates automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuotesView = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Quotes Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Pending Quotes ({quotes.length})</h3>
          <div className="space-y-3">
            {quotes.map(quote => (
              <div key={quote.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-800">{quote.customer}</h4>
                    <p className="text-sm text-gray-600">{quote.service}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-600">{quote.price_range}</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quote Generator</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Customer name" className="w-full p-2 border rounded" />
            <input type="text" placeholder="Service type" className="w-full p-2 border rounded" />
            <textarea placeholder="Service description" className="w-full p-2 border rounded h-24" />
            <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Generate Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const MessagesView = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Customer Messages</h1>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800">Recent Messages ({messages.length})</h3>
        </div>
        <div className="divide-y">
          {messages.map(msg => (
            <div key={msg.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{msg.from_name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      msg.status === 'auto-processed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {msg.status === 'auto-processed' ? 'AI Handled' : 'Needs Review'}
                    </span>
                  </div>
                  <p className="text-gray-600">{msg.message}</p>
                  {msg.phone && (
                    <p className="text-sm text-gray-500 mt-1">Phone: {msg.phone}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CrewManagementView = () => (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Crew Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Team Members ({crewMembers.length})</h3>
          <div className="space-y-3">
            {crewMembers.map(member => (
              <div key={member.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.team}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Hours</p>
                    <p className="font-semibold">{member.hours}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500 fill-current" size={14} />
                      <span className="font-semibold">{member.rating}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Team Stats</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Active</p>
              <p className="text-2xl font-bold text-gray-800">{crewMembers.length} members</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {crewMembers.length > 0 
                  ? (crewMembers.reduce((acc, member) => acc + parseFloat(member.rating), 0) / crewMembers.length).toFixed(1) 
                  : '0.0'} ★
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Productivity</p>
              <p className="text-2xl font-bold text-green-600">
                {crewMembers.length > 0 
                  ? Math.round(crewMembers.reduce((acc, member) => acc + member.productivity, 0) / crewMembers.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scheduling', label: 'Job Scheduling', icon: Calendar },
    { id: 'quotes', label: 'Quotes', icon: DollarSign },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'crew', label: 'Crew Management', icon: Users }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-green-600">🌱 Bright.AI</h1>
          <p className="text-sm text-gray-600">Admin Dashboard</p>
        </div>
        <nav className="p-4 space-y-2">
          {adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'scheduling' && <SchedulingView />}
        {activeTab === 'quotes' && <QuotesView />}
        {activeTab === 'messages' && <MessagesView />}
        {activeTab === 'crew' && <CrewManagementView />}
      </div>
    </div>
  );
}

// Simple Crew Mobile App - Just 2 Main Pages
function CrewApp() {
  const [activeView, setActiveView] = useState('menu');
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // States for data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchJobs();
    // Update time every second
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

  // Simple Menu View
  const MenuView = () => (
    <div className="min-h-screen bg-green-600">
      <div className="px-6 py-8 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">Bright.AI</h1>
        <p className="text-green-100 mb-1">Team Alpha</p>
        <p className="text-green-200 text-sm">Connected</p>
      </div>

      <div className="px-6 pb-8">
        <div className="space-y-4">
          <button 
            onClick={() => setActiveView('work')}
            className="w-full bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Briefcase className="mx-auto mb-3 text-green-600" size={40} />
            <h2 className="text-xl font-bold text-gray-800 mb-1">WORK</h2>
            <p className="text-gray-600 text-sm">View jobs and clock in/out</p>
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className="w-full bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Users className="mx-auto mb-3 text-blue-600" size={40} />
            <h2 className="text-xl font-bold text-gray-800 mb-1">PROFILE</h2>
            <p className="text-gray-600 text-sm">View your dashboard and stats</p>
          </button>
        </div>
        
        <button className="w-full mt-8 py-3 border-2 border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-colors">
          Log Out
        </button>
      </div>
    </div>
  );

  // Gamified Work View - Map + Game Cards + Stats
  const WorkView = () => {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);
    const [mapLoaded, setMapLoaded] = React.useState(false);

    // Game-like stats
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const activeJobs = jobs.filter(j => j.status === 'In Progress').length;
    const scheduledJobs = jobs.filter(j => j.status === 'Scheduled').length;
    const totalRevenue = jobs.reduce((sum, job) => {
      if (job.status === 'Completed' && job.price) {
        return sum + parseInt(job.price.replace(/[^0-9]/g, '') || 0);
      }
      return sum;
    }, 0);

    // Initialize mini-map
    React.useEffect(() => {
      if (typeof window !== 'undefined' && window.L && !mapLoaded) {
        initializeMiniMap();
      }

      function initializeMiniMap() {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }

          if (mapRef.current) {
            mapRef.current.innerHTML = '';
          }

          const map = window.L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false
          }).setView([40.7934, -77.8600], 12);
          
          mapInstanceRef.current = map;
          
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

          // Add job markers
          jobs.forEach((job, index) => {
            const baseLatLng = [40.7934, -77.8600];
            const offset = 0.015;
            const lat = baseLatLng[0] + (index * offset) - 0.02;
            const lng = baseLatLng[1] + ((index % 2) * offset) - 0.01;
            
            const markerColor = job.status === 'Completed' ? '#10b981' : 
                               job.status === 'In Progress' ? '#3b82f6' : '#eab308';
            
            window.L.circleMarker([lat, lng], {
              color: markerColor,
              fillColor: markerColor,
              fillOpacity: 0.8,
              radius: 6
            }).addTo(map);
          });

          // Add current location
          window.L.circleMarker([40.7934, -77.8600], {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 1,
            radius: 8
          }).addTo(map);

          setMapLoaded(true);
        } catch (error) {
          console.error('Error initializing mini map:', error);
        }
      }

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [jobs]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setActiveView('menu')} className="p-2">
              <ChevronLeft size={24} />
            </button>
            <div className="text-center">
              <h1 className="font-bold text-lg">TODAY'S MISSION</h1>
              <p className="text-xs text-green-100">Team Alpha • {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-xs">Live</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Mini Map */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h3 className="font-bold text-sm">🗺️ Mission Map</h3>
              <p className="text-xs opacity-90">{jobs.length} jobs in your area</p>
            </div>
            <div 
              ref={mapRef} 
              className="h-32 w-full bg-gray-100"
            />
            <div className="p-2 bg-gray-50 text-xs text-center text-gray-600">
              🔴 You • 🟡 Scheduled • 🔵 Active • 🟢 Complete
            </div>
          </div>

          {/* Clock In/Out Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            
            <button 
              onClick={() => setClockedIn(!clockedIn)}
              className={`w-full py-4 px-6 text-lg font-bold rounded-xl transition-all transform active:scale-95 ${
                clockedIn 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
              }`}
            >
              {clockedIn ? '⏰ CLOCK OUT' : '🚀 START YOUR DAY'}
            </button>
            
            <div className="text-sm text-gray-600 mt-3">
              {clockedIn ? '💪 Working since 8:00 AM (7h 32m)' : '☀️ Ready to begin!'}
            </div>
          </div>

          {/* Game Stats Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              📊 Your Stats Today
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-700">{completedJobs}</div>
                <div className="text-xs text-green-600">✅ Completed</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-700">{activeJobs}</div>
                <div className="text-xs text-blue-600">⚡ Active</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-3 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-700">{scheduledJobs}</div>
                <div className="text-xs text-yellow-600">📋 Queued</div>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-purple-700">${totalRevenue}</div>
                <div className="text-xs text-purple-600">💰 Earned</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Daily Progress</span>
                <span>{Math.round(jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Mission Cards */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                🎯 Active Missions ({jobs.length})
              </h3>
              <button onClick={fetchJobs} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-medium">All missions complete!</p>
                <p className="text-sm">Great work today, hero!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {jobs.map((job, index) => (
                  <div key={job.id} className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                    job.status === 'Completed' ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200' :
                    job.status === 'In Progress' ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' :
                    'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
                  }`}>
                    {/* Mission Card Header */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🏠</span>
                            <h4 className="font-bold text-gray-800">{job.customer}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              job.status === 'Completed' ? 'bg-green-200 text-green-800' :
                              job.status === 'In Progress' ? 'bg-blue-200 text-blue-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {job.status === 'Completed' ? '✅ DONE' :
                               job.status === 'In Progress' ? '⚡ ACTIVE' : '📋 READY'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">🌱 {job.type}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            📍 {job.address}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{job.price}</div>
                          <div className="text-xs text-gray-500">{job.equipment}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {job.phone && (
                          <button className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium flex items-center gap-1 hover:bg-blue-600 transition-colors">
                            📞 Call
                          </button>
                        )}
                        
                        {job.status === 'Scheduled' && (
                          <button 
                            onClick={() => updateJobStatus(job.id, 'In Progress')}
                            className="flex-1 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all transform active:scale-95"
                          >
                            🚀 START MISSION
                          </button>
                        )}
                        
                        {job.status === 'In Progress' && (
                          <button 
                            onClick={() => updateJobStatus(job.id, 'Completed')}
                            className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all transform active:scale-95"
                          >
                            ✅ COMPLETE
                          </button>
                        )}

                        {job.status === 'Completed' && (
                          <div className="flex-1 py-2 text-center text-green-600 font-medium bg-green-100 rounded-lg">
                            🎉 MISSION COMPLETE
                          </div>
                        )}
                      </div>

                      {/* Mission Notes */}
                      {job.instructions && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">📝 Mission Brief:</span> {job.instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Number Badge */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievement Badge */}
          {completedJobs >= 3 && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-4 text-white text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-bold">Achievement Unlocked!</h3>
              <p className="text-sm opacity-90">Mission Master - Completed 3+ jobs today!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Profile Dashboard View - Everything personal in one page
  const ProfileView = () => {
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const totalRevenue = jobs.reduce((sum, job) => {
      if (job.status === 'Completed' && job.price) {
        return sum + parseInt(job.price.replace(/[^0-9]/g, '') || 0);
      }
      return sum;
    }, 0);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setActiveView('menu')} className="p-2">
              <ChevronLeft size={24} />
            </button>
            <h1 className="font-bold text-lg">PROFILE</h1>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">JS</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">John Smith</h2>
            <p className="text-gray-600">Team Alpha</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="text-yellow-500 fill-current" size={16} />
              <span className="font-semibold">4.8</span>
              <span className="text-gray-500 text-sm">rating</span>
            </div>
            
            {/* Current Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${clockedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="font-medium">{clockedIn ? 'Currently Working' : 'Off Duty'}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {clockedIn ? 'Since 8:00 AM (7h 32m)' : 'Ready to work'}
              </p>
            </div>
          </div>

          {/* Today's Performance */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Today's Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
                <div className="text-sm text-gray-600">Jobs Done</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${totalRevenue}</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{clockedIn ? '7h 32m' : '0h'}</div>
                <div className="text-sm text-gray-600">Hours Today</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">92%</div>
                <div className="text-sm text-gray-600">Efficiency</div>
              </div>
            </div>
          </div>

          {/* This Week Stats */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Jobs Completed</span>
                <span className="font-bold text-gray-800">23</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Hours Worked</span>
                <span className="font-bold text-gray-800">38h 15m</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Revenue Generated</span>
                <span className="font-bold text-green-600">$1,850</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">On-Time Rate</span>
                <span className="font-bold text-green-600">95%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-gray-700">Customer Rating</span>
                <span className="font-bold text-yellow-600">4.8★</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
                <Phone className="inline mr-2" size={18} />
                Contact Supervisor
              </button>
              <button className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium">
                <Camera className="inline mr-2" size={18} />
                Submit Photo Report
              </button>
              <button className="w-full py-3 bg-green-600 text-white rounded-lg font-medium">
                <Star className="inline mr-2" size={18} />
                View Performance Goals
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

// Main App Component
function BrightAIApp() {
  const [currentView, setCurrentView] = useState('admin');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg border p-2 flex gap-2">
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'admin'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👨‍💼 Admin
          </button>
          <button
            onClick={() => setCurrentView('crew')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'crew'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🚛 Crew
          </button>
        </div>
      </div>

      {currentView === 'admin' ? <AdminApp /> : <CrewApp />}
    </div>
  );
}

export default BrightAIApp;