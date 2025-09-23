// services/database/supabase.js
// MULTI-TENANT VERSION

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

  // Get current company ID from localStorage
  getCurrentCompanyId() {
    const companyId = localStorage.getItem('currentCompanyId');
    if (!companyId) {
      console.warn('No company context set');
    }
    return companyId;
  }

  // Fetch data - automatically filters by company
  async fetchData(table, limit = 100) {
    try {
      const companyId = this.getCurrentCompanyId();
      
      // These tables don't need company filtering
      const globalTables = ['companies'];
      
      let url;
      if (globalTables.includes(table)) {
        url = `${this.url}/rest/v1/${table}?limit=${limit}`;
      } else if (companyId) {
        // Add company filter to all other tables
        url = `${this.url}/rest/v1/${table}?company_id=eq.${companyId}&limit=${limit}`;
      } else {
        console.warn('No company context for table:', table);
        return [];
      }
      
      const response = await fetch(url, {
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

  // Insert data - automatically adds company_id
  async insertData(table, data) {
    try {
      const companyId = this.getCurrentCompanyId();
      
      // Auto-add company_id except for companies table
      const dataWithCompany = (table !== 'companies' && companyId) 
        ? { ...data, company_id: companyId }
        : data;
      
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dataWithCompany)
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

  // Update data - validates company ownership
  async updateData(table, id, updates) {
    try {
      const companyId = this.getCurrentCompanyId();
      
      let url = `${this.url}/rest/v1/${table}?id=eq.${id}`;
      if (companyId && table !== 'companies') {
        url += `&company_id=eq.${companyId}`;
      }
      
      const response = await fetch(url, {
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

  // Delete data
  async deleteData(table, id) {
    try {
      const companyId = this.getCurrentCompanyId();
      
      let url = `${this.url}/rest/v1/${table}?id=eq.${id}`;
      if (companyId && table !== 'companies') {
        url += `&company_id=eq.${companyId}`;
      }
      
      const response = await fetch(url, {
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

  // Clear company context on logout
  clearCompanyContext() {
    localStorage.removeItem('currentCompanyId');
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);