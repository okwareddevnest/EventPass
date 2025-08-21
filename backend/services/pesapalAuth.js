const axios = require('axios');

// In-memory token cache
let tokenCache = {
  token: null,
  expiryDate: null
};

// Pesapal API endpoints
const PESAPAL_ENDPOINTS = {
  sandbox: {
    auth: 'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
    submitOrder: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
    registerIPN: 'https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN',
    getTransactionStatus: 'https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus'
  },
  live: {
    auth: 'https://pay.pesapal.com/v3/api/Auth/RequestToken',
    submitOrder: 'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
    registerIPN: 'https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN',
    getTransactionStatus: 'https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus'
  }
};

class PesapalAuthService {
  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    this.env = process.env.PESAPAL_ENV || 'sandbox';
    this.endpoints = PESAPAL_ENDPOINTS[this.env];

    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be configured');
    }
  }

  /**
   * Get cached access token or request new one if expired
   */
  async getAccessToken() {
    const now = new Date();

    // Check if we have a valid cached token (with 30-second buffer)
    if (tokenCache.token && tokenCache.expiryDate &&
        new Date(tokenCache.expiryDate).getTime() - now.getTime() > 30000) {
      return tokenCache.token;
    }

    try {
      // Request new token
      const response = await axios.post(this.endpoints.auth, {
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.token) {
        // Cache token with 4.5 minute expiry (5 minute token - 30 second buffer)
        tokenCache.token = response.data.token;
        tokenCache.expiryDate = new Date(now.getTime() + 4.5 * 60 * 1000);

        console.log('Pesapal token cached, expires at:', tokenCache.expiryDate);
        return tokenCache.token;
      } else {
        throw new Error('Invalid token response from Pesapal');
      }
    } catch (error) {
      console.error('Pesapal token request failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Pesapal');
    }
  }

  /**
   * Get API endpoints for current environment
   */
  getEndpoints() {
    return this.endpoints;
  }

  /**
   * Create authorization headers for API requests
   */
  async getAuthHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Clear token cache (useful for testing or forced refresh)
   */
  clearTokenCache() {
    tokenCache = {
      token: null,
      expiryDate: null
    };
    console.log('Pesapal token cache cleared');
  }
}

// Export singleton instance
module.exports = new PesapalAuthService();
