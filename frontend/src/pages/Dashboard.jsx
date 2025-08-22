import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
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
  Crown,
  Shield
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { error } = useNotification();

  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
  const [userStats, setUserStats] = useState({
    totalTickets: 0,
    validTickets: 0,
    upcomingEvents: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (user?.role === 'organizer') {
      fetchOrganizerData();
    } else {
      fetchUserData();
    }
  }, [user]);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);

      // Fetch organizer's events
      const eventsResponse = await fetch('/api/events/organizer/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events);

        // Calculate stats
        const totalEvents = eventsData.events.length;
        const totalAttendees = eventsData.events.reduce((sum, event) => sum + event.currentAttendees, 0);
        const totalRevenue = eventsData.events.reduce((sum, event) => sum + (event.currentAttendees * event.price), 0);
        const activeEvents = eventsData.events.filter(event => event.status === 'published').length;

        setStats({
          totalEvents,
          totalAttendees,
          totalRevenue,
          activeEvents,
        });
      }
    } catch (err) {
      console.error('Error fetching organizer data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user's tickets
      const ticketsResponse = await fetch('/api/tickets/my-tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets);

        // Calculate user stats
        const totalTickets = ticketsData.tickets.length;
        const validTickets = ticketsData.tickets.filter(ticket => ticket.status === 'valid').length;
        const totalSpent = ticketsData.tickets.reduce((sum, ticket) => sum + ticket.price, 0);

        // Calculate upcoming events (events with future dates)
        const upcomingEvents = ticketsData.tickets.filter(ticket => {
          if (ticket.eventId?.date) {
            return new Date(ticket.eventId.date) > new Date();
          }
          return false;
        }).length;

        setUserStats({
          totalTickets,
          validTickets,
          upcomingEvents,
          totalSpent,
        });
      } else if (ticketsResponse.status === 401) {
        console.error('Authentication required for user dashboard');
        error('Please log in to view your dashboard');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setEvents(events.filter(event => event._id !== eventId));
        // Update stats
        const deletedEvent = events.find(event => event._id === eventId);
        if (deletedEvent) {
          setStats(prev => ({
            ...prev,
            totalEvents: prev.totalEvents - 1,
            totalAttendees: prev.totalAttendees - deletedEvent.currentAttendees,
            totalRevenue: prev.totalRevenue - (deletedEvent.currentAttendees * deletedEvent.price),
            activeEvents: deletedEvent.status === 'published' ? prev.activeEvents - 1 : prev.activeEvents,
          }));
        }
      } else {
        error('Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      error('Failed to delete event');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-300';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Show loading state for all users
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Loading */}
        <div className="flex justify-between items-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-2 w-48"></div>
            <div className="h-4 bg-white/10 rounded w-64"></div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-8 bg-white/10 rounded mb-2"></div>
              <div className="h-6 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>

        {/* Content Loading */}
        <div className="bg-white/5 rounded-2xl p-6 animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  // Render user dashboard
  if (user?.role !== 'organizer') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-neutral">My Dashboard</h1>
              <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                <Shield size={12} className="text-blue-400" />
                <span>Attendee</span>
              </div>
            </div>
            <p className="text-neutral/70">Track your tickets and upcoming events</p>
          </div>

          <Link
            to="/events"
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Calendar size={20} />
            <span>Browse Events</span>
          </Link>
        </div>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Total Tickets</p>
                <p className="text-3xl font-bold text-neutral">{userStats.totalTickets}</p>
              </div>
              <Ticket size={32} className="text-primary" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Valid Tickets</p>
                <p className="text-3xl font-bold text-neutral">{userStats.validTickets}</p>
              </div>
              <CheckCircle size={32} className="text-green-400" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Upcoming Events</p>
                <p className="text-3xl font-bold text-neutral">{userStats.upcomingEvents}</p>
              </div>
              <Clock size={32} className="text-secondary" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral/70 text-sm">Total Spent</p>
                <p className="text-3xl font-bold text-neutral">${userStats.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign size={32} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* My Tickets */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-neutral">My Tickets</h2>
            <p className="text-neutral/70">View and manage your purchased tickets</p>
          </div>

          <div className="divide-y divide-white/10">
            {tickets.length === 0 ? (
              <div className="p-12 text-center">
                <Ticket size={48} className="text-neutral/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral mb-2">No tickets yet</h3>
                <p className="text-neutral/70 mb-6">Purchase tickets for events to see them here</p>
                <Link
                  to="/events"
                  className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket._id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral">
                          {ticket.eventId?.title || 'Event Title'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-neutral/70 text-sm mb-2">
                        Purchased on {new Date(ticket.purchaseDate).toLocaleDateString()}
                      </p>

                      {ticket.eventId?.date && (
                        <p className="text-neutral/70 text-sm mb-3">
                          Event date: {new Date(ticket.eventId.date).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-neutral/60">
                        <span>Ticket ID: {ticket.ticketId}</span>
                        <span>${ticket.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {ticket.eventId && (
                        <Link
                          to={`/events/${ticket.eventId._id}`}
                          className="p-2 text-neutral/70 hover:text-primary hover:bg-white/10 rounded-lg transition-colors duration-200"
                          title="View Event"
                        >
                          <Eye size={18} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/events"
                className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <Calendar size={20} className="text-primary" />
                <span className="text-neutral">Browse Events</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <Settings size={20} className="text-secondary" />
                <span className="text-neutral">Account Settings</span>
              </Link>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-sm text-neutral/70">
                {tickets.length === 0 ? (
                  <p>No recent activity</p>
                ) : (
                  <p>Last ticket purchased: {new Date(tickets[0]?.purchaseDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render organizer dashboard
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral">Organizer Dashboard</h1>
            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
              <Crown size={12} className="text-yellow-400" />
              <span>Organizer</span>
            </div>
          </div>
          <p className="text-neutral/70">Manage your events and track performance</p>
        </div>

        <Link
          to="/events?create=true"
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Event</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral/70 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-neutral">{stats.totalEvents}</p>
            </div>
            <Calendar size={32} className="text-primary" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral/70 text-sm">Total Attendees</p>
              <p className="text-3xl font-bold text-neutral">{stats.totalAttendees}</p>
            </div>
            <Users size={32} className="text-secondary" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral/70 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-neutral">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign size={32} className="text-green-400" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral/70 text-sm">Active Events</p>
              <p className="text-3xl font-bold text-neutral">{stats.activeEvents}</p>
            </div>
            <TrendingUp size={32} className="text-purple-400" />
          </div>
        </div>
      </div>

      {/* Events Management */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-neutral">Your Events</h2>
          <p className="text-neutral/70">Manage and track your created events</p>
        </div>

        <div className="divide-y divide-white/10">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} className="text-neutral/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral mb-2">No events yet</h3>
              <p className="text-neutral/70 mb-6">Create your first event to get started</p>
              <Link
                to="/events?create=true"
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Create Event
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <div key={event._id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-neutral">{event.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>

                    <p className="text-neutral/70 text-sm mb-3 line-clamp-2">{event.description}</p>

                    <div className="flex items-center space-x-6 text-sm text-neutral/60">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>{event.currentAttendees}/{event.maxAttendees || '∞'} attendees</span>
                      <span>${event.price.toFixed(2)} per ticket</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/events/${event._id}`}
                      className="p-2 text-neutral/70 hover:text-primary hover:bg-white/10 rounded-lg transition-colors duration-200"
                      title="View Event"
                    >
                      <Eye size={18} />
                    </Link>

                    <button
                      className="p-2 text-neutral/70 hover:text-secondary hover:bg-white/10 rounded-lg transition-colors duration-200"
                      title="Edit Event"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 text-neutral/70 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors duration-200"
                      title="Delete Event"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-neutral mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/events?create=true"
              className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} className="text-primary" />
              <span className="text-neutral">Create New Event</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <Settings size={20} className="text-secondary" />
              <span className="text-neutral">Account Settings</span>
            </Link>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-neutral mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm text-neutral/70">
              {events.length === 0 ? (
                <p>No recent activity</p>
              ) : (
                <p>Last event created: {new Date(events[0]?.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
