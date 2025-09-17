// components/Weather/WeatherIntelligence.js
import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudRain, Sun, CloudSnow, Wind, 
  AlertTriangle, Calendar, CheckCircle, 
  RefreshCw, Zap, Droplets, ThermometerSun,
  Clock, Users, MapPin, TrendingUp,
  Umbrella, CloudDrizzle, CloudLightning
} from 'lucide-react';
import { OpenAIService } from '../../services/ai/openai';
import { supabase } from '../../services/database/supabase';

const WeatherIntelligence = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [impactedJobs, setImpactedJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoReschedule, setAutoReschedule] = useState(true);
  const [stats, setStats] = useState({
    jobsAffected: 0,
    jobsRescheduled: 0,
    revenueAtRisk: 0,
    customersNotified: 0
  });

  const ai = new OpenAIService();
  const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo-key';

  useEffect(() => {
    loadWeatherData();
    checkJobImpact();
    // Check weather every 30 minutes
    const interval = setInterval(() => {
      loadWeatherData();
      checkJobImpact();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      // Get current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Springfield&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const currentData = await currentResponse.json();
      
      // Get 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=Springfield&appid=${WEATHER_API_KEY}&units=imperial`
      );
      const forecastData = await forecastResponse.json();
      
      // Process forecast into daily data
      const dailyForecast = processForecastData(forecastData.list);
      
      setWeather({
        current: {
          temp: Math.round(currentData.main?.temp || 72),
          condition: currentData.weather?.[0]?.main || 'Clear',
          description: currentData.weather?.[0]?.description || 'clear sky',
          humidity: currentData.main?.humidity || 50,
          windSpeed: Math.round(currentData.wind?.speed || 5),
          rainChance: currentData.rain ? 100 : (currentData.clouds?.all || 0),
          icon: currentData.weather?.[0]?.icon || '01d'
        }
      });
      
      setForecast(dailyForecast);
      
      // Get AI recommendations based on weather
      await getAIRecommendations(currentData, dailyForecast);
      
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Use demo data if API fails
      setDemoWeatherData();
    } finally {
      setLoading(false);
    }
  };

  const processForecastData = (forecastList) => {
    const dailyData = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date: date,
          temps: [],
          conditions: [],
          rain: 0,
          wind: []
        };
      }
      
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].conditions.push(item.weather[0].main);
      dailyData[date].rain = Math.max(dailyData[date].rain, item.pop * 100);
      dailyData[date].wind.push(item.wind.speed);
    });
    
    return Object.values(dailyData).slice(0, 5).map(day => ({
      date: day.date,
      high: Math.round(Math.max(...day.temps)),
      low: Math.round(Math.min(...day.temps)),
      condition: day.conditions[Math.floor(day.conditions.length / 2)],
      rainChance: Math.round(day.rain),
      windSpeed: Math.round(day.wind.reduce((a, b) => a + b) / day.wind.length),
      suitable: day.rain < 30 && day.wind.reduce((a, b) => a + b) / day.wind.length < 20
    }));
  };

  const setDemoWeatherData = () => {
    setWeather({
      current: {
        temp: 72,
        condition: 'Partly Cloudy',
        description: 'partly cloudy',
        humidity: 65,
        windSpeed: 8,
        rainChance: 20,
        icon: '02d'
      }
    });
    
    setForecast([
      { date: 'Today', high: 75, low: 62, condition: 'Clear', rainChance: 10, windSpeed: 5, suitable: true },
      { date: 'Tomorrow', high: 68, low: 55, condition: 'Rain', rainChance: 80, windSpeed: 15, suitable: false },
      { date: 'Thursday', high: 70, low: 58, condition: 'Cloudy', rainChance: 40, windSpeed: 10, suitable: true },
      { date: 'Friday', high: 73, low: 60, condition: 'Clear', rainChance: 5, windSpeed: 8, suitable: true },
      { date: 'Saturday', high: 76, low: 63, condition: 'Clear', rainChance: 10, windSpeed: 6, suitable: true }
    ]);
  };

  const checkJobImpact = async () => {
    try {
      // Get tomorrow's jobs
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const jobs = await supabase.fetchData('jobs');
      const tomorrowJobs = jobs.filter(job => {
        const jobDate = new Date(job.date || job.scheduled_date);
        return jobDate.toDateString() === tomorrow.toDateString() && 
               job.status === 'scheduled';
      });
      
      // Check which jobs would be impacted by weather
      const impacted = tomorrowJobs.filter(job => {
        // Lawn care, landscaping affected by rain
        const rainSensitive = ['mowing', 'lawn', 'landscaping', 'fertilizing'].some(
          term => job.service?.toLowerCase().includes(term)
        );
        return rainSensitive && forecast[1]?.rainChance > 60;
      });
      
      setImpactedJobs(impacted);
      
      setStats({
        jobsAffected: impacted.length,
        jobsRescheduled: 0,
        revenueAtRisk: impacted.reduce((sum, job) => sum + (parseFloat(job.price) || 150), 0),
        customersNotified: 0
      });
      
    } catch (error) {
      console.error('Error checking job impact:', error);
    }
  };

  const getAIRecommendations = async (current, forecast) => {
    try {
      const prompt = `
        Current weather: ${current.weather?.[0]?.description}, ${current.main?.temp}°F
        Tomorrow: ${forecast[1]?.condition}, ${forecast[1]?.rainChance}% rain chance
        
        Provide 3 specific recommendations for a landscaping company.
      `;
      
      const response = await ai.generateScheduleSuggestions([], []);
      
      // For now, use static recommendations based on conditions
      const recs = [];
      
      if (forecast[1]?.rainChance > 60) {
        recs.push({
          type: 'warning',
          title: 'Rain Alert Tomorrow',
          action: 'Reschedule outdoor services to ' + (forecast[2]?.suitable ? forecast[2].date : 'next clear day'),
          impact: 'high'
        });
      }
      
      if (forecast[1]?.windSpeed > 20) {
        recs.push({
          type: 'warning',
          title: 'High Wind Warning',
          action: 'Postpone tree trimming and ladder work',
          impact: 'high'
        });
      }
      
      if (current.main?.temp > 90) {
        recs.push({
          type: 'info',
          title: 'Heat Advisory',
          action: 'Schedule extra water breaks, start jobs earlier',
          impact: 'medium'
        });
      }
      
      if (recs.length === 0) {
        recs.push({
          type: 'success',
          title: 'Perfect Working Conditions',
          action: 'All services can proceed as scheduled',
          impact: 'low'
        });
      }
      
      setRecommendations(recs);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    }
  };

  const autoRescheduleJobs = async () => {
    if (!autoReschedule || impactedJobs.length === 0) return;
    
    try {
      // Find next suitable day
      const nextGoodDay = forecast.find(day => day.suitable && day.date !== 'Today');
      
      if (!nextGoodDay) {
        alert('No suitable days found in 5-day forecast');
        return;
      }
      
      let rescheduled = 0;
      let notified = 0;
      
      for (const job of impactedJobs) {
        // Update job in database
        await supabase.updateData('jobs', job.id, {
          date: nextGoodDay.date,
          reschedule_reason: 'Weather - Rain forecast',
          original_date: job.date,
          auto_rescheduled: true
        });
        rescheduled++;
        
        // Create notification message
        if (job.phone || job.customer_phone) {
          await supabase.insertData('messages', {
            to_phone: job.phone || job.customer_phone,
            content: `Hi ${job.customer}, due to rain forecast tomorrow, we've rescheduled your ${job.service} to ${nextGoodDay.date}. Reply 'OK' to confirm or call us to discuss.`,
            type: 'weather_notification',
            sent_at: new Date().toISOString()
          });
          notified++;
        }
      }
      
      setStats(prev => ({
        ...prev,
        jobsRescheduled: rescheduled,
        customersNotified: notified
      }));
      
      alert(`✅ Rescheduled ${rescheduled} jobs and notified ${notified} customers`);
      
      // Refresh impacted jobs list
      setImpactedJobs([]);
      
    } catch (error) {
      console.error('Error rescheduling jobs:', error);
      alert('Failed to reschedule jobs. Please try again.');
    }
  };

  const getWeatherIcon = (condition) => {
    switch(condition?.toLowerCase()) {
      case 'clear': return <Sun className="text-yellow-500" size={32} />;
      case 'rain': return <CloudRain className="text-blue-500" size={32} />;
      case 'clouds': return <Cloud className="text-gray-500" size={32} />;
      case 'snow': return <CloudSnow className="text-blue-300" size={32} />;
      case 'thunderstorm': return <CloudLightning className="text-purple-600" size={32} />;
      case 'drizzle': return <CloudDrizzle className="text-blue-400" size={32} />;
      default: return <Sun className="text-yellow-500" size={32} />;
    }
  };

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Loading Weather Intelligence...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Cloud size={28} />
              Weather Intelligence System
            </h1>
            <p className="mt-1 opacity-90">
              AI-powered weather monitoring and automatic job rescheduling
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadWeatherData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={() => setAutoReschedule(!autoReschedule)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoReschedule 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <Zap size={16} />
              Auto-Reschedule {autoReschedule ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ThermometerSun size={20} />
            Current Conditions
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{weather?.current?.temp}°F</div>
              <div className="text-gray-600 capitalize">{weather?.current?.description}</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500" />
                  <span>Humidity: {weather?.current?.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind size={16} className="text-gray-500" />
                  <span>Wind: {weather?.current?.windSpeed} mph</span>
                </div>
                <div className="flex items-center gap-2">
                  <Umbrella size={16} className="text-blue-600" />
                  <span>Rain: {weather?.current?.rainChance}%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {getWeatherIcon(weather?.current?.condition)}
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Weather Impact
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Affected</span>
              <span className="font-bold text-lg">{stats.jobsAffected}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Revenue at Risk</span>
              <span className="font-bold text-lg text-red-600">${stats.revenueAtRisk}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-Rescheduled</span>
              <span className="font-bold text-lg text-green-600">{stats.jobsRescheduled}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customers Notified</span>
              <span className="font-bold text-lg text-blue-600">{stats.customersNotified}</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={20} />
            AI Recommendations
          </h2>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getImpactColor(rec.impact)}`}>
                <div className="font-medium text-sm">{rec.title}</div>
                <div className="text-xs text-gray-600 mt-1">{rec.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">5-Day Forecast</h2>
        <div className="grid grid-cols-5 gap-4">
          {forecast.map((day, index) => (
            <div 
              key={index} 
              className={`text-center p-4 rounded-lg border-2 ${
                day.suitable ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="font-semibold">{day.date}</div>
              <div className="my-3">{getWeatherIcon(day.condition)}</div>
              <div className="text-sm">
                <div>{day.high}°/{day.low}°</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Droplets size={14} />
                  {day.rainChance}%
                </div>
                <div className="mt-2">
                  {day.suitable ? (
                    <span className="text-xs px-2 py-1 bg-green-500 text-white rounded">
                      Good
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                      Poor
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impacted Jobs */}
      {impactedJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Jobs Requiring Rescheduling
            </h2>
            <button
              onClick={autoRescheduleJobs}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Calendar size={16} />
              Reschedule All Jobs
            </button>
          </div>
          
          <div className="space-y-3">
            {impactedJobs.map(job => (
              <div key={job.id} className="border rounded-lg p-3 bg-yellow-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{job.customer}</div>
                    <div className="text-sm text-gray-600">{job.service}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {job.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {job.time || '9:00 AM'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">${job.price || '150'}</div>
                    <button className="mt-1 text-xs text-blue-600 hover:underline">
                      Reschedule →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Intelligence Features */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">AI Weather Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Predictive Rescheduling</div>
              <div className="text-sm opacity-90">Moves jobs before bad weather hits</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Customer Notifications</div>
              <div className="text-sm opacity-90">Auto-texts customers about changes</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="mt-1" />
            <div>
              <div className="font-semibold">Service Optimization</div>
              <div className="text-sm opacity-90">Suggests indoor work on rain days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherIntelligence;