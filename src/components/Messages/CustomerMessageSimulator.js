import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, User, Phone, AlertCircle, CheckCircle, RefreshCw, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../services/database/supabase';

export default function CustomerMessageSimulator() {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    messageText: ''
  });
  
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  
  // Quick fill examples - based on your actual customer data
  const quickFillOptions = [
    { name: 'Janet', phone: '610-555-1112' },
    { name: 'Mr. Moore', phone: '610-555-1113' },
    { name: 'Fred', phone: '610-555-1117' },
    { name: 'David', phone: '610-555-1118' },
    { name: 'Cooper', phone: '610-555-1113' },
    { name: 'Linda', phone: '610-555-1126' },
    { name: 'Jim', phone: '610-555-1128' }
  ];
  
  // Example messages customers might send
  const exampleMessages = [
    "Can you reschedule to next week?",
    "Cancel tomorrow's service",
    "Come earlier if possible",
    "Is my appointment still on for today?",
    "Add hedge trimming to my service",
    "What time are you coming?",
    "The gate code is 1234",
    "Skip this week please",
    "Can you give me a quote for tree removal?",
    "I won't be home, just do the backyard",
    "Change to bi-weekly service",
    "There's a dog in the yard today",
    "Use the side gate, front is locked",
    "Don't cut it too short this time",
    "Can you also do the neighbor's yard?",
    "I left a check under the mat",
    "Text me when you arrive",
    "Do you do snow removal?",
    "I need to update my payment method",
    "Thanks for the great job last week!"
  ];
  
  useEffect(() => {
    loadMessageHistory();
  }, []);
  
  const loadMessageHistory = async () => {
  try {
    // No need for dynamic import since we imported at the top
    const messages = await supabase.fetchData('messages', 20);
    
    if (messages) {
      // Sort by most recent first
      const sorted = messages.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setMessageHistory(sorted.slice(0, 10));
    }
  } catch (error) {
    console.error('Error loading message history:', error);
  }
};
  
  const sendMessage = async () => {
    // Validate inputs
    if (!formData.customerName.trim()) {
      setResult({ 
        type: 'error', 
        message: 'Please enter a customer name' 
      });
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      setResult({ 
        type: 'error', 
        message: 'Please enter a phone number' 
      });
      return;
    }
    
    if (!formData.messageText.trim()) {
      setResult({ 
        type: 'error', 
        message: 'Please enter a message' 
      });
      return;
    }
    
    setSending(true);
    setResult(null);
    
    try {
      // Get n8n webhook URL from environment
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL || 
                        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      
      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        throw new Error('n8n webhook URL not configured in environment variables');
      }
      
      // Create payload exactly as a real SMS would come in
      const payload = {
        body: {
          message: formData.messageText,
          from_name: formData.customerName,
          from_phone: formData.phoneNumber,
          from_email: '', // Usually empty from SMS
          timestamp: new Date().toISOString()
        }
      };
      
      console.log('Sending to n8n:', payload);
      
      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'Customer-Message-Test'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: 'Message sent successfully!',
          details: 'The AI is processing this message. Check n8n executions and refresh to see results.'
        });
        
        // Clear form for next message
        setFormData({
          customerName: '',
          phoneNumber: '',
          messageText: ''
        });
        
        // Reload message history after a delay
        setTimeout(() => {
          loadMessageHistory();
        }, 3000);
        
      } else {
        throw new Error(`n8n returned status ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setResult({
        type: 'error',
        message: 'Failed to send message',
        details: error.message,
        adminAction: true
      });
    } finally {
      setSending(false);
    }
  };
  
  const quickFill = (customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      phoneNumber: customer.phone
    });
  };
  
  const getStatusBadge = (message) => {
    if (message.status === 'processed' && message.intent) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle size={14} />
          AI: {message.intent}
        </span>
      );
    } else if (message.needs_admin_review) {
      return (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertCircle size={14} />
          Needs Review
        </span>
      );
    } else if (message.status === 'failed') {
      return (
        <span className="flex items-center gap-1 text-red-600">
          <XCircle size={14} />
          Failed
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-gray-500">
          <Clock size={14} />
          Pending
        </span>
      );
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-blue-600" />
            Customer Message Simulator
          </h2>
          <p className="text-gray-600 mt-1">
            Test how the AI handles different customer messages
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <div className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Enter customer name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    placeholder="Enter phone number (e.g., 610-555-1112)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Quick Fill Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Fill (Your Customers)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickFillOptions.map((customer, index) => (
                      <button
                        key={index}
                        onClick={() => quickFill(customer)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {customer.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Message Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Text
                  </label>
                  <textarea
                    value={formData.messageText}
                    onChange={(e) => setFormData({...formData, messageText: e.target.value})}
                    placeholder="Type message exactly as customer would send it..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include typos, abbreviations, or unclear requests to test AI handling
                  </p>
                </div>
                
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={sending}
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    sending 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Test Message
                    </>
                  )}
                </button>
                
                {/* Result Display */}
                {result && (
                  <div className={`p-4 rounded-lg ${
                    result.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      result.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className="text-sm text-gray-600 mt-1">{result.details}</p>
                    )}
                    {result.adminAction && (
                      <div className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        Admin can manually process this in the Messages section
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side - Examples and History */}
            <div className="space-y-6">
              {/* Example Messages */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Example Messages to Try</h3>
                <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {exampleMessages.map((msg, index) => (
                      <button
                        key={index}
                        onClick={() => setFormData({...formData, messageText: msg})}
                        className="block w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-50 rounded transition-colors"
                      >
                        "{msg}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Recent Messages */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Recent Test Messages</h3>
                  <button
                    onClick={loadMessageHistory}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  {messageHistory.length > 0 ? (
                    <div className="space-y-2">
                      {messageHistory.slice(0, 5).map((msg, index) => (
                        <div key={index} className="bg-white p-3 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{msg.from_name}</p>
                              <p className="text-xs text-gray-500">{msg.phone || msg.from_phone}</p>
                              <p className="text-sm mt-1">{msg.message}</p>
                            </div>
                            <div className="ml-2">
                              {getStatusBadge(msg)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No messages yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Messages go through n8n to AI for processing</li>
              <li>• AI detects intent (reschedule, cancel, confirm, etc.)</li>
              <li>• Clear messages update the schedule automatically</li>
              <li>• Confusing messages are flagged for admin review</li>
              <li>• Admin can manually handle any message in Job Scheduling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}