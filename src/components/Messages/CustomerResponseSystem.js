// components/Messages/CustomerResponseSystem.js
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, AlertCircle, CheckCircle, 
  Clock, Calendar, User, Zap, Bot, Phone,
  Mail, AlertTriangle, ThumbsUp, Edit3,
  RefreshCw, XCircle
} from 'lucide-react';
import { OpenAIService } from '../../services/ai/openai';
import { supabase } from '../../services/database/supabase';
import n8nAutomation from '../../services/automation/n8n';

const CustomerResponseSystem = () => {
  const [messages, setMessages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    autoResponded: 0,
    schedulesChanged: 0,
    urgentFlags: 0
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [autoMode, setAutoMode] = useState(true);
  const [n8nConnected, setN8nConnected] = useState(false);

  const ai = new OpenAIService();

 useEffect(() => {
  const checkN8N = async () => {
    const health = await n8nAutomation.checkHealth();
    setN8nConnected(health.healthy);
  };
  checkN8N();
  loadMessages();
  subscribeToMessages();
}, []);

  const loadMessages = async () => {
    try {
      const data = await supabase.fetchData('messages');
      const sortedMessages = (data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setMessages(sortedMessages);
      updateStats(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    // In production, set up Supabase real-time subscription
    // For now, poll every 30 seconds
    setInterval(loadMessages, 30000);
  };

  const updateStats = (msgs) => {
    setStats({
      totalMessages: msgs.length,
      autoResponded: msgs.filter(m => m.auto_responded).length,
      schedulesChanged: msgs.filter(m => m.schedule_changed).length,
      urgentFlags: msgs.filter(m => m.urgency === 'high').length
    });
  };

const processMessage = async (message) => {
  setProcessing(true);
  
  try {
    // Send to n8n for AI processing
    const n8nResult = await n8nAutomation.processCustomerMessage({
      message: message.content,
      from_phone: message.from_phone,
      from_name: message.from_name || 'Customer',
      from_email: message.from_email
    });
    
    let analysis = {};
    let actionTaken = null;
    let scheduleUpdated = false;
    
    if (n8nResult.success) {
      // Use n8n's AI response
      analysis = {
        intent: n8nResult.intent || n8nResult.data?.intent || 'general',
        urgency: n8nResult.data?.urgency || 'normal',
        suggestedResponse: n8nResult.data?.response || n8nResult.data?.suggestedResponse,
        extractedData: n8nResult.data?.extractedData
      };
      
      console.log('N8N processed message:', analysis);
    } else {
      // Fallback to local AI if n8n fails
      console.log('N8N failed, using local AI processing');
      analysis = await ai.processCustomerMessage(message.content);
    }
    
    // Take action based on intent (keep existing switch logic)
    switch(analysis.intent) {
      case 'reschedule':
        actionTaken = await handleReschedule(message, analysis);
        scheduleUpdated = true;
        break;
      case 'cancel':
        actionTaken = await handleCancellation(message, analysis);
        scheduleUpdated = true;
        break;
      // ... rest of existing cases
    }
    
    // Send response if in auto mode
    if (autoMode && analysis.suggestedResponse) {
      await sendResponse(message, analysis.suggestedResponse);
    }
    
    // Update message record
    await supabase.updateData('messages', message.id, {
      processed: true,
      intent: analysis.intent,
      urgency: analysis.urgency,
      auto_responded: autoMode,
      suggested_response: analysis.suggestedResponse,
      action_taken: actionTaken,
      schedule_changed: scheduleUpdated,
      processed_at: new Date().toISOString(),
      processed_by: n8nResult.success ? 'n8n-ai' : 'local-ai'
    });
    
    // Reload messages
    loadMessages();
    
  } catch (error) {
    console.error('Error processing message:', error);
    alert('Failed to process message');
  } finally {
    setProcessing(false);
  }
};

const batchProcessMessages = async () => {
  const unprocessedMessages = messages.filter(m => !m.processed);
  
  if (unprocessedMessages.length === 0) {
    alert('No unprocessed messages');
    return;
  }
  
  setProcessing(true);
  
  try {
    const results = await n8nAutomation.batchProcess(
      unprocessedMessages.map(m => ({
        message: m.content,
        from_name: m.from_name,
        from_phone: m.from_phone
      })),
      5 // Process 5 at a time
    );
    
    alert(`✅ Processed ${results.successful.length} messages via AI`);
    loadMessages();
  } catch (error) {
    console.error('Batch processing failed:', error);
  } finally {
    setProcessing(false);
  }
};

  const handleReschedule = async (message, analysis) => {
    // Extract new date/time from message
    const newDate = analysis.extractedData?.preferred_date;
    
    if (newDate) {
      // Find the customer's job
      const jobs = await supabase.queryData('jobs', { 
        customer_phone: message.from_phone 
      });
      
      if (jobs && jobs.length > 0) {
        // Update the job schedule
        await supabase.updateData('jobs', jobs[0].id, {
          scheduled_date: newDate,
          rescheduled: true,
          reschedule_reason: 'Customer request'
        });
        
        return `Rescheduled to ${newDate}`;
      }
    }
    
    return 'Reschedule requested - manual review needed';
  };

  const handleCancellation = async (message, analysis) => {
    const jobs = await supabase.queryData('jobs', { 
      customer_phone: message.from_phone 
    });
    
    if (jobs && jobs.length > 0) {
      await supabase.updateData('jobs', jobs[0].id, {
        status: 'cancelled',
        cancellation_reason: 'Customer request',
        cancelled_at: new Date().toISOString()
      });
      
      return 'Job cancelled';
    }
    
    return 'Cancellation noted';
  };

  const handleUrgentRequest = async (message, analysis) => {
    // Create high-priority job
    await supabase.insertData('jobs', {
      customer: message.from_name,
      phone: message.from_phone,
      service: analysis.extractedData?.service_type || 'Emergency Service',
      priority: 'high',
      status: 'urgent',
      notes: message.content,
      created_from: 'customer_message'
    });
    
    // Notify team
    await notifyTeam('Urgent service request', message);
    
    return 'Urgent job created and team notified';
  };

  const handleQuoteRequest = async (message, analysis) => {
    // Generate quote with AI
    const quote = await ai.generateQuote({
      service: analysis.extractedData?.service_type,
      propertySize: analysis.extractedData?.property_size,
      description: message.content
    });
    
    // Save quote
    await supabase.insertData('quotes', {
      customer: message.from_name,
      phone: message.from_phone,
      service: analysis.extractedData?.service_type,
      price_range: quote.priceRange,
      details: quote.breakdown,
      status: 'pending'
    });
    
    return `Quote generated: ${quote.priceRange}`;
  };

  const handleComplaint = async (message, analysis) => {
    // Flag for immediate attention
    await notifyTeam('Customer complaint requires attention', message);
    
    // Log complaint
    await supabase.insertData('complaints', {
      customer: message.from_name,
      content: message.content,
      severity: analysis.urgency,
      status: 'open'
    });
    
    return 'Complaint logged and escalated to management';
  };

  const handleGeneralInquiry = async (message, analysis) => {
    return 'General inquiry - response sent';
  };

  const sendResponse = async (message, responseText) => {
    // In production, integrate with SMS/Email service
    console.log('Sending response:', responseText);
    
    // For now, just log it
    await supabase.insertData('sent_messages', {
      to: message.from_phone || message.from_email,
      content: responseText,
      in_reply_to: message.id,
      sent_at: new Date().toISOString()
    });
  };

  const notifyTeam = async (subject, message) => {
    console.log('Team notification:', subject);
    // Integrate with notification service
  };

  const MessageCard = ({ message }) => {
    const getIntentIcon = (intent) => {
      switch(intent) {
        case 'reschedule': return <Calendar className="text-blue-500" size={18} />;
        case 'cancel': return <XCircle className="text-red-500" size={18} />;
        case 'urgent_service': return <AlertTriangle className="text-orange-500" size={18} />;
        case 'quote_request': return <Edit3 className="text-green-500" size={18} />;
        case 'complaint': return <AlertCircle className="text-red-600" size={18} />;
        default: return <MessageSquare className="text-gray-500" size={18} />;
      }
    };

    const getUrgencyColor = (urgency) => {
      switch(urgency) {
        case 'high': return 'border-red-500 bg-red-50';
        case 'medium': return 'border-yellow-500 bg-yellow-50';
        default: return 'border-gray-300 bg-white';
      }
    };

    return (
      <div 
        className={`border-2 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-lg transition-all ${getUrgencyColor(message.urgency)}`}
        onClick={() => setSelectedMessage(message)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {getIntentIcon(message.intent)}
            <h3 className="font-semibold">{message.from_name || 'Unknown'}</h3>
            <span className="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex gap-2">
            {message.processed && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                Processed
              </span>
            )}
            {message.auto_responded && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                Auto-Reply
              </span>
            )}
            {message.schedule_changed && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                Schedule Updated
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-700 mb-2">{message.content}</p>
        
        {message.suggested_response && (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <Bot size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-gray-600">AI Response:</span>
            </div>
            <p className="text-sm text-gray-600">{message.suggested_response}</p>
          </div>
        )}
        
        {message.action_taken && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle size={14} />
            Action: {message.action_taken}
          </div>
        )}
      </div>
    );
  };

  const StatsCard = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-gray-800">{stats.totalMessages}</div>
        <div className="text-sm text-gray-600">Total Messages</div>
      </div>
      <div className="bg-green-50 rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-green-600">{stats.autoResponded}</div>
        <div className="text-sm text-gray-600">Auto-Responded</div>
      </div>
      <div className="bg-purple-50 rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-purple-600">{stats.schedulesChanged}</div>
        <div className="text-sm text-gray-600">Schedules Updated</div>
      </div>
      <div className="bg-red-50 rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-red-600">{stats.urgentFlags}</div>
        <div className="text-sm text-gray-600">Urgent Flags</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="text-purple-600" size={28} />
              Customer Response System
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered message processing and automatic schedule updates
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadMessages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setAutoMode(!autoMode)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoMode 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {autoMode ? (
                <>
                  <Zap size={16} />
                  Auto Mode ON
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Auto Mode OFF
                </>
              )}
            </button>
            {/* N8N Connection Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
              <div className={`w-2 h-2 rounded-full ${n8nConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                N8N: {n8nConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {/* Batch Process Button */}
            <button
              onClick={batchProcessMessages}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Zap size={16} />
              Batch Process All
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsCard />

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail size={20} />
            Recent Messages
          </h2>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <MessageSquare className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-600">No messages yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Customer messages will appear here for AI processing
                </p>
              </div>
            ) : (
              messages.slice(0, 10).map(message => (
                <MessageCard key={message.id} message={message} />
              ))
            )}
          </div>
        </div>

        {/* Selected Message Detail */}
        <div>
          {selectedMessage ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Message Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">From:</label>
                  <p className="font-semibold">{selectedMessage.from_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedMessage.from_phone || selectedMessage.from_email}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Message:</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedMessage.content}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">AI Analysis:</label>
                  <div className="mt-2 p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm">
                        <strong>Intent:</strong> {selectedMessage.intent || 'Analyzing...'}
                      </span>
                      <span className="text-sm">
                        <strong>Urgency:</strong> {selectedMessage.urgency || 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Suggested Response:</label>
                  <textarea
                    className="w-full mt-1 p-3 border rounded-lg"
                    rows="4"
                    defaultValue={selectedMessage.suggested_response}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => processMessage(selectedMessage)}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Bot size={16} />
                        Process with AI
                      </>
                    )}
                  </button>
                  
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Send size={16} />
                    Send Response
                  </button>
                  
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Edit Response
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <MessageSquare className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-600">Select a message to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Features Info */}
      <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">AI Capabilities Active</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Intent Recognition</div>
              <div className="text-sm opacity-90">Understands reschedule, cancel, urgent requests</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Auto-Response</div>
              <div className="text-sm opacity-90">Drafts professional replies in seconds</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Schedule Updates</div>
              <div className="text-sm opacity-90">Automatically adjusts jobs based on requests</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerResponseSystem;