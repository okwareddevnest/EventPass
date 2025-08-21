// API service for EventPass
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
  // Login
  login: (credentials) => apiService.post('/api/auth/login', credentials),

  // Register
  register: (userData) => apiService.post('/api/auth/register', userData),

  // Logout
  logout: () => apiService.post('/api/auth/logout'),

  // Get current user
  getCurrentUser: () => apiService.get('/api/auth/me'),
};

// Ticket-specific API methods
export const ticketsAPI = {
  // Get event tickets
  getEventTickets: (eventId) => apiService.get(`/api/tickets/event/${eventId}`),

  // Purchase ticket
  purchaseTicket: (ticketData) => apiService.post('/api/tickets/purchase', ticketData),

  // Get user tickets
  getUserTickets: () => apiService.get('/api/tickets/user'),

  // Validate ticket
  validateTicket: (ticketId) => apiService.post(`/api/tickets/validate/${ticketId}`),
};

// Default export
export default apiService;
