# EventPass 🎟️

A full-stack event ticketing platform with blockchain-powered verification, built with modern web technologies.

## ✨ Features

### 🔐 Authentication
- **Civic Auth Integration**: Web2 and Web3 login options
- **JWT-based**: Secure token authentication
- **Role-based Access**: Attendee and Organizer roles

### 🎯 Core Functionality
- **Event Creation**: Organizers can create and manage events
- **Event Discovery**: Browse and search events with advanced filtering
- **Ticket Purchase**: Stripe-powered payments with Apple Pay & Google Pay
- **QR Code Generation**: Unique tickets with blockchain verification
- **Ticket Verification**: Real-time QR code validation at events

### 🎨 User Experience
- **Modern UI**: Clean, enterprise-grade design with glassmorphism
- **Particles Background**: Interactive animated background
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live event and ticket status updates

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Stripe Elements** for payments
- **QR Code Generation** for tickets
- **Particles.js** for background animations

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **Stripe API** for payments
- **QR Code Generation** for tickets
- **Security Middleware** (Helmet, CORS, Rate Limiting)

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Stripe Account (with API keys)
- Civic Auth Account (with Client ID/Secret)
- EventPass logo file (`frontend/public/eventpass-logo.png`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/okwareddevnest/EventPass.git
   cd EventPass
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp env-example.txt .env
   # Edit .env with your actual production credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp env-config.txt .env
   # Edit .env with your actual production credentials
   npm run dev
   ```

### Environment Configuration

#### Backend (.env) - Required for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_actual_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_jwt_secret_64_chars_min
CIVIC_CLIENT_ID=your_actual_civic_client_id
CIVIC_CLIENT_SECRET=your_actual_civic_client_secret
CIVIC_REDIRECT_URI=https://your-frontend-domain.com/auth/callback
FRONTEND_URL=https://your-vercel-app-domain.vercel.app

# Pesapal Configuration
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_CALLBACK_URL=https://your-frontend-domain.com/payment/callback
PESAPAL_IPN_URL=https://your-backend-domain.onrender.com/api/pesapal/ipn
APP_BASE_URL_FRONTEND=https://your-frontend-domain.com
```

#### Frontend (.env) - Required for Production
```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
VITE_CIVIC_CLIENT_ID=your_civic_client_id_from_dashboard
```

### 🔐 Civic Auth Setup

1. **Sign up for Civic Auth**
   - Visit [auth.civic.com](https://auth.civic.com)
   - Create an account and get your Client ID and Secret

2. **Configure your app in Civic Dashboard**
   - Set the redirect URI to: `https://your-domain.com/auth/callback`
   - Enable Web2 and Web3 authentication options
   - Configure allowed domains

3. **Update environment variables**
   - Set `CIVIC_CLIENT_ID` and `CIVIC_CLIENT_SECRET` in backend
   - Set `VITE_CIVIC_CLIENT_ID` in frontend
   - Set `CIVIC_REDIRECT_URI` in backend

4. **Test authentication**
   - Try both Web2 (email/social) and Web3 (wallet) login options
   - Verify user creation and JWT token generation

#### Frontend (.env) - Required for Production
```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
VITE_CIVIC_CLIENT_ID=your_civic_client_id_from_dashboard
```

### Favicon Setup
The favicon is automatically configured to use `/eventpass-logo.png` from the public directory. Ensure your logo file is placed at `frontend/public/eventpass-logo.png`.

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/eventpass

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Civic Auth
CIVIC_CLIENT_ID=your_civic_client_id
CIVIC_CLIENT_SECRET=your_civic_client_secret
CIVIC_REDIRECT_URI=http://localhost:5173/auth/callback

# Pesapal (for payments)
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_CALLBACK_URL=http://localhost:5173/payment/callback
PESAPAL_IPN_URL=http://localhost:5000/api/pesapal/ipn
APP_BASE_URL_FRONTEND=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CIVIC_CLIENT_ID=your_civic_client_id
```

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  civicId: String, // Civic Auth ID
  name: String,
  email: String,
  role: 'attendee' | 'organizer',
  walletAddress: String, // Optional Web3 wallet
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  _id: ObjectId,
  organizerId: ObjectId, // Reference to Users
  title: String,
  description: String,
  date: Date,
  location: String,
  price: Number,
  maxAttendees: Number, // Optional
  currentAttendees: Number,
  status: 'draft' | 'published' | 'cancelled' | 'completed',
  image: String, // Optional image URL
  tags: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Tickets Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to Users
  eventId: ObjectId, // Reference to Events
  ticketId: String, // Unique ticket identifier
  qrCodeUrl: String, // Generated QR code image URL
  status: 'valid' | 'used' | 'cancelled' | 'refunded',
  price: Number,
  purchaseDate: Date,
  usedDate: Date, // Optional
  paymentIntentId: String, // Stripe payment ID
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Civic Auth token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Events
- `GET /api/events` - Get all events (with filtering)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (organizer only)
- `PUT /api/events/:id` - Update event (organizer only)
- `DELETE /api/events/:id` - Delete event (organizer only)

### Tickets
- `GET /api/tickets/my-tickets` - Get user's tickets
- `POST /api/tickets/create-payment-intent` - Create Stripe payment intent
- `POST /api/tickets/purchase` - Confirm ticket purchase
- `POST /api/tickets/verify` - Verify ticket (public endpoint)
- `GET /api/tickets/:ticketId` - Get ticket details

### Payments
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/payment-methods` - Get user's payment methods

## 🎨 Design System

### Color Palette
- **Primary**: `#1D4ED8` (Blue-600)
- **Secondary**: `#14B8A6` (Teal-500)
- **Accent**: `#0F172A` (Slate-900)
- **Neutral Text**: `#F8FAFC` (Slate-50)

### Components
- **Glassmorphism**: Semi-transparent backgrounds with blur
- **Gradient Buttons**: Blue to teal gradients
- **Floating Labels**: Modern form inputs
- **Card Layout**: Shadow and rounded corners
- **Particles Background**: Interactive animated background

## 🚀 Deployment

### Production Setup Checklist
- [ ] Place EventPass logo at `frontend/public/eventpass-logo.png`
- [ ] Configure all environment variables with actual production credentials
- [ ] Set up MongoDB Atlas cluster with proper security settings
- [ ] Configure Stripe webhook endpoints
- [ ] Set up Civic Auth application and get client credentials
- [ ] Test all authentication flows
- [ ] Test payment processing
- [ ] Verify QR code generation and verification

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables:
   - `VITE_API_BASE_URL` - Your Render backend URL
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy

### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set runtime to Node.js
4. Configure environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI` - MongoDB Atlas connection string
   - `JWT_SECRET` - Secure random string (64+ characters)
   - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
   - `CIVIC_CLIENT_ID` - Civic client ID
   - `CIVIC_CLIENT_SECRET` - Civic client secret
   - `FRONTEND_URL` - Your Vercel app URL
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Deploy

### Database (MongoDB Atlas)
1. Create Atlas cluster (M0 for development, M10+ for production)
2. Create database user with read/write permissions
3. Configure network access (whitelist IP addresses)
4. Get connection string and add to backend environment variables
5. Enable database authentication and SSL

### Favicon Configuration
The favicon is automatically configured in `frontend/index.html`:
```html
<link rel="icon" type="image/png" href="/eventpass-logo.png" />
```

Ensure your logo file:
- Is in PNG format
- Has a transparent background
- Is at least 32x32 pixels (512x512 recommended)
- Is placed at `frontend/public/eventpass-logo.png`

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request sanitization
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Sensitive data protection

## 🧪 Testing

### Production Readiness Checklist
- [ ] **Favicon**: Logo file placed at `frontend/public/eventpass-logo.png`
- [ ] **Environment Variables**: All `.env` files configured with actual production credentials
- [ ] **Database**: MongoDB Atlas cluster created with proper security settings
- [ ] **Stripe**: API keys configured and webhook endpoints set up
- [ ] **Civic Auth**: Client credentials obtained and configured
- [ ] **Domain**: Custom domain configured (if applicable)
- [ ] **SSL**: HTTPS enabled for all services
- [ ] **Security**: All security headers and middleware configured
- [ ] **Performance**: Build optimizations and code splitting enabled
- [ ] **SEO**: Meta tags and structured data configured

### Manual Testing Checklist
- [ ] User registration and login (Web2 and Web3)
- [ ] Event creation and management (organizer role)
- [ ] Event browsing and filtering
- [ ] Ticket purchase flow with Stripe
- [ ] QR code generation and download
- [ ] Ticket verification system
- [ ] Mobile responsiveness
- [ ] Error handling and validation
- [ ] Profile management
- [ ] Dashboard functionality (organizer)
- [ ] Payment webhook processing
- [ ] Refund processing

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test","civicId":"test","name":"Test User","email":"test@example.com"}'

# Test event creation
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Event","description":"Test Description","date":"2024-12-31T10:00:00Z","location":"Test Location","price":25.00}'
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@eventpass.com or join our Discord community.

## 🎉 Acknowledgments

- [Civic](https://www.civic.com/) for authentication services
- [Stripe](https://stripe.com/) for payment processing
- [MongoDB](https://www.mongodb.com/) for database
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the frontend framework
