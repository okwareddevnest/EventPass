import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUser } from '@civic/auth/react';
import { User, Mail, Wallet, Shield, Calendar, QrCode, Download, Eye } from 'lucide-react';
import { ticketsAPI } from '../services/api';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { user: civicUser } = useUser();
  const { success, error } = useNotification();

  // Use Civic user if available, fallback to custom auth user
  const currentUser = civicUser || user;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    walletAddress: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        walletAddress: currentUser.walletAddress || '',
      });
      fetchUserTickets();
    }
  }, [currentUser]);

  const fetchUserTickets = async () => {
    try {
      // Use the API service which handles the base URL correctly
      const data = await ticketsAPI.getUserTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      // Set empty array on error to prevent crashes
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      // For Civic Auth users, profile updates might need to go through Civic's API
      // For now, we'll try the custom auth update
      const result = await updateProfile(formData);

      if (result.success) {
        success('Profile updated successfully!');
        setEditing(false);
      } else {
        error(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: currentUser.name || '',
      email: currentUser.email || '',
      walletAddress: currentUser.walletAddress || '',
    });
    setEditing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
        return 'text-green-400';
      case 'used':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      case 'refunded':
        return 'text-yellow-400';
      default:
        return 'text-neutral/70';
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-neutral/70">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral mb-2">Profile</h1>
        <p className="text-neutral/70">Manage your account and view your tickets</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral">Account Information</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-primary hover:text-secondary transition-colors duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User size={20} className="text-primary" />
                  <div>
                    <p className="text-neutral/70 text-sm">Name</p>
                    <p className="text-neutral font-medium">{currentUser.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail size={20} className="text-secondary" />
                  <div>
                    <p className="text-neutral/70 text-sm">Email</p>
                    <p className="text-neutral font-medium">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Wallet size={20} className="text-purple-400" />
                  <div>
                    <p className="text-neutral/70 text-sm">Wallet Address</p>
                    <p className="text-neutral font-medium font-mono text-sm">
                      {currentUser.walletAddress || 'Not connected'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield size={20} className="text-green-400" />
                  <div>
                    <p className="text-neutral/70 text-sm">Role</p>
                    <p className="text-neutral font-medium capitalize">{currentUser.role}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar size={20} className="text-blue-400" />
                  <div>
                    <p className="text-neutral/70 text-sm">Member Since</p>
                    <p className="text-neutral font-medium">
                      {formatDate(currentUser.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral/70 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral/70 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral/70 mb-2">
                    Wallet Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono"
                    placeholder="0x..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-neutral mb-4">Your Stats</h3>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{tickets.length}</p>
                <p className="text-neutral/70 text-sm">Total Tickets</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {tickets.filter(t => t.status === 'valid').length}
                </p>
                <p className="text-neutral/70 text-sm">Valid Tickets</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  ${tickets.reduce((sum, ticket) => sum + ticket.price, 0).toFixed(2)}
                </p>
                <p className="text-neutral/70 text-sm">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Tickets */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-neutral">My Tickets</h2>
          <p className="text-neutral/70">View and manage your purchased tickets</p>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-20 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <QrCode size={48} className="text-neutral/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral mb-2">No tickets yet</h3>
            <p className="text-neutral/70 mb-6">Purchase tickets for events to see them here</p>
            <a
              href="/events"
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral">
                        {ticket.eventId?.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-neutral/70 text-sm mb-2">
                      Purchased on {formatDate(ticket.purchaseDate)}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-neutral/60">
                      <span>Ticket ID: {ticket.ticketId}</span>
                      <span>${ticket.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {ticket.qrCodeUrl && ticket.status === 'valid' && (
                      <button
                        className="p-2 text-neutral/70 hover:text-primary hover:bg-white/10 rounded-lg transition-colors duration-200"
                        title="View QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                    )}

                    {ticket.status === 'valid' && (
                      <button
                        className="p-2 text-neutral/70 hover:text-secondary hover:bg-white/10 rounded-lg transition-colors duration-200"
                        title="Download Ticket"
                      >
                        <Download size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
