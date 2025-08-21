import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin } from 'lucide-react';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import { useAuth } from '../contexts/AuthContext';

const Events = () => {
  const { isAuthenticated, isOrganizer } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    price: '',
  });
  const [pagination, setPagination] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, filters]);

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: searchTerm,
        ...filters,
      });

      const response = await fetch(`/api/events?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadMore = () => {
    if (pagination.hasNext) {
      fetchEvents(pagination.currentPage + 1);
    }
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    fetchEvents(1); // Refresh events list
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral mb-2">Discover Events</h1>
          <p className="text-neutral/70">Find and attend amazing events near you</p>
        </div>

        {isAuthenticated && isOrganizer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Create Event
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none"
            >
              <option value="">All Categories</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="concert">Concert</option>
              <option value="sports">Sports</option>
              <option value="theater">Theater</option>
              <option value="networking">Networking</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
          </div>

          <div className="relative">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <Calendar size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
          </div>

          <div className="relative">
            <select
              value={filters.price}
              onChange={(e) => handleFilterChange('price', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none"
            >
              <option value="">All Prices</option>
              <option value="0-25">Free - $25</option>
              <option value="25-50">$25 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-999999">Over $100</option>
            </select>
            <MapPin size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading && events.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-48 bg-white/5 rounded-t-2xl"></div>
              <div className="p-6 bg-white/5 rounded-b-2xl">
                <div className="h-6 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasNext && !loading && (
        <div className="text-center mt-12">
          <button
            onClick={loadMore}
            className="px-8 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
          >
            Load More Events
          </button>
        </div>
      )}

      {/* No Events Message */}
      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar size={48} className="text-neutral/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral mb-2">No events found</h3>
          <p className="text-neutral/70 mb-6">
            {searchTerm || filters.category || filters.date || filters.price
              ? 'Try adjusting your search criteria'
              : 'Be the first to create an amazing event!'}
          </p>
          {isAuthenticated && isOrganizer && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Create Event
            </button>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
};

export default Events;
