// services/automation/n8n.js
export class N8NAutomation {
  constructor() {
    this.webhookBase = process.env.REACT_APP_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook';
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.errorLog = [];
  }

  validateWebhookUrl() {
    if (this.webhookBase.includes('your-n8n-instance.com')) {
      console.error('N8N webhook URL not configured. Please update REACT_APP_N8N_WEBHOOK_URL in .env');
      return false;
    }
    return true;
  }

  validateMaintenanceData(data) {
    const errors = [];
    
    if (!data) {
      errors.push('No data provided');
      return { valid: false, errors };
    }

    if (!data.customers || !Array.isArray(data.customers)) {
      errors.push('Customers must be an array');
    } else if (data.customers.length === 0) {
      errors.push('No customers to process');
    } else {
      data.customers.forEach((customer, index) => {
        if (!customer.phone && !customer.email) {
          errors.push(`Customer ${index + 1}: Missing contact information (phone or email)`);
        }
        if (!customer.name && !customer.customer) {
          errors.push(`Customer ${index + 1}: Missing customer name`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateMessageData(message) {
    const errors = [];

    if (!message) {
      errors.push('No message data provided');
      return { valid: false, errors };
    }

    if (!message.content && !message.message) {
      errors.push('Message content is required');
    }

    if (!message.from_phone && !message.phone && !message.from) {
      errors.push('Sender phone number is required');
    }

    const phone = message.from_phone || message.phone || message.from;
    if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

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

  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorBody = await response.json();
        errorMessage += ` - ${errorBody.message || JSON.stringify(errorBody)}`;
      } catch (e) {
        try {
          const textBody = await response.text();
          if (textBody) errorMessage += ` - ${textBody}`;
        } catch (e2) {
          console.log('Could not read response body');
        }
      }

      switch (response.status) {
        case 400:
          throw new Error(`Bad Request: ${errorMessage}`);
        case 401:
          throw new Error('Unauthorized: Check your N8N webhook authentication');
        case 403:
          throw new Error('Forbidden: N8N webhook access denied');
        case 404:
          throw new Error('N8N webhook not found. Is the workflow active?');
        case 429:
          throw new Error('Rate limited: Too many requests to N8N');
        case 500:
        case 502:
        case 503:
          throw new Error(`N8N server error: ${errorMessage}`);
        default:
          throw new Error(errorMessage);
      }
    }

    try {
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: true, message: 'Request processed' };
    }
  }

  logError(method, error, data) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      method,
      error: error.message,
      data: JSON.stringify(data).substring(0, 500)
    };
    
    this.errorLog.push(errorEntry);
    
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }

    console.error(`[N8N ${method}]`, error.message, { data });
    
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorEntry
      });
    }
  }

  getRecentErrors() {
    return this.errorLog;
  }

  async triggerMaintenanceWorkflow(data) {
    try {
      if (!this.validateWebhookUrl()) {
        return {
          success: false,
          error: 'Webhook URL not configured'
        };
      }

      const validation = this.validateMaintenanceData(data);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Invalid data provided'
        };
      }

      const requestData = {
        trigger: 'predictive_maintenance',
        customers: data.customers.map(customer => ({
          name: customer.name || customer.customer || 'Unknown',
          phone: customer.phone || customer.customer_phone || '',
          email: customer.email || '',
          address: customer.address || '',
          service: customer.service || customer.type || 'Lawn Maintenance',
          nextServiceDate: customer.nextServiceDate || customer.date || ''
        })),
        timestamp: new Date().toISOString(),
        source: 'predictive_maintenance_ai'
      };

      const response = await this.retryRequest(async () => {
        const res = await fetch(`${this.webhookBase}/maintenance-reminder`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Source': 'Bright-AI-App'
          },
          body: JSON.stringify(requestData)
        });
        return this.handleResponse(res);
      });

      return {
        success: true,
        data: response,
        customersProcessed: requestData.customers.length
      };

    } catch (error) {
      this.logError('triggerMaintenanceWorkflow', error, data);
      
      return {
        success: false,
        error: error.message,
        retryable: !error.message.includes('Bad Request') && !error.message.includes('Unauthorized'),
        timestamp: new Date().toISOString()
      };
    }
  }

  async processCustomerResponse(message) {
    try {
      if (!this.validateWebhookUrl()) {
        return {
          success: false,
          error: 'Webhook URL not configured'
        };
      }

      const validation = this.validateMessageData(message);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          message: 'Invalid message data'
        };
      }

      const requestData = {
        message: message.content || message.message || '',
        from: message.from_phone || message.phone || message.from || '',
        customer: message.customer || message.from_name || '',
        timestamp: message.created_at || new Date().toISOString(),
        source: 'customer_sms_response'
      };

      const messageText = requestData.message.toLowerCase();
      let localIntent = 'unknown';
      
      if (messageText.includes('yes') || messageText.includes('confirm')) {
        localIntent = 'confirm';
      } else if (messageText.includes('no') || messageText.includes('cancel')) {
        localIntent = 'cancel';
      } else if (messageText.includes('change') || messageText.includes('reschedule')) {
        localIntent = 'reschedule';
      }

      requestData.suggestedIntent = localIntent;

      const response = await this.retryRequest(async () => {
        const res = await fetch(`${this.webhookBase}/customer-response`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Source': 'Bright-AI-App'
          },
          body: JSON.stringify(requestData)
        });
        return this.handleResponse(res);
      });

      if (!response.intent && localIntent !== 'unknown') {
        response.intent = localIntent;
      }

      return {
        success: true,
        data: response,
        intent: response.intent || localIntent,
        processed: true
      };

    } catch (error) {
      this.logError('processCustomerResponse', error, message);
      
      if (error.message.includes('server error') || error.message.includes('not found')) {
        console.log('N8N unavailable, processing locally');
        
        const messageText = (message.content || '').toLowerCase();
        let fallbackIntent = 'unknown';
        
        if (messageText.includes('yes')) fallbackIntent = 'confirm';
        else if (messageText.includes('no')) fallbackIntent = 'cancel';
        else if (messageText.includes('change')) fallbackIntent = 'reschedule';
        
        return {
          success: false,
          error: error.message,
          fallbackProcessing: true,
          intent: fallbackIntent,
          message: 'Processed locally due to N8N unavailability'
        };
      }
      
      return {
        success: false,
        error: error.message,
        retryable: !error.message.includes('Bad Request'),
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkHealth() {
    try {
      if (!this.validateWebhookUrl()) {
        return {
          healthy: false,
          message: 'Webhook URL not configured'
        };
      }

      const response = await fetch(`${this.webhookBase}/health`, {
        method: 'GET',
        headers: { 'X-Source': 'Bright-AI-App' }
      });

      if (response.ok) {
        return {
          healthy: true,
          message: 'N8N webhook is operational',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          healthy: false,
          message: `N8N webhook returned status ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Cannot reach N8N: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async batchProcessMaintenance(customers, batchSize = 10) {
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      
      try {
        const result = await this.triggerMaintenanceWorkflow({ customers: batch });
        
        if (result.success) {
          results.successful.push(...batch);
        } else {
          results.failed.push({
            batch,
            error: result.error
          });
        }
      } catch (error) {
        results.failed.push({
          batch,
          error: error.message
        });
      }
      
      results.totalProcessed += batch.length;
      
      if (i + batchSize < customers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }
}

const n8nAutomation = new N8NAutomation();
export default n8nAutomation;