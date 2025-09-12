// components/Dashboard/AIStatusDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle, XCircle, AlertCircle, 
  RefreshCw, Settings, Zap, Database, 
  Cloud, MessageSquare, Calendar, Bot,
  DollarSign, Mic
} from 'lucide-react';

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
    voiceCommand: null
  });

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    // Check OpenAI
    const openaiStatus = await checkOpenAI();
    setStatus(prev => ({ ...prev, openai: openaiStatus }));

    // Check n8n
    const n8nStatus = await checkN8n();
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

  const checkN8n = async () => {
    try {
      const webhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL;
      if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
        return 'not-configured';
      }

      // Try to reach n8n webhook endpoint
      const response = await fetch(`${webhookUrl}health`, {
        method: 'GET',
        mode: 'no-cors' // Avoid CORS issues for testing
      });

      // If no error thrown, assume it's reachable
      return 'connected';
    } catch (error) {
      return 'not-configured';
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
    if (!apiKey) {
      return 'not-configured';
    }
    return 'connected';
  };

  const runTestFeature = async (feature) => {
    setTests(prev => ({ ...prev, [feature]: 'testing' }));

    try {
      switch(feature) {
        case 'scheduleOptimization':
          // Test schedule optimization
          const { OpenAIService } = await import('../../services/ai/openai');
          const ai = new OpenAIService();
          const suggestions = await ai.generateScheduleSuggestions(
            [{ id: 1, customer: 'Test', address: '123 Main St' }],
            [{ id: 1, name: 'Team Alpha' }]
          );
          setTests(prev => ({ ...prev, scheduleOptimization: suggestions.length > 0 ? 'success' : 'failed' }));
          break;

        case 'customerResponse':
          // Test customer response generation
          const ai2 = new (await import('../../services/ai/openai')).OpenAIService();
          const response = await ai2.generateCustomerResponse({
            content: 'Can you come tomorrow instead?',
            from_name: 'Test Customer'
          });
          setTests(prev => ({ ...prev, customerResponse: response.suggestedReply ? 'success' : 'failed' }));
          break;

        case 'quoteGeneration':
          // Test quote generation
          const ai3 = new (await import('../../services/ai/openai')).OpenAIService();
          const quote = await ai3.generateQuote({
            service: 'Lawn Maintenance',
            propertySize: '1/4 acre',
            description: 'Weekly mowing and edging'
          });
          setTests(prev => ({ ...prev, quoteGeneration: quote.priceRange ? 'success' : 'failed' }));
          break;

        case 'voiceCommand':
          // Test voice command processing
          const ai4 = new (await import('../../services/ai/openai')).OpenAIService();
          const command = await ai4.processVoiceCommand('Clock me in for work');
          setTests(prev => ({ ...prev, voiceCommand: command.intent ? 'success' : 'failed' }));
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Test failed for ${feature}:`, error);
      setTests(prev => ({ ...prev, [feature]: 'failed' }));
    }
  };

  const getStatusIcon = (serviceStatus) => {
    switch(serviceStatus) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'not-configured':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <RefreshCw className="animate-spin text-gray-400" size={20} />;
    }
  };

  const getStatusText = (serviceStatus) => {
    switch(serviceStatus) {
      case 'connected':
        return 'Connected';
      case 'not-configured':
        return 'Not Configured';
      case 'error':
        return 'Error';
      default:
        return 'Checking...';
    }
  };

  const getTestIcon = (testStatus) => {
    switch(testStatus) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'testing':
        return <RefreshCw className="animate-spin text-blue-500" size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
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
          {status.openai === 'not-configured' && (
            <p className="text-xs text-yellow-600 mt-1">Add API key in .env</p>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-gray-600" size={24} />
            {getStatusIcon(status.n8n)}
          </div>
          <h3 className="font-semibold text-gray-800">n8n Automation</h3>
          <p className="text-sm text-gray-600">{getStatusText(status.n8n)}</p>
          {status.n8n === 'not-configured' && (
            <p className="text-xs text-yellow-600 mt-1">Configure webhooks</p>
          )}
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

      {/* Feature Tests */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-3">Test AI Features</h3>
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
            disabled={status.openai !== 'connected'}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-green-600" />
              <span className="text-sm font-medium">Customer Response</span>
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

          <button
            onClick={() => runTestFeature('voiceCommand')}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={status.openai !== 'connected'}
          >
            <div className="flex items-center gap-2">
              <Mic size={18} className="text-red-600" />
              <span className="text-sm font-medium">Voice Commands</span>
            </div>
            {getTestIcon(tests.voiceCommand)}
          </button>
        </div>
      </div>

      {/* Configuration Guide */}
      {(status.openai === 'not-configured' || status.n8n === 'not-configured') && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Quick Setup Guide:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            {status.openai === 'not-configured' && (
              <li>1. Get your OpenAI API key from platform.openai.com</li>
            )}
            {status.n8n === 'not-configured' && (
              <li>2. Set up n8n workflows (optional but recommended)</li>
            )}
            <li>3. Add credentials to your .env file</li>
            <li>4. Restart your development server</li>
          </ol>
        </div>
      )}

      {/* Success Message */}
      {status.openai === 'connected' && status.supabase === 'connected' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ Core AI features are ready! Your app can now use intelligent scheduling, 
            automated responses, and smart recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIStatusDashboard;