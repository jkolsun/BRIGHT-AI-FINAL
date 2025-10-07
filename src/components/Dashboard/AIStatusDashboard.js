// components/Dashboard/AIStatusDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle, XCircle, AlertCircle, 
  RefreshCw, Settings, Zap, Database, 
  Cloud, MessageSquare, Calendar, Bot,
  DollarSign, Mic, Send, Loader
} from 'lucide-react';
import n8nAutomation from '../../services/automation/n8n';

const AIStatusDashboard = () => {
  const [status, setStatus] = useState({
    openai: 'checking',
    n8n: 'checking',
    supabase: 'checking',
    weather: 'checking'
  });
  
  const [tests, setTests] = useState({
    scheduleOptimization: null,
    customerResponse: null,
    quoteGeneration: null,
    n8nWebhook: null
  });

  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    // Check OpenAI
    const openaiStatus = await checkOpenAI();
    setStatus(prev => ({ ...prev, openai: openaiStatus }));

    // Check n8n with REAL test
    const n8nStatus = await checkN8nReal();
    setStatus(prev => ({ ...prev, n8n: n8nStatus }));

    // Check Supabase
    const supabaseStatus = await checkSupabase();
    setStatus(prev => ({ ...prev, supabase: supabaseStatus }));

    // Check Weather API
    const weatherStatus = await checkWeatherAPI();
    setStatus(prev => ({ ...prev, weather: weatherStatus }));
  };

  const checkOpenAI = async () => {
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your-openai-api-key-here') {
        return 'not-configured';
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      return response.ok ? 'connected' : 'error';
    } catch (error) {
      return 'error';
    }
  };

  // THIS IS THE NEW REAL N8N CHECK
  const checkN8nReal = async () => {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      
      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        return 'not-configured';
      }

      // Send a real test message to n8n
      const testMessage = {
        body: {
          message: "System health check",
          from_name: "AI Status Dashboard",
          from_phone: "000-0000",
          from_email: "status@system.com",
          company_name: "System Test"
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'Status-Dashboard'
        },
        body: JSON.stringify(testMessage)
      });

      // If we get a response (even an error), n8n is reachable
      if (response.ok) {
        return 'connected';
      } else if (response.status === 404) {
        return 'wrong-url'; // Webhook URL is wrong
      } else if (response.status >= 500) {
        return 'n8n-error'; // n8n is having issues
      } else {
        return 'error';
      }
    } catch (error) {
      // Network error means n8n is not reachable
      console.error('n8n check failed:', error);
      return 'offline';
    }
  };

  const checkSupabase = async () => {
    try {
      const { supabase } = await import('../../services/database/supabase');
      const testData = await supabase.fetchData('jobs', 1);
      return 'connected';
    } catch (error) {
      return 'error';
    }
  };

  const checkWeatherAPI = async () => {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    if (!apiKey || apiKey === 'demo-key') {
      return 'not-configured';
    }
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Springfield&appid=${apiKey}`
      );
      return response.ok ? 'connected' : 'error';
    } catch {
      return 'error';
    }
  };

  // TEST N8N WITH A REAL MESSAGE
  const testN8nIntegration = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      // Use the n8n automation service
      const testMessage = {
        message: "Test from dashboard: Can you reschedule my lawn service to next Monday at 2pm?",
        from_name: "Test Customer",
        from_phone: "555-TEST",
        from_email: "test@example.com",
        customer: "Dashboard Test"
      };

      console.log('Sending test to n8n...');
      const result = await n8nAutomation.processMessage(testMessage);
      
      if (result.success) {
        setTestResults({
          success: true,
          message: 'n8n webhook received the message successfully!',
          details: result.data,
          instruction: 'Check your n8n workflow executions to see the processed message.'
        });
        setStatus(prev => ({ ...prev, n8n: 'connected' }));
        setTests(prev => ({ ...prev, n8nWebhook: 'success' }));
      } else {
        setTestResults({
          success: false,
          message: `Failed: ${result.error}`,
          retryable: result.retryable
        });
        setTests(prev => ({ ...prev, n8nWebhook: 'failed' }));
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`
      });
      setTests(prev => ({ ...prev, n8nWebhook: 'failed' }));
    } finally {
      setTesting(false);
    }
  };

  const runTestFeature = async (feature) => {
    if (feature === 'n8nTest') {
      await testN8nIntegration();
      return;
    }

    setTests(prev => ({ ...prev, [feature]: 'testing' }));

    try {
      switch(feature) {
        case 'scheduleOptimization':
          const { OpenAIService } = await import('../../services/ai/openai');
          const ai = new OpenAIService();
          const suggestions = await ai.generateScheduleSuggestions(
            [{ id: 1, customer: 'Test', address: '123 Main St' }],
            [{ id: 1, name: 'Team Alpha' }]
          );
          setTests(prev => ({ ...prev, scheduleOptimization: suggestions ? 'success' : 'failed' }));
          break;

        case 'customerResponse':
          // Test using n8n automation
          const response = await n8nAutomation.processCustomerMessage({
            content: 'Can you come tomorrow instead?',
            from_name: 'Test Customer',
            from_phone: '555-1234'
          });
          setTests(prev => ({ ...prev, customerResponse: response.success ? 'success' : 'failed' }));
          break;

        case 'quoteGeneration':
          const ai3 = new (await import('../../services/ai/openai')).OpenAIService();
          const quote = await ai3.generateQuote({
            service: 'Lawn Maintenance',
            propertySize: '1/4 acre',
            description: 'Weekly mowing and edging'
          });
          setTests(prev => ({ ...prev, quoteGeneration: quote ? 'success' : 'failed' }));
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Test ${feature} failed:`, error);
      setTests(prev => ({ ...prev, [feature]: 'failed' }));
    }
  };

  const getStatusIcon = (serviceStatus) => {
    switch(serviceStatus) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
      case 'n8n-error':
      case 'wrong-url':
        return <XCircle className="text-red-500" size={20} />;
      case 'not-configured':
      case 'offline':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Loader className="animate-spin text-gray-500" size={20} />;
    }
  };

  const getStatusText = (serviceStatus) => {
    switch(serviceStatus) {
      case 'connected': return 'Connected';
      case 'not-configured': return 'Not Configured';
      case 'wrong-url': return 'Wrong URL';
      case 'offline': return 'Offline';
      case 'n8n-error': return 'n8n Error';
      case 'error': return 'Error';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  const getTestIcon = (testStatus) => {
    switch(testStatus) {
      case 'success':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'failed':
        return <XCircle className="text-red-500" size={18} />;
      case 'testing':
        return <Loader className="animate-spin text-blue-500" size={18} />;
      default:
        return <div className="w-[18px] h-[18px]" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bot className="text-blue-600" />
          AI Integration Status
        </h2>
        <button
          onClick={checkAllServices}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh Status
        </button>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="text-gray-600" size={24} />
            {getStatusIcon(status.openai)}
          </div>
          <h3 className="font-semibold text-gray-800">OpenAI</h3>
          <p className="text-sm text-gray-600">{getStatusText(status.openai)}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-gray-600" size={24} />
            {getStatusIcon(status.n8n)}
          </div>
          <h3 className="font-semibold text-gray-800">n8n Automation</h3>
          <p className="text-sm text-gray-600">{getStatusText(status.n8n)}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Database className="text-gray-600" size={24} />
            {getStatusIcon(status.supabase)}
          </div>
          <h3 className="font-semibold text-gray-800">Supabase</h3>
          <p className="text-sm text-gray-600">{getStatusText(status.supabase)}</p>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Cloud className="text-gray-600" size={24} />
            {getStatusIcon(status.weather)}
          </div>
          <h3 className="font-semibold text-gray-800">Weather API</h3>
          <p className="text-sm text-gray-600">{getStatusText(status.weather)}</p>
        </div>
      </div>

      {/* n8n Test Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Test n8n Integration</h3>
        
        <button
          onClick={() => testN8nIntegration()}
          disabled={testing || status.n8n === 'not-configured'}
          className={`w-full mb-4 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
            testing || status.n8n === 'not-configured'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {testing ? (
            <>
              <Loader className="animate-spin" size={20} />
              Sending Test Message to n8n...
            </>
          ) : (
            <>
              <Send size={20} />
              Send Test Message to n8n Webhook
            </>
          )}
        </button>

        {/* Test Results */}
        {testResults && (
          <div className={`p-4 rounded-lg ${
            testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-semibold mb-1 ${
              testResults.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResults.success ? '✅ Success!' : '❌ Failed'}
            </p>
            <p className={`text-sm ${
              testResults.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResults.message}
            </p>
            {testResults.instruction && (
              <p className="text-sm text-gray-600 mt-2">
                💡 {testResults.instruction}
              </p>
            )}
            {testResults.details && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer">View Response Details</summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                  {JSON.stringify(testResults.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Feature Tests */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Test AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => runTestFeature('scheduleOptimization')}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={status.openai !== 'connected'}
          >
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span className="text-sm font-medium">Schedule Optimization</span>
            </div>
            {getTestIcon(tests.scheduleOptimization)}
          </button>

          <button
            onClick={() => runTestFeature('customerResponse')}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={status.n8n !== 'connected'}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-green-600" />
              <span className="text-sm font-medium">Customer Response (via n8n)</span>
            </div>
            {getTestIcon(tests.customerResponse)}
          </button>

          <button
            onClick={() => runTestFeature('quoteGeneration')}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={status.openai !== 'connected'}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-purple-600" />
              <span className="text-sm font-medium">Quote Generation</span>
            </div>
            {getTestIcon(tests.quoteGeneration)}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {status.n8n === 'not-configured' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>n8n not configured:</strong> Add your webhook URL to environment variables.
          </p>
        </div>
      )}

      {status.n8n === 'wrong-url' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            <strong>Wrong webhook URL:</strong> Check your n8n webhook URL in environment variables.
          </p>
        </div>
      )}

      {status.openai === 'connected' && status.n8n === 'connected' && status.supabase === 'connected' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ All systems connected! Your AI features are ready to use.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIStatusDashboard;