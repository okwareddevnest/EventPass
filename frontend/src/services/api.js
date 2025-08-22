// API service for EventPass
// Handle both local development and production environments
const getApiBaseUrl = () => {
  // Check if we have an explicit API URL set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production detection
  if (window.location.hostname === 'event-pass-five.vercel.app') {
    return 'https://eventpass-backend-hggh.onrender.com';
  }
  
  // Local development
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making API request to: ${url}`);

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Token found, adding to headers');
    } else {
      console.log('No token found in localStorage');
    }

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle different response types
      if (response.status === 401) {
        console.error('Unauthorized request - clearing token');
        localStorage.removeItem('token');
        // Don't throw here, let the component handle it
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Event-specific API methods
export const eventsAPI = {
  // Get all events
  getEvents: (params = {}) => apiService.get('/api/events', params),

  // Get single event
  getEvent: (id) => apiService.get(`/api/events/${id}`),

  // Create event
  createEvent: (eventData) => apiService.post('/api/events', eventData),

  // Update event
  updateEvent: (id, eventData) => apiService.put(`/api/events/${id}`, eventData),

  // Delete event
  deleteEvent: (id) => apiService.delete(`/api/events/${id}`),

  // Get organizer events
  getOrganizerEvents: (params = {}) => apiService.get('/api/events/organizer/events', params),
};

// Auth-specific API methods
export const authAPI = {
  // Verify Civic Auth token
  verify: (tokenData) => apiService.post('/api/auth/verify', tokenData),

  // Get current user
  getCurrentUser: () => apiService.get('/api/auth/me'),

  // Update profile
  updateProfile: (profileData) => apiService.put('/api/auth/profile', profileData),
};

// Ticket-specific API methods
export const ticketsAPI = {
  // Get event tickets
  getEventTickets: (eventId) => apiService.get(`/api/tickets/event/${eventId}`),

  // Purchase ticket
  purchaseTicket: (ticketData) => apiService.post('/api/tickets/purchase', ticketData),

  // Get user tickets
  getUserTickets: () => apiService.get('/api/tickets/my-tickets'),

  // Validate ticket
  validateTicket: (ticketId) => apiService.post(`/api/tickets/validate/${ticketId}`),
};

// Organization-specific API methods
export const organizationsAPI = {
  // Register as organization
  register: (orgData) => apiService.post('/api/organizations/register', orgData),

  // Upload organization logo
  uploadLogo: (formData) => apiService.post('/api/organizations/upload/logo', formData),

  // Get organization profile
  getProfile: () => apiService.get('/api/organizations/profile'),

  // Update organization profile
  updateProfile: (profileData) => apiService.put('/api/organizations/profile', profileData),

  // Get pending approvals (admin only)
  getPendingApprovals: (params = {}) => apiService.get('/api/organizations/pending-approvals', params),

  // Approve organization (admin only)
  approveOrganization: (userId) => apiService.put(`/api/organizations/${userId}/approve`),

  // Reject organization (admin only)
  rejectOrganization: (userId, reason) => apiService.put(`/api/organizations/${userId}/reject`, { reason }),
};

// Financial-specific API methods
export const financialAPI = {
  // Get financial dashboard for organizations
  getDashboard: () => apiService.get('/api/financial/dashboard'),

  // Request payout
  requestPayout: (payoutData) => apiService.post('/api/financial/payouts/request', payoutData),

  // Get payout requests
  getPayouts: (params = {}) => apiService.get('/api/financial/payouts', params),

  // Cancel payout request
  cancelPayout: (payoutId) => apiService.patch(`/api/financial/payouts/${payoutId}/cancel`),

  // Admin endpoints
  admin: {
    // Get financial overview (admin only)
    getOverview: () => apiService.get('/api/financial/admin/overview'),

    // Get all payout requests (admin only)
    getPayouts: (params = {}) => apiService.get('/api/financial/admin/payouts', params),

    // Approve payout request (admin only)
    approvePayout: (payoutId, adminNotes) => apiService.patch(`/api/financial/admin/payouts/${payoutId}/approve`, { adminNotes }),

    // Reject payout request (admin only)
    rejectPayout: (payoutId, rejectionReason, adminNotes) => apiService.patch(`/api/financial/admin/payouts/${payoutId}/reject`, { rejectionReason, adminNotes }),

    // Complete payout (admin only)
    completePayout: (payoutId, externalReference, notes) => apiService.patch(`/api/financial/admin/payouts/${payoutId}/complete`, { externalReference, notes }),

    // Update financial settings (admin only)
    updateSettings: (settings) => apiService.patch('/api/financial/admin/settings', settings),

    // Get financial settings (admin only)
    getSettings: () => apiService.get('/api/financial/admin/settings'),
  },
};

// Default export
export default apiService;
