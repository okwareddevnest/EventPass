// API service for EventPass
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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

// Default export
export default apiService;
