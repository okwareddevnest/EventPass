import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { organizationsAPI, eventsAPI } from '../services/api';
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Ticket,
  Clock,
  CheckCircle,
  Building,
  MapPin,
  Globe
} from 'lucide-react';

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const { error, success } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
  const [organizationProfile, setOrganizationProfile] = useState(null);

  useEffect(() => {
    fetchOrganizationData();
  }, [user]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);

      // Fetch organization profile
      const profileResponse = await organizationsAPI.getProfile();
      setOrganizationProfile(profileResponse.organization);

      // Fetch organization's events
      const eventsResponse = await eventsAPI.getOrganizerEvents();
      setEvents(eventsResponse.events);

      // Calculate stats
      const totalEvents = eventsResponse.events.length;
      const totalAttendees = eventsResponse.events.reduce((sum, event) => sum + event.currentAttendees, 0);
      const totalRevenue = eventsResponse.events.reduce((sum, event) => sum + (event.currentAttendees * event.price), 0);
      const activeEvents = eventsResponse.events.filter(event => event.status === 'published').length;

      setStats({
        totalEvents,
        totalAttendees,
        totalRevenue,
        activeEvents,
      });
    } catch (err) {
      console.error('Error fetching organization data:', err);
      error('Failed to load organization dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventsAPI.deleteEvent(eventId);
      success('Event deleted successfully');
      fetchOrganizationData(); // Refresh data
    } catch (err) {
      console.error('Error deleting event:', err);
      error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organizationProfile) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <Building size={64} className="mx-auto mb-4 text-neutral/50" />
          <h2 className="text-2xl font-bold text-neutral mb-2">Organization Profile Not Found</h2>
          <p className="text-neutral/70">Please complete your organization registration.</p>
        </div>
      </div>
    );
  }

  if (!organizationProfile.organizationDetails.isApproved) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock size={64} className="mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold text-neutral mb-2">Awaiting Approval</h2>
          <p className="text-neutral/70 mb-4">
            Your organization registration is being reviewed by our administrators.
            You'll be notified once your organization is approved.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Organization:</strong> {organizationProfile.organizationDetails.orgName}
            </p>
            <p className="text-sm text-yellow-200/70 mt-1">
              Deposit Status: {organizationProfile.organizationDetails.depositPaid ? 'Paid' : 'Pending'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-accent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral">Organization Dashboard</h1>
              <p className="text-neutral/70 mt-1">Manage your events and track performance</p>
            </div>
            <button
              onClick={() => navigate('/organization/events/create')}
              className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Create Event
            </button>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-6">
            {organizationProfile.organizationDetails.orgLogo ? (
              <img
                src={organizationProfile.organizationDetails.orgLogo}
                alt={organizationProfile.organizationDetails.orgName}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <Building size={32} className="text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral mb-2">
                {organizationProfile.organizationDetails.orgName}
              </h2>
              <p className="text-neutral/70 mb-4">
                {organizationProfile.organizationDetails.orgDescription}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-neutral/70">
                  <Globe size={16} className="mr-2" />
                  {organizationProfile.organizationDetails.orgWebsite || 'No website'}
                </div>
                <div className="flex items-center text-neutral/70">
                  <MapPin size={16} className="mr-2" />
                  {organizationProfile.organizationDetails.orgAddress}
                </div>
                <div className="flex items-center text-neutral/70">
                  <DollarSign size={16} className="mr-2" />
                  Earnings: ${organizationProfile.organizationDetails.totalEarnings || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-neutral">{stats.totalEvents}</p>
              </div>
              <Calendar size={32} className="text-primary" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Total Attendees</p>
                <p className="text-2xl font-bold text-neutral">{stats.totalAttendees}</p>
              </div>
              <Users size={32} className="text-secondary" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-neutral">${stats.totalRevenue}</p>
              </div>
              <DollarSign size={32} className="text-green-400" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Active Events</p>
                <p className="text-2xl font-bold text-neutral">{stats.activeEvents}</p>
              </div>
              <TrendingUp size={32} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral">Your Events</h2>
            <button
              onClick={() => navigate('/organization/events/create')}
              className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Create Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={64} className="mx-auto mb-4 text-neutral/30" />
              <h3 className="text-xl font-semibold text-neutral mb-2">No Events Yet</h3>
              <p className="text-neutral/70 mb-6">Create your first event to get started</p>
              <button
                onClick={() => navigate('/organization/events/create')}
                className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 inline-flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event._id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral mb-1">{event.title}</h3>
                      <p className="text-sm text-neutral/70">{event.location}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {event.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-neutral/70">
                      <Calendar size={14} className="mr-2" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-neutral/70">
                      <Users size={14} className="mr-2" />
                      {event.currentAttendees}/{event.maxAttendees || '∞'} attendees
                    </div>
                    <div className="flex items-center text-sm text-neutral/70">
                      <DollarSign size={14} className="mr-2" />
                      ${event.price}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Link
                        to={`/events/${event._id}`}
                        className="p-2 text-neutral/70 hover:text-neutral hover:bg-white/10 rounded-lg transition-colors duration-200"
                        title="View Event"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/events/${event._id}/edit`}
                        className="p-2 text-neutral/70 hover:text-neutral hover:bg-white/10 rounded-lg transition-colors duration-200"
                        title="Edit Event"
                      >
                        <Edit3 size={16} />
                      </Link>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
