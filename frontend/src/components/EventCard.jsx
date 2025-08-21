import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const isEventFull = event.maxAttendees && event.currentAttendees >= event.maxAttendees;
  const isUpcoming = new Date(event.date) > new Date();

  return (
    <Link
      to={`/events/${event._id}`}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Calendar size={48} className="text-primary/40" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isEventFull
              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
              : isUpcoming
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          }`}>
            {isEventFull ? 'Sold Out' : isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>

        {/* Availability Badge */}
        {!isEventFull && event.maxAttendees && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {getAvailabilityStatus()}
            </span>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-neutral mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {event.title}
        </h3>

        <p className="text-sm text-neutral/70 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2">
          {/* Date and Time */}
          <div className="flex items-center text-sm text-neutral/80">
            <Calendar size={16} className="mr-2 text-primary" />
            <span>
              {formatDate(event.date)} at {formatTime(event.date)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-neutral/80">
            <MapPin size={16} className="mr-2 text-secondary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

          {/* Attendees */}
          {event.maxAttendees && (
            <div className="flex items-center text-sm text-neutral/80">
              <Users size={16} className="mr-2 text-purple-400" />
              <span>
                {event.currentAttendees}/{event.maxAttendees} attendees
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-lg font-bold text-secondary">
              <DollarSign size={18} />
              <span>{event.price.toFixed(2)}</span>
            </div>

            <div className="text-xs text-neutral/60">
              by {event.organizerId?.name || 'Unknown Organizer'}
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </Link>
  );
};

export default EventCard;
