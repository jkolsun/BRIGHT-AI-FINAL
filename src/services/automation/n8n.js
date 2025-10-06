// services/automation/n8n.js
export class N8NAutomation {
  constructor() {
    // Your single webhook URL from AI Message Processor workflow
    this.webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.REACT_APP_N8N_WEBHOOK_URL;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // Validate the webhook URL is configured
  validateWebhookUrl() {
    if (!this.webhookUrl || this.webhookUrl.includes('your-n8n-instance')) {
      console.error('N8N webhook URL not configured. Please update NEXT_PUBLIC_N8N_WEBHOOK_URL in .env.local');
      return false;
    }
    return true;
  }

  // Retry logic for failed requests
  async retryRequest(requestFunc, retries = 0) {
    try {
      return await requestFunc();
    } catch (error) {
      if (retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retries);
        console.log(`Retry attempt ${retries + 1}/${this.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFunc, retries + 1);
      }
      throw error;
    }
  }

  // Main method to process any message through AI
  async processMessage(data) {
    try {
      if (!this.validateWebhookUrl()) {
        return {
          success: false,
          error: 'Webhook URL not configured'
        };
      }

      // Format the message for your AI Message Processor workflow
      const requestData = {
        body: {
          message: data.message || data.content || '',
          from_name: data.from_name || data.customer || data.name || 'Unknown',
          from_phone: data.from_phone || data.phone || '',
          from_email: data.from_email || data.email || '',
          company_name: data.company_name || ''
        }
      };

      const response = await this.retryRequest(async () => {
        const res = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Source': 'Bright-AI-App'
          },
          body: JSON.stringify(requestData)
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        // Try to parse JSON response, if not return success
        try {
          return await res.json();
        } catch {
          return { success: true };
        }
      });

      return {
        success: true,
        data: response,
        processed: true
      };

    } catch (error) {
      console.error('[N8N processMessage]', error.message, { data });
      return {
        success: false,
        error: error.message,
        retryable: error.message.includes('500') || error.message.includes('502'),
        timestamp: new Date().toISOString()
      };
    }
  }

  // Process a customer's schedule change request
  async processScheduleChange(data) {
    return this.processMessage({
      message: data.message || data.request,
      from_name: data.customer_name,
      from_phone: data.customer_phone,
      from_email: data.customer_email,
      company_name: data.company_name
    });
  }

  // Process a cancellation request
  async processCancellation(data) {
    const message = `Cancel appointment for ${data.date || 'upcoming service'}. Reason: ${data.reason || 'Customer requested'}`;
    
    return this.processMessage({
      message,
      from_name: data.customer_name,
      from_phone: data.customer_phone,
      from_email: data.customer_email
    });
  }

  // Request schedule optimization (triggers AI to optimize)
  async requestScheduleOptimization() {
    return this.processMessage({
      message: "Optimize today's schedule based on current conditions",
      from_name: "System",
      from_email: "system@brightlandscaping.com"
    });
  }

  // Process weather alert
  async processWeatherAlert(weatherData) {
    const message = `Weather alert: ${weatherData.condition}. Wind speed: ${weatherData.windSpeed}mph. Consider rescheduling outdoor work.`;
    
    return this.processMessage({
      message,
      from_name: "Weather System",
      from_email: "weather@system.com"
    });
  }

  // Process any customer SMS/text message
  async processCustomerMessage(message) {
    // Extract intent locally for immediate UI feedback
    const messageText = (message.content || message.message || '').toLowerCase();
    let localIntent = 'unknown';
    
    if (messageText.includes('reschedule') || messageText.includes('change') || messageText.includes('move')) {
      localIntent = 'reschedule';
    } else if (messageText.includes('cancel') || messageText.includes('stop')) {
      localIntent = 'cancel';
    } else if (messageText.includes('yes') || messageText.includes('confirm')) {
      localIntent = 'confirm';
    } else if (messageText.includes('no')) {
      localIntent = 'decline';
    } else if (messageText.includes('when') || messageText.includes('what time')) {
      localIntent = 'inquiry';
    }

    // Send to AI for processing
    const result = await this.processMessage({
      message: message.content || message.message,
      from_phone: message.from_phone || message.phone,
      from_name: message.from_name || message.customer_name,
      from_email: message.from_email
    });

    // Add local intent to result
    if (result.success) {
      result.intent = result.data?.intent || localIntent;
    }

    return result;
  }

  // Handle maintenance reminders
  async triggerMaintenanceReminders(customers) {
    const results = [];
    
    for (const customer of customers) {
      const message = `Reminder: ${customer.service || 'Lawn maintenance'} scheduled for ${customer.nextServiceDate || 'this week'}`;
      
      const result = await this.processMessage({
        message,
        from_name: "Maintenance System",
        from_email: "maintenance@system.com",
        company_name: customer.company || ''
      });
      
      results.push({
        customer: customer.name,
        ...result
      });

      // Small delay between messages to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      processed: results.length,
      results
    };
  }

  // Check if n8n webhook is responding
  async checkHealth() {
    try {
      if (!this.validateWebhookUrl()) {
        return {
          healthy: false,
          message: 'Webhook URL not configured'
        };
      }

      // Send a minimal test message
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            message: "Health check",
            from_name: "System",
            from_email: "health@system.com"
          }
        })
      });

      return {
        healthy: response.ok,
        message: response.ok ? 'N8N webhook is operational' : `N8N returned status ${response.status}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Cannot reach N8N: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Batch process multiple messages
  async batchProcess(messages, batchSize = 10) {
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      for (const message of batch) {
        try {
          const result = await this.processMessage(message);
          
          if (result.success) {
            results.successful.push({ message, result });
          } else {
            results.failed.push({ message, error: result.error });
          }
        } catch (error) {
          results.failed.push({ message, error: error.message });
        }
        
        results.totalProcessed++;
      }
      
      // Delay between batches
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }
}

// Create singleton instance
const n8nAutomation = new N8NAutomation();
export default n8nAutomation;