// services/database/supabase.js

const SUPABASE_URL = 'https://mgpwaxgfbmwouvcqbpxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncHdheGdmYm13b3V2Y3FicHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NTAyMTgsImV4cCI6MjA3MzEyNjIxOH0.cMR6r1L-cCkHHDnFB7s3o0VKeNzZOlCWpVBvevux8rU';

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  // Fetch data from a table
  async fetchData(table, limit = 100) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?limit=${limit}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Error fetching from ${table}:`, response.status);
        return [];
      }
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }
  }

  // Insert data into a table
  async insertData(table, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error inserting into ${table}:`, errorText);
        throw new Error(`Failed to insert: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      throw error;
    }
  }

  // Update data in a table
  async updateData(table, id, updates) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        console.error(`Error updating ${table}:`, response.status);
        return null;
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }
  }

  // Delete data from a table
  async deleteData(table, id) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Error deleting from ${table}:`, response.status);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  }

  // Query data with filters
  async queryData(table, filters = {}) {
    try {
      const queryParams = Object.entries(filters)
        .map(([key, value]) => `${key}=eq.${value}`)
        .join('&');
      
      const url = queryParams 
        ? `${this.url}/rest/v1/${table}?${queryParams}`
        : `${this.url}/rest/v1/${table}`;
      
      const response = await fetch(url, {
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Error querying ${table}:`, response.status);
        return [];
      }
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error querying ${table}:`, error);
      return [];
    }
  }
}

// Create and export the Supabase client instance
export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);