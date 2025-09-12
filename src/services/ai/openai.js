class OpenAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  async processCustomerMessage(message) {
    if (!this.apiKey) return { action: 'manual_review', reason: 'No API key' };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for a landscaping company. Analyze customer messages and determine:
                1. Intent: schedule_service, reschedule, cancel, quote_request, complaint, or general_inquiry
                2. Urgency: high, medium, low
                3. Suggested action and response
                4. Extract: preferred_date, service_type, and contact_info if mentioned`
            },
            { role: 'user', content: message }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0].message.content);
      
      return {
        intent: analysis.intent,
        urgency: analysis.urgency,
        suggestedAction: analysis.action,
        extractedData: analysis.extracted,
        suggestedResponse: analysis.response
      };
    } catch (error) {
      console.error('OpenAI Error:', error);
      return { action: 'manual_review', error: error.message };
    }
  }

  async optimizeRoute(jobs, startLocation) {
    if (!this.apiKey || jobs.length === 0) return jobs;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a route optimization expert. Given a list of addresses, return them in the most efficient order for visiting, considering distance and traffic patterns.'
            },
            {
              role: 'user',
              content: `Starting location: ${startLocation}\nJobs to visit: ${JSON.stringify(jobs.map(j => ({id: j.id, address: j.address})))}\nReturn a JSON array of job IDs in optimal order.`
            }
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      const optimizedOrder = JSON.parse(data.choices[0].message.content);
      return optimizedOrder;
    } catch (error) {
      console.error('Route optimization error:', error);
      return jobs;
    }
  }

  async generateQuote(serviceDetails) {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a landscaping quote generator. Based on service details, provide a fair price estimate and professional quote description.'
            },
            {
              role: 'user',
              content: `Service: ${serviceDetails.service}\nProperty size: ${serviceDetails.size}\nFrequency: ${serviceDetails.frequency}\nSpecial requirements: ${serviceDetails.requirements}`
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Quote generation error:', error);
      return null;
    }
  }
}

export { OpenAIService };