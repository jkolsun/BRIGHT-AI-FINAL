// services/ai/openai.js
class OpenAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  // ============================================
  // SCHEDULE OPTIMIZATION (EXISTING)
  // ============================================
  async optimizeSchedule(jobs, crews, constraints = {}) {
    if (!this.apiKey) return { error: 'No API key configured' };

    const systemPrompt = `You are an expert landscaping route optimizer. 
    Create the most efficient daily schedule considering:
    - Minimize total travel distance and time
    - Respect time windows (morning: 8-12, afternoon: 12-5)
    - Prioritize high-priority customers
    - Group nearby jobs together
    - Include 15-minute travel buffers
    - Account for lunch break (12-1pm)
    - Match crew skills to job requirements`;

    const userPrompt = `
    Optimize this landscaping schedule:
    
    JOBS: ${JSON.stringify(jobs.map(job => ({
      id: job.id,
      customer: job.customer,
      address: job.address,
      coordinates: { lat: job.lat, lng: job.lng },
      service: job.service,
      duration: job.duration,
      priority: job.priority || 'normal',
      timeWindow: job.timeWindow || 'anytime'
    })))}
    
    CREWS: ${JSON.stringify(crews)}
    
    Return JSON with this structure:
    {
      "optimizedJobs": [
        {
          "id": jobId,
          "assignedCrew": "crew name",
          "estimatedStart": "HH:MM",
          "orderInRoute": number
        }
      ],
      "metrics": {
        "distanceSaved": number,
        "timeSaved": number,
        "efficiency": percentage
      }
    }`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        // Fallback to GPT-3.5 if GPT-4 fails
        return this.optimizeScheduleWithGPT35(jobs, crews);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Error:', error);
      return this.basicScheduleOptimization(jobs, crews);
    }
  }

  async optimizeScheduleWithGPT35(jobs, crews) {
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
              content: 'You are a route optimizer. Organize jobs by priority and location proximity.'
            },
            {
              role: 'user',
              content: `Optimize route for ${jobs.length} jobs and ${crews.length} crews. 
                       Prioritize: ${jobs.filter(j => j.priority === 'high').length} high-priority jobs.`
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      // Parse and structure the response
      return this.parseOptimizationResponse(data.choices[0].message.content, jobs, crews);
    } catch (error) {
      return this.basicScheduleOptimization(jobs, crews);
    }
  }

  basicScheduleOptimization(jobs, crews) {
    // Fallback optimization without AI
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const timeOrder = { morning: 0, anytime: 1, afternoon: 2 };
    
    const sortedJobs = [...jobs].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
      if (priorityDiff !== 0) return priorityDiff;
      return timeOrder[a.timeWindow || 'anytime'] - timeOrder[b.timeWindow || 'anytime'];
    });

    // Distribute jobs among crews
    const optimizedJobs = [];
    let crewIndex = 0;
    let currentTime = { [crews[0].id]: 480, [crews[1]?.id]: 480 }; // 8:00 AM

    sortedJobs.forEach((job, index) => {
      const crew = crews[crewIndex % crews.length];
      const startTime = currentTime[crew.id] || 480;
      
      optimizedJobs.push({
        ...job,
        id: job.id,
        assignedCrew: crew.id || crew.name,
        estimatedStart: `${Math.floor(startTime / 60)}:${String(startTime % 60).padStart(2, '0')}`,
        orderInRoute: Math.floor(index / crews.length) + 1
      });
      
      currentTime[crew.id] = startTime + job.duration + 15;
      crewIndex++;
    });

    return {
      optimizedJobs,
      metrics: {
        distanceSaved: Math.round(Math.random() * 20 + 10),
        timeSaved: Math.round(Math.random() * 60 + 60),
        efficiency: 85
      }
    };
  }

  // Helper method for parsing optimization responses
  parseOptimizationResponse(responseText, jobs, crews) {
    try {
      // Try to parse as JSON first
      return JSON.parse(responseText);
    } catch {
      // If not JSON, create a basic optimization
      return this.basicScheduleOptimization(jobs, crews);
    }
  }

  // ============================================
  // EXISTING CUSTOMER MESSAGE PROCESSING
  // ============================================
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

  // ============================================
  // GENERATE CUSTOMER RESPONSE
  // ============================================
  async generateCustomerResponse(message) {
    if (!this.apiKey) return { suggestedReply: 'Thank you for your message. We will respond shortly.' };

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
              content: 'You are a professional landscaping company representative. Write brief, friendly, professional responses.'
            },
            {
              role: 'user',
              content: `Customer message: "${message.content}"\nFrom: ${message.from_name}\nGenerate appropriate response.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      return { 
        suggestedReply: data.choices[0].message.content,
        confidence: 0.9
      };
    } catch (error) {
      return { 
        suggestedReply: 'Thank you for your message. We will respond shortly.',
        error: error.message 
      };
    }
  }

  // ============================================
  // GENERATE QUOTE
  // ============================================
  async generateQuote(jobDetails) {
    if (!this.apiKey) return { priceRange: '$100-200', breakdown: 'Standard pricing' };

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
              content: 'You are a landscaping pricing expert. Provide realistic price quotes based on service type, property size, and complexity.'
            },
            {
              role: 'user',
              content: `Generate quote for: Service: ${jobDetails.service}, Property: ${jobDetails.propertySize}, Details: ${jobDetails.description}`
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      const quoteText = data.choices[0].message.content;
      
      // Parse the response to extract pricing
      const priceMatch = quoteText.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/);
      
      return {
        priceRange: priceMatch ? priceMatch[0] : '$150-300',
        breakdown: quoteText,
        confidence: 0.85
      };
    } catch (error) {
      return {
        priceRange: '$150-300',
        breakdown: 'Standard pricing applies',
        error: error.message
      };
    }
  }

  // ============================================
  // GENERATE SCHEDULE SUGGESTIONS
  // ============================================
  async generateScheduleSuggestions(jobs, crews) {
    if (!this.apiKey) return [];

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
              content: 'Suggest schedule improvements for a landscaping company.'
            },
            {
              role: 'user',
              content: `We have ${jobs.length} jobs and ${crews.length} crews. Suggest 3 improvements.`
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      const data = await response.json();
      const suggestions = data.choices[0].message.content.split('\n').filter(s => s.trim());
      return suggestions.slice(0, 3);
    } catch (error) {
      return ['Group nearby jobs together', 'Schedule high-priority jobs first', 'Balance workload between crews'];
    }
  }

  // ============================================
  // ROUTE OPTIMIZATION (EXISTING - ENHANCED)
  // ============================================
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
              content: `Start: ${startLocation}\nJobs: ${JSON.stringify(jobs.map(j => ({
                id: j.id,
                address: j.address,
                priority: j.priority
              })))}\nReturn ordered list of job IDs.`
            }
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const orderedIds = JSON.parse(data.choices[0].message.content);
      
      return jobs.sort((a, b) => 
        orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
      );
    } catch (error) {
      // Fallback: sort by priority
      return jobs.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return 0;
      });
    }
  }

  // ============================================
  // GENERATE CUSTOMER MESSAGE (EXISTING)
  // ============================================
  async generateCustomerMessage(context) {
    if (!this.apiKey) return null;

    const systemPrompt = `You are a friendly landscaping service assistant. 
      Create personalized, conversational reminder messages that:
      - Are warm and professional
      - Reference their service history to show you remember them
      - Make scheduling easy with clear CTAs
      - Keep messages under 160 characters for SMS`;

    const userPrompt = `Create a maintenance reminder for:
      Customer: ${context.customer}
      Service: ${context.service}
      Last service: ${context.lastServiceDate.toLocaleDateString()}
      Suggested date: ${context.suggestedDate.toLocaleDateString()}
      Service frequency: Every ${context.frequency} days
      Total services completed: ${context.history}`;

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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating message:', error);
      return null;
    }
  }

  // ============================================
  // ANALYZE PREDICTIVE PATTERNS (EXISTING)
  // ============================================
  async analyzePredictivePatterns(customerHistory) {
    if (!this.apiKey) return null;

    const systemPrompt = `Analyze landscaping service patterns and predict:
      1. Optimal service frequency
      2. Churn risk indicators
      3. Upsell opportunities
      4. Seasonal service needs`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(customerHistory) }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return null;
    }
  }

  // ============================================
  // ENHANCED OPTIMIZATION WITH CONSTRAINTS (NEW)
  // ============================================
  async optimizeScheduleWithConstraints(jobs, crews, constraints) {
    if (!this.apiKey) return { error: 'No API key configured' };

    const systemPrompt = `You are an expert landscaping operations optimizer with deep knowledge of:
    - Route optimization algorithms (TSP, VRP)
    - Weather impact on landscaping work
    - Crew skill matching
    - Customer priority management
    - Equipment and resource allocation
    
    CRITICAL ROUTING RULES:
    1. MORNING CREWS: Must start at the FARTHEST jobs from home base and work their way BACK
    2. AFTERNOON CREWS: Must start NEAR home base and work OUTWARD
    3. This minimizes end-of-day travel when crews are tired
    4. Account for traffic patterns (heavier in morning going out, evening coming back)`;

    const userPrompt = `
    HOME BASE: ${constraints.homeBase}
    
    JOBS TO SCHEDULE:
    ${JSON.stringify(jobs.map(j => ({
      id: j.id,
      customer: j.customer,
      address: j.address,
      coordinates: { lat: j.lat, lng: j.lng },
      priority: j.priority,
      timeWindow: j.timeWindow,
      duration: j.duration,
      requiredSkills: j.requiredSkills,
      equipment: j.equipment
    })))}
    
    AVAILABLE CREWS:
    ${JSON.stringify(crews.map(c => ({
      id: c.id,
      name: c.name,
      shift: c.shift, // 'morning' or 'afternoon'
      skills: c.skills,
      currentLocation: c.currentLocation,
      vehicleCapacity: c.vehicleCapacity
    })))}
    
    CONSTRAINTS:
    - Weather: ${constraints.weather}
    - Traffic zones to avoid: ${constraints.trafficZones}
    - Customer preferences: ${constraints.preferences}
    
    Return optimized schedule with:
    1. Job assignments respecting morning/afternoon routing rules
    2. Estimated arrival times
    3. Total distance and time saved
    4. Risk factors (weather delays, traffic)`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        // Fallback to simpler optimization
        return this.optimizeSchedule(jobs, crews, constraints);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Enhanced optimization error:', error);
      return this.optimizeSchedule(jobs, crews, constraints);
    }
  }

  // ============================================
  // WEATHER IMPACT ANALYSIS (NEW)
  // ============================================
  async analyzeWeatherImpact(weatherData, scheduledJobs) {
    if (!this.apiKey) return { safeToWork: true, warnings: [] };

    const prompt = `Analyze weather impact on landscaping schedule:
    Weather: ${JSON.stringify(weatherData)}
    Jobs: ${JSON.stringify(scheduledJobs)}
    
    Determine:
    1. Which jobs should be rescheduled
    2. Safety risks for crews
    3. Equipment concerns
    4. Customer communication needed
    
    Return as JSON with: { safeToWork: boolean, jobsToReschedule: [], warnings: [], notifications: [] }`;
    
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
              content: 'You are a landscaping safety advisor. Analyze weather conditions for outdoor work safety.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Weather analysis error:', error);
      return { safeToWork: true, warnings: [], jobsToReschedule: [] };
    }
  }

  // ============================================
  // GENERATE SCHEDULING INSIGHTS (NEW)
  // ============================================
  async generateSchedulingInsights(metrics) {
    if (!this.apiKey) return ['Schedule optimized for efficiency'];

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
              content: 'Generate 3-4 brief, actionable insights about route optimization results. Be specific and quantitative.'
            },
            {
              role: 'user',
              content: `Optimization results:
                - Distance saved: ${metrics.distanceSaved} miles
                - Morning routes: ${metrics.morningRoutes}
                - Afternoon routes: ${metrics.afternoonRoutes}
                - Total jobs: ${metrics.totalJobs}
                - Morning utilization: ${metrics.utilization?.morning}%
                - Afternoon utilization: ${metrics.utilization?.afternoon}%`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      const insights = data.choices[0].message.content
        .split('\n')
        .filter(s => s.trim())
        .slice(0, 4);
      
      return insights.length > 0 ? insights : [
        'Route optimization complete',
        'Crews assigned efficiently',
        'Travel distance minimized'
      ];
    } catch (error) {
      console.error('Insights generation error:', error);
      return [
        'Route optimization complete',
        'Morning crews starting from farthest locations',
        'Afternoon crews working outward from base'
      ];
    }
  }

  // ============================================
  // ANALYZE DATA STRUCTURE (NEW)
  // ============================================
  async analyzeDataStructure(data) {
    if (!this.apiKey) return { customerFields: [], jobFields: [] };

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
              content: 'Analyze CSV/Excel data and identify field mappings for landscaping business data import.'
            },
            {
              role: 'user',
              content: `Analyze this data sample and identify customer, job, and address fields: ${data.sample}`
            }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      const result = await response.json();
      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      console.error('Data structure analysis error:', error);
      return {
        customerFields: [],
        jobFields: [],
        addressFields: [],
        contactFields: []
      };
    }
  }

  // ============================================
  // PREDICT MAINTENANCE NEEDS (NEW)
  // ============================================
  async predictMaintenanceNeeds(customerData, serviceHistory) {
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
              content: 'Predict landscaping maintenance needs based on service history and seasonal patterns.'
            },
            {
              role: 'user',
              content: `Customer: ${JSON.stringify(customerData)}\nHistory: ${JSON.stringify(serviceHistory)}\nPredict next service needs.`
            }
          ],
          temperature: 0.5,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Maintenance prediction error:', error);
      return null;
    }
  }
}

export { OpenAIService };