// components/SmartImportModal.js
import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader, ArrowRight, Info } from 'lucide-react';
import { supabase } from '../services/database/supabase';

const SmartImportModal = ({ isOpen, onClose, importType, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [showMappingStep, setShowMappingStep] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Define required and optional fields for each import type - SIMPLIFIED VERSION
  const getFieldsForType = (type) => {
    switch(type) {
      case 'jobs':
        return {
          required: [
            { key: 'customer', label: 'Customer Name', example: 'John Smith' },
            { key: 'address', label: 'Property Address', example: '123 Main St' }
          ],
          optional: [
            { key: 'type', label: 'Service Type', example: 'Lawn Maintenance' },
            { key: 'price', label: 'Price/Rate', example: '$150' },
            { key: 'phone', label: 'Phone Number', example: '555-0123' },
            { key: 'instructions', label: 'Property Notes', example: 'Gate code: 1234, Dogs in yard' }
          ]
        };
      
      case 'quotes':
        return {
          required: [
            { key: 'customer', label: 'Customer Name', example: 'Jane Doe' },
            { key: 'service', label: 'Service Type', example: 'Tree Trimming' }
          ],
          optional: [
            { key: 'price_range', label: 'Price/Quote Amount', example: '$200-$300' },
            { key: 'details', label: 'Details/Description', example: 'Remove dead branches' }
          ]
        };
      
      case 'crew_members':
        return {
          required: [
            { key: 'name', label: 'Name', example: 'Mike Johnson' }
          ],
          optional: [
            { key: 'phone', label: 'Phone', example: '555-0123' },
            { key: 'email', label: 'Email', example: 'mike@example.com' }
          ]
        };
      
      case 'messages':
        return {
          required: [
            { key: 'from_name', label: 'From/Customer Name', example: 'Bob Wilson' },
            { key: 'message', label: 'Message Content', example: 'Can you come earlier?' }
          ],
          optional: [
            { key: 'phone', label: 'Phone', example: '555-0123' }
          ]
        };
      
      default:
        return { required: [], optional: [] };
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      parseFile(file);
    }
  };

  const parseFile = async (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let data;
        let headers;
        
        if (file.name.endsWith('.json')) {
          data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            headers = Object.keys(data[0]);
          }
        } else if (file.name.endsWith('.csv')) {
          const parsed = parseCSV(text);
          data = parsed.data;
          headers = parsed.headers;
        } else {
          throw new Error('Unsupported file format');
        }
        
        setParsedData(data);
        setCsvHeaders(headers || []);
        
        // Auto-detect mappings based on header names
        const autoMappings = autoDetectMappings(headers);
        setColumnMappings(autoMappings);
        
        // Generate preview with current mappings
        updatePreview(data.slice(0, 3), autoMappings);
        
        setImportStatus({
          type: 'success',
          message: `Found ${data.length} records with ${headers.length} columns`
        });
        
        setShowMappingStep(true);
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Error parsing file: ' + error.message
        });
      }
    };
    
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = lines.slice(1).map(line => {
      // Handle commas in quoted values
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    return { headers, data };
  };

  const autoDetectMappings = (headers) => {
    const mappings = {};
    const fields = getFieldsForType(importType);
    const allFields = [...fields.required, ...fields.optional];
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to find matching field
      const matchedField = allFields.find(field => {
        const fieldVariations = getFieldVariations(field.key);
        return fieldVariations.some(variation => 
          lowerHeader.includes(variation) || variation.includes(lowerHeader)
        );
      });
      
      if (matchedField) {
        mappings[header] = matchedField.key;
      }
    });
    
    return mappings;
  };

  const getFieldVariations = (fieldKey) => {
    const variations = {
      'customer': ['customer', 'client', 'name', 'customername', 'clientname', 'account', 'property', 'owner'],
      'type': ['type', 'service', 'jobtype', 'servicetype', 'category', 'work', 'description'],
      'address': ['address', 'location', 'street', 'propertyaddress', 'property', 'site', 'addr'],
      'price': ['price', 'cost', 'amount', 'fee', 'charge', 'total', 'rate', 'monthly', 'weekly', 'payment'],
      'phone': ['phone', 'telephone', 'mobile', 'cell', 'contact', 'number', 'tel'],
      'instructions': ['instructions', 'notes', 'comments', 'details', 'info', 'special', 'memo'],
      'service': ['service', 'type', 'jobtype', 'work'],
      'price_range': ['price', 'quote', 'estimate', 'range', 'amount'],
      'details': ['details', 'description', 'notes', 'info'],
      'from_name': ['from', 'sender', 'customer', 'name', 'contact'],
      'message': ['message', 'content', 'text', 'body', 'inquiry'],
      'name': ['name', 'fullname', 'employee', 'member', 'worker'],
      'email': ['email', 'mail', 'emailaddress']
    };
    
    return variations[fieldKey] || [fieldKey];
  };

  const updatePreview = (data, mappings) => {
    const transformed = data.map(row => {
      const newRow = {};
      Object.entries(mappings).forEach(([csvColumn, appField]) => {
        if (appField && appField !== 'skip') {
          newRow[appField] = row[csvColumn];
        }
      });
      return newRow;
    });
    setPreviewData(transformed);
  };

  const handleMappingChange = (csvHeader, appField) => {
    const newMappings = { ...columnMappings, [csvHeader]: appField };
    setColumnMappings(newMappings);
    updatePreview(parsedData.slice(0, 3), newMappings);
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No data to import'
      });
      return;
    }

    // Check if required fields are mapped
    const fields = getFieldsForType(importType);
    const mappedFields = Object.values(columnMappings).filter(f => f !== 'skip');
    const missingRequired = fields.required.filter(
      req => !mappedFields.includes(req.key)
    );

    if (missingRequired.length > 0) {
      setImportStatus({
        type: 'error',
        message: `Missing required fields: ${missingRequired.map(f => f.label).join(', ')}`
      });
      return;
    }

    setImporting(true);
    setImportStatus(null);

    try {
      // Transform data using mappings
      const transformedData = parsedData.map(row => {
        const transformed = {};
        
        // Apply mappings
        Object.entries(columnMappings).forEach(([csvColumn, appField]) => {
          if (appField && appField !== 'skip') {
            transformed[appField] = row[csvColumn] || '';
          }
        });
        
        // Add defaults for unmapped fields
        return addDefaultValues(transformed, importType);
      });
      
      // Import to Supabase
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (let i = 0; i < transformedData.length; i++) {
        try {
          const result = await supabase.insertData(importType, transformedData[i]);
          if (result) successCount++;
          else errorCount++;
        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          errors.push(`Row ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }

      setImportStatus({
        type: successCount > 0 ? 'success' : 'error',
        message: `Import complete: ${successCount} successful, ${errorCount} failed${
          errors.length > 0 ? '. Errors: ' + errors.slice(0, 3).join('; ') : ''
        }`
      });

      if (successCount > 0) {
        setTimeout(() => {
          onImportComplete();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Import failed: ' + error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const addDefaultValues = (item, type) => {
    const defaults = {
      jobs: {
        status: 'Scheduled',  // All imported jobs start as scheduled
        crew: 'Team Alpha',   // Default assignment
        equipment: 'Zero Turn', // Default equipment
        date: new Date().toISOString(), // Today's date
        type: item.type || 'Lawn Maintenance' // Default service type if not provided
      },
      quotes: {
        status: 'pending',
        created_at: new Date().toISOString()
      },
      crew_members: {
        team: 'Team Alpha',
        rating: 4.5,
        hours: 0,
        productivity: 85,
        status: 'active'
      },
      messages: {
        status: 'needs-review',
        created_at: new Date().toISOString()
      }
    };

    return { ...defaults[type], ...item };
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedData(null);
    setImportStatus(null);
    setImporting(false);
    setCsvHeaders([]);
    setColumnMappings({});
    setShowMappingStep(false);
    setPreviewData([]);
    onClose();
  };

  const fields = getFieldsForType(importType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Smart Import</h2>
            <p className="text-blue-100 mt-1">
              Import {importType.replace('_', ' ')} - {showMappingStep ? 'Step 2: Map Your Columns' : 'Step 1: Upload File'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showMappingStep ? (
            // Step 1: File Upload
            <>
              <div className="mb-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">CSV or JSON files supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info className="text-blue-600 mt-0.5" size={20} />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Import your existing customer list!</p>
                    <p>Upload any CSV with customer names and addresses. Service schedules and job status will be managed through the app.</p>
                  </div>
                </div>
              </div>

              {importType === 'jobs' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Sample Format (any column names work!)</h4>
                  <div className="bg-white rounded border p-3 font-mono text-xs overflow-x-auto">
                    <div className="text-gray-600">Client Name,Property,Monthly Rate,Contact,Notes</div>
                    <div className="text-gray-800">Johnson Family,123 Oak Street,150,555-0101,Gate code 4321</div>
                    <div className="text-gray-800">Smith Residence,456 Maple Ave,175,555-0102,Dogs in backyard</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Step 2: Column Mapping
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Match Your Columns to Our Fields
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    We found {csvHeaders.length} columns in your file. Map them to the appropriate fields below:
                  </p>
                  
                  {/* Required Fields */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2 text-sm">Required Fields</h4>
                    <div className="space-y-2">
                      {fields.required.map(field => (
                        <div key={field.key} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                          <select
                            value={Object.keys(columnMappings).find(k => columnMappings[k] === field.key) || ''}
                            onChange={(e) => {
                              // Clear previous mapping for this field
                              const newMappings = { ...columnMappings };
                              Object.keys(newMappings).forEach(key => {
                                if (newMappings[key] === field.key) {
                                  delete newMappings[key];
                                }
                              });
                              // Set new mapping
                              if (e.target.value) {
                                newMappings[e.target.value] = field.key;
                              }
                              setColumnMappings(newMappings);
                              updatePreview(parsedData.slice(0, 3), newMappings);
                            }}
                            className="flex-1 p-2 border rounded text-sm"
                          >
                            <option value="">Select your column...</option>
                            {csvHeaders.map(header => (
                              <option key={header} value={header} disabled={columnMappings[header] && columnMappings[header] !== field.key}>
                                {header} {columnMappings[header] && columnMappings[header] !== field.key ? '(already mapped)' : ''}
                              </option>
                            ))}
                          </select>
                          <ArrowRight className="text-gray-400" size={20} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{field.label} *</div>
                            <div className="text-xs text-gray-500">e.g., {field.example}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 text-sm">Optional Fields</h4>
                    <div className="space-y-2">
                      {fields.optional.map(field => (
                        <div key={field.key} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                          <select
                            value={Object.keys(columnMappings).find(k => columnMappings[k] === field.key) || ''}
                            onChange={(e) => {
                              const newMappings = { ...columnMappings };
                              Object.keys(newMappings).forEach(key => {
                                if (newMappings[key] === field.key) {
                                  delete newMappings[key];
                                }
                              });
                              if (e.target.value) {
                                newMappings[e.target.value] = field.key;
                              }
                              setColumnMappings(newMappings);
                              updatePreview(parsedData.slice(0, 3), newMappings);
                            }}
                            className="flex-1 p-2 border rounded text-sm"
                          >
                            <option value="">Select your column...</option>
                            {csvHeaders.map(header => (
                              <option key={header} value={header} disabled={columnMappings[header] && columnMappings[header] !== field.key}>
                                {header} {columnMappings[header] && columnMappings[header] !== field.key ? '(already mapped)' : ''}
                              </option>
                            ))}
                          </select>
                          <ArrowRight className="text-gray-400" size={20} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{field.label}</div>
                            <div className="text-xs text-gray-500">e.g., {field.example}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unmapped Columns */}
                  {csvHeaders.filter(h => !columnMappings[h]).length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Unmapped columns:</strong> {csvHeaders.filter(h => !columnMappings[h]).join(', ')}
                        <span className="text-xs block mt-1">These columns will be ignored during import</span>
                      </p>
                    </div>
                  )}

                  {importType === 'jobs' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Automatic Settings:</strong> All imported jobs will be set to "Scheduled" status and assigned to "Team Alpha". You can update these after import.
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {previewData.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Preview (First 3 Records After Mapping)</h4>
                    <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(previewData[0]).map(key => (
                              <th key={key} className="text-left p-2 font-medium text-gray-700">
                                {fields.required.find(f => f.key === key)?.label || 
                                 fields.optional.find(f => f.key === key)?.label || 
                                 key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="p-2 text-gray-600">
                                  {val || <span className="text-gray-400">empty</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Messages */}
          {importStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              importStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle size={20} className="mt-0.5" />
              ) : (
                <AlertCircle size={20} className="mt-0.5" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            {showMappingStep && (
              <button
                onClick={() => setShowMappingStep(false)}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                ← Back to Upload
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {showMappingStep && (
                <button
                  onClick={handleImport}
                  disabled={!parsedData || importing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing && <Loader className="animate-spin" size={16} />}
                  {importing ? 'Importing...' : `Import ${parsedData?.length || 0} Records`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartImportModal;