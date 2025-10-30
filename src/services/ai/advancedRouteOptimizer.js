// services/ai/advancedRouteOptimizer.js
/**
 * Advanced Route Optimizer for Landscaping Crews
 * 
 * This optimizer implements intelligent routing where:
 * - Morning crews start at the FARTHEST jobs from home base and work their way back
 * - Afternoon crews start NEAR home base and work outward
 * - This minimizes end-of-day travel when crews are tired and reduces overtime
 */

import { supabase } from '../database/supabase';

class AdvancedRouteOptimizer {
  constructor() {
    // Default home base - pulls from environment variables or uses defaults
    this.homeBase = {
      lat: parseFloat(process.env.REACT_APP_HOME_BASE_LAT || 40.1023),
      lng: parseFloat(process.env.REACT_APP_HOME_BASE_LNG || -75.2743),
      address: process.env.REACT_APP_HOME_BASE_ADDRESS || 'Company Headquarters'
    };
    
    // Configuration
    this.config = {
      morningStart: 8 * 60, // 8:00 AM in minutes
      afternoonStart: 13 * 60, // 1:00 PM in minutes
      averageSpeed: 25, // mph in suburban/urban areas
      bufferTime: 15, // minutes between jobs
      maxDailyHours: 8
    };
  }

  /**
   * Main optimization function
   * @param {Array} jobs - Array of job objects with location data
   * @param {Array} crews - Array of crew objects with shift preferences
   * @param {Date} date - Date to optimize for
   * @returns {Object} Optimized schedule with metrics
   */
  async optimizeCrewRoutes(jobs, crews, date) {
    console.log(`🚀 Starting route optimization for ${jobs.length} jobs and ${crews.length} crews`);
    
    try {
      // Separate crews by shift
      const morningCrews = [];
      const afternoonCrews = [];
      
      crews.forEach((crew, index) => {
        if (crew.shift === 'morning' || (!crew.shift && index < crews.length / 2)) {
          morningCrews.push(crew);
        } else {
          afternoonCrews.push(crew);
        }
      });
      
      // If no crews have shifts assigned, split them evenly
      if (morningCrews.length === 0 && afternoonCrews.length === 0) {
        const midPoint = Math.ceil(crews.length / 2);
        morningCrews.push(...crews.slice(0, midPoint));
        afternoonCrews.push(...crews.slice(midPoint));
      }
      
      // Separate jobs by time window
      const { morningJobs, afternoonJobs, flexibleJobs } = this.categorizeJobsByTime(jobs);
      
      // Calculate distances from home base for all jobs
      const jobsWithDistance = jobs.map(job => ({
        ...job,
        distanceFromBase: this.calculateDistance(
          this.homeBase.lat,
          this.homeBase.lng,
          job.lat || job.latitude || 0,
          job.lng || job.longitude || 0
        )
      }));
      
      // Optimize morning routes (far to near)
      const morningRoutes = this.optimizeMorningRoutes(
        [...morningJobs, ...flexibleJobs.slice(0, Math.floor(flexibleJobs.length / 2))],
        morningCrews,
        jobsWithDistance
      );
      
      // Optimize afternoon routes (near to far)
      const afternoonRoutes = this.optimizeAfternoonRoutes(
        [...afternoonJobs, ...flexibleJobs.slice(Math.floor(flexibleJobs.length / 2))],
        afternoonCrews,
        jobsWithDistance
      );
      
      // Calculate optimization metrics
      const metrics = this.calculateOptimizationMetrics(
        morningRoutes,
        afternoonRoutes,
        jobs
      );
      
      return {
        success: true,
        morning: morningRoutes,
        afternoon: afternoonRoutes,
        metrics,
        unassignedJobs: this.findUnassignedJobs(jobs, morningRoutes, afternoonRoutes),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Route optimization failed:', error);
      return {
        success: false,
        error: error.message,
        morning: [],
        afternoon: [],
        metrics: {}
      };
    }
  }

  /**
   * Optimize morning routes - start far, work back to base
   */
  optimizeMorningRoutes(jobs, crews, jobsWithDistance) {
    console.log(`☀️ Optimizing morning routes for ${jobs.length} jobs and ${crews.length} crews`);
    
    if (crews.length === 0 || jobs.length === 0) {
      return [];
    }
    
    const routes = [];
    
    // Sort jobs by distance from base (farthest first)
    const sortedJobs = jobs
      .map(job => {
        const jobWithDist = jobsWithDistance.find(j => j.id === job.id);
        return {
          ...job,
          distanceFromBase: jobWithDist ? jobWithDist.distanceFromBase : 0
        };
      })
      .sort((a, b) => b.distanceFromBase - a.distanceFromBase);
    
    // Distribute jobs among morning crews
    for (let crewIndex = 0; crewIndex < crews.length; crewIndex++) {
      const crew = crews[crewIndex];
      const crewJobs = [];
      let currentTime = this.config.morningStart;
      let currentLocation = null;
      let totalDistance = 0;
      let routeOrder = 1;
      
      // Assign jobs to this crew using round-robin from sorted list
      for (let i = crewIndex; i < sortedJobs.length; i += crews.length) {
        const job = sortedJobs[i];
        
        // Calculate travel time
        const travelTime = currentLocation 
          ? this.calculateTravelTime(currentLocation, job)
          : 20; // 20 minutes from base to first job
        
        const jobEndTime = currentTime + travelTime + (job.duration || 60);
        
        // Check if job fits in work day
        if (jobEndTime - this.config.morningStart > 4 * 60) { // 4 hour morning shift
          continue; // Skip this job for this crew
        }
        
        const travelDistance = currentLocation 
          ? this.calculateDistance(currentLocation.lat, currentLocation.lng, job.lat || job.latitude, job.lng || job.longitude)
          : job.distanceFromBase;
        
        crewJobs.push({
          ...job,
          assignedCrew: crew.id || crew.name,
          crewName: crew.name,
          orderInRoute: routeOrder++,
          estimatedArrival: this.minutesToTime(currentTime + travelTime),
          estimatedDeparture: this.minutesToTime(jobEndTime),
          travelTime: Math.round(travelTime),
          travelDistance: travelDistance.toFixed(1)
        });
        
        totalDistance += travelDistance;
        currentTime = jobEndTime + this.config.bufferTime;
        currentLocation = { lat: job.lat || job.latitude, lng: job.lng || job.longitude };
      }
      
      // Calculate return to base
      if (crewJobs.length > 0 && currentLocation) {
        const returnDistance = this.calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          this.homeBase.lat,
          this.homeBase.lng
        );
        totalDistance += returnDistance;
      }
      
      routes.push({
        crew: crew.name,
        crewId: crew.id,
        shift: 'morning',
        jobs: crewJobs,
        totalJobs: crewJobs.length,
        totalDistance: totalDistance.toFixed(1),
        estimatedStart: this.minutesToTime(this.config.morningStart),
        estimatedEnd: crewJobs.length > 0 
          ? crewJobs[crewJobs.length - 1].estimatedDeparture 
          : this.minutesToTime(this.config.morningStart),
        efficiency: this.calculateRouteEfficiency(crewJobs, totalDistance)
      });
    }
    
    return routes;
  }

  /**
   * Optimize afternoon routes - start near base, work outward
   */
  optimizeAfternoonRoutes(jobs, crews, jobsWithDistance) {
    console.log(`🌅 Optimizing afternoon routes for ${jobs.length} jobs and ${crews.length} crews`);
    
    if (crews.length === 0 || jobs.length === 0) {
      return [];
    }
    
    const routes = [];
    
    // Sort jobs by distance from base (nearest first)
    const sortedJobs = jobs
      .map(job => {
        const jobWithDist = jobsWithDistance.find(j => j.id === job.id);
        return {
          ...job,
          distanceFromBase: jobWithDist ? jobWithDist.distanceFromBase : 0
        };
      })
      .sort((a, b) => a.distanceFromBase - b.distanceFromBase);
    
    // Distribute jobs among afternoon crews
    for (let crewIndex = 0; crewIndex < crews.length; crewIndex++) {
      const crew = crews[crewIndex];
      const crewJobs = [];
      let currentTime = this.config.afternoonStart;
      let currentLocation = this.homeBase;
      let totalDistance = 0;
      let routeOrder = 1;
      
      // Build route using nearest-first approach
      const availableJobs = [...sortedJobs];
      
      while (availableJobs.length > 0 && 
             currentTime - this.config.afternoonStart < 4 * 60) { // 4 hour afternoon shift
        
        // Find nearest unassigned job to current location
        let nearestJob = null;
        let nearestDistance = Infinity;
        let nearestIndex = -1;
        
        // For first job of each crew, use round-robin from sorted list
        if (crewJobs.length === 0) {
          if (crewIndex < availableJobs.length) {
            nearestJob = availableJobs[crewIndex];
            nearestIndex = crewIndex;
            nearestDistance = nearestJob.distanceFromBase;
          }
        } else {
          // Find actual nearest job for subsequent jobs
          for (let i = 0; i < availableJobs.length; i++) {
            const job = availableJobs[i];
            const distance = this.calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              job.lat || job.latitude,
              job.lng || job.longitude
            );
            
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestJob = job;
              nearestIndex = i;
            }
          }
        }
        
        if (!nearestJob || nearestIndex === -1) break;
        
        // Check if we can fit this job
        const travelTime = this.calculateTravelTime(currentLocation, nearestJob);
        const jobEndTime = currentTime + travelTime + (nearestJob.duration || 60);
        
        if (jobEndTime - this.config.afternoonStart > 4 * 60) {
          break; // Can't fit more jobs
        }
        
        // Assign job to crew
        crewJobs.push({
          ...nearestJob,
          assignedCrew: crew.id || crew.name,
          crewName: crew.name,
          orderInRoute: routeOrder++,
          estimatedArrival: this.minutesToTime(currentTime + travelTime),
          estimatedDeparture: this.minutesToTime(jobEndTime),
          travelTime: Math.round(travelTime),
          travelDistance: nearestDistance.toFixed(1)
        });
        
        totalDistance += nearestDistance;
        currentTime = jobEndTime + this.config.bufferTime;
        currentLocation = { 
          lat: nearestJob.lat || nearestJob.latitude, 
          lng: nearestJob.lng || nearestJob.longitude 
        };
        
        // Remove from available jobs
        availableJobs.splice(nearestIndex, 1);
      }
      
      routes.push({
        crew: crew.name,
        crewId: crew.id,
        shift: 'afternoon',
        jobs: crewJobs,
        totalJobs: crewJobs.length,
        totalDistance: totalDistance.toFixed(1),
        estimatedStart: this.minutesToTime(this.config.afternoonStart),
        estimatedEnd: crewJobs.length > 0 
          ? crewJobs[crewJobs.length - 1].estimatedDeparture 
          : this.minutesToTime(this.config.afternoonStart),
        efficiency: this.calculateRouteEfficiency(crewJobs, totalDistance),
        endsAwayFromBase: crewJobs.length > 0 // Important for afternoon crews
      });
    }
    
    return routes;
  }

  /**
   * Haversine formula for calculating distance between two points
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate travel time between two locations
   */
  calculateTravelTime(from, to) {
    const distance = this.calculateDistance(
      from.lat, 
      from.lng,
      to.lat || to.latitude,
      to.lng || to.longitude
    );
    return (distance / this.config.averageSpeed) * 60; // Convert hours to minutes
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Categorize jobs by time window preference
   */
  categorizeJobsByTime(jobs) {
    const morningJobs = [];
    const afternoonJobs = [];
    const flexibleJobs = [];
    
    jobs.forEach(job => {
      if (job.timeWindow === 'morning' || job.preferredTime === 'am') {
        morningJobs.push(job);
      } else if (job.timeWindow === 'afternoon' || job.preferredTime === 'pm') {
        afternoonJobs.push(job);
      } else {
        flexibleJobs.push(job);
      }
    });
    
    return { morningJobs, afternoonJobs, flexibleJobs };
  }

  /**
   * Calculate route efficiency score
   */
  calculateRouteEfficiency(jobs, totalDistance) {
    if (jobs.length === 0) return 0;
    
    // Factors: jobs per mile, time utilization, priority completion
    const jobsPerMile = jobs.length / (totalDistance || 1);
    const priorityScore = jobs.filter(j => j.priority === 'high').length / jobs.length;
    const utilizationScore = jobs.reduce((sum, j) => sum + (j.duration || 60), 0) / (4 * 60);
    
    return Math.round((jobsPerMile * 0.4 + priorityScore * 0.3 + utilizationScore * 0.3) * 100);
  }

  /**
   * Calculate comprehensive optimization metrics
   */
  calculateOptimizationMetrics(morningRoutes, afternoonRoutes, originalJobs) {
    const allRoutes = [...morningRoutes, ...afternoonRoutes];
    
    const totalDistance = allRoutes.reduce((sum, route) => 
      sum + parseFloat(route.totalDistance || 0), 0
    );
    
    const totalJobs = allRoutes.reduce((sum, route) => 
      sum + route.totalJobs, 0
    );
    
    const avgJobsPerCrew = totalJobs / (allRoutes.length || 1);
    
    // Calculate baseline (unoptimized) metrics for comparison
    const baselineDistance = originalJobs.length * 10; // Assume 10 miles average per job without optimization
    const distanceSaved = Math.max(0, baselineDistance - totalDistance);
    const percentImprovement = baselineDistance > 0 ? (distanceSaved / baselineDistance) * 100 : 0;
    
    return {
      totalDistance: totalDistance.toFixed(1),
      totalJobs,
      routesOptimized: allRoutes.length,
      avgJobsPerCrew: avgJobsPerCrew.toFixed(1),
      distanceSaved: distanceSaved.toFixed(1),
      percentImprovement: percentImprovement.toFixed(1),
      estimatedFuelSaved: (distanceSaved * 0.08).toFixed(2), // Gallons (12.5 mpg average)
      estimatedCostSaved: (distanceSaved * 0.08 * 4.50).toFixed(2), // $ at $4.50/gallon
      estimatedTimeSaved: Math.round(distanceSaved / this.config.averageSpeed * 60), // Minutes
      morningCrewUtilization: this.calculateUtilization(morningRoutes),
      afternoonCrewUtilization: this.calculateUtilization(afternoonRoutes)
    };
  }

  /**
   * Calculate crew utilization percentage
   */
  calculateUtilization(routes) {
    if (routes.length === 0) return 0;
    
    const totalAvailableMinutes = routes.length * 4 * 60; // 4 hours per crew
    const totalUsedMinutes = routes.reduce((sum, route) => {
      return sum + route.jobs.reduce((jobSum, job) => 
        jobSum + (job.duration || 60) + (job.travelTime || 0), 0
      );
    }, 0);
    
    return Math.round((totalUsedMinutes / totalAvailableMinutes) * 100);
  }

  /**
   * Find jobs that couldn't be assigned
   */
  findUnassignedJobs(allJobs, morningRoutes, afternoonRoutes) {
    const assignedJobIds = new Set();
    
    [...morningRoutes, ...afternoonRoutes].forEach(route => {
      route.jobs.forEach(job => assignedJobIds.add(job.id));
    });
    
    return allJobs.filter(job => !assignedJobIds.has(job.id));
  }

  /**
   * Save optimization results to database
   */
  async saveOptimization(results) {
    try {
      // Save optimization history
      await supabase.insertData('optimization_history', {
        optimization_date: new Date().toISOString().split('T')[0],
        jobs_optimized: results.metrics.totalJobs,
        distance_saved: parseFloat(results.metrics.distanceSaved),
        time_saved: results.metrics.estimatedTimeSaved,
        fuel_saved: parseFloat(results.metrics.estimatedFuelSaved)
      });
      
      // Update individual jobs
      for (const route of [...results.morning, ...results.afternoon]) {
        for (const job of route.jobs) {
          await supabase.updateData('jobs', job.id, {
            assigned_crew: job.assignedCrew,
            order_in_route: job.orderInRoute,
            estimated_arrival: job.estimatedArrival,
            optimized: true
          });
        }
      }
      
      console.log('✅ Optimization saved to database');
      return true;
    } catch (error) {
      console.error('❌ Failed to save optimization:', error);
      return false;
    }
  }
}

export default AdvancedRouteOptimizer;