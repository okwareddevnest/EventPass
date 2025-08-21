import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, Share2, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import TicketPurchaseModal from '../components/TicketPurchaseModal';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { error, info } = useNotification();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`);

      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      } else if (response.status === 404) {
        error('Event not found');
        navigate('/events');
      } else {
        error('Failed to load event details');
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      info('Please login to purchase tickets');
      navigate('/auth', { state: { from: `/events/${id}` } });
      return;
    }

    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      error('This event is sold out');
      return;
    }

    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseModal(false);
    fetchEventDetails(); // Refresh event data
    info('Tickets purchased successfully!');
  };

  const handleBack = () => {
    navigate('/events');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailabilityStatus = () => {
    if (!event.maxAttendees) return 'Open';

    const available = event.maxAttendees - event.currentAttendees;
    if (available <= 0) return 'Sold Out';
    if (available <= 10) return `${available} spots left`;
    return `${available} spots available`;
  };

  const isEventFull = event?.maxAttendees && event.currentAttendees >= event.maxAttendees;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-96 bg-white/5 rounded-2xl mb-8"></div>
          <div className="space-y-4">
            <div className="h-8 bg-white/10 rounded"></div>
            <div className="h-6 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-neutral mb-4">Event Not Found</h2>
        <p className="text-neutral/70 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={handleBack}
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center space-x-2 text-neutral/70 hover:text-neutral transition-colors duration-200 mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back to Events</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          <div className="relative rounded-2xl overflow-hidden">
            {event.image ? (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Calendar size={64} className="text-primary/40" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors duration-200">
                <Heart size={20} className="text-white" />
              </button>
              <button className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors duration-200">
                <Share2 size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Event Info */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-neutral">{event.title}</h1>
              <div className="flex items-center space-x-1 text-2xl font-bold text-secondary">
                <DollarSign size={24} />
                <span>{event.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Organizer */}
            <div className="text-neutral/70">
              Organized by <span className="text-primary font-medium">{event.organizerId?.name || 'Unknown Organizer'}</span>
            </div>

            {/* Date and Time */}
            <div className="flex items-center space-x-4 text-neutral/80">
              <Calendar size={20} className="text-primary" />
              <div>
                <div className="font-medium">{formatDate(event.date)}</div>
                <div className="text-sm">{formatTime(event.date)}</div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-4 text-neutral/80">
              <MapPin size={20} className="text-secondary" />
              <div className="font-medium">{event.location}</div>
            </div>

            {/* Attendees */}
            {event.maxAttendees && (
              <div className="flex items-center space-x-4 text-neutral/80">
                <Users size={20} className="text-purple-400" />
                <div className="font-medium">
                  {event.currentAttendees}/{event.maxAttendees} attendees
                  <span className="text-sm ml-2">({getAvailabilityStatus()})</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-neutral mb-4">About This Event</h2>
              <div className="text-neutral/80 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-neutral/70 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/10 text-neutral/70 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-bold text-neutral mb-4">Get Tickets</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-neutral/70">Price per ticket</span>
                <span className="text-xl font-bold text-secondary">
                  ${event.price.toFixed(2)}
                </span>
              </div>

              {event.maxAttendees && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral/70">Available</span>
                  <span className={`font-medium ${
                    isEventFull ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {getAvailabilityStatus()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handlePurchaseClick}
              disabled={isEventFull}
              className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                isEventFull
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {isEventFull ? 'Sold Out' : 'Purchase Tickets'}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-neutral/50">
                Secure payment powered by Stripe
              </p>
            </div>

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-neutral/80">Instant ticket delivery</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-neutral/80">QR code verification</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-neutral/80">Secure blockchain auth</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <TicketPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          event={event}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default EventDetail;
