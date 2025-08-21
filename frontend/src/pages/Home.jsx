import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Shield, Zap, Users } from 'lucide-react';
import EventCard from '../components/EventCard';
import { eventsAPI } from '../services/api';

const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured events
    fetchFeaturedEvents();
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const data = await eventsAPI.getEvents({ limit: 6 });
      setFeaturedEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching featured events:', error);
      // Set empty array on error to prevent crashes
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EventPass
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral/80 mb-8 max-w-2xl mx-auto">
            The future of event ticketing with blockchain-powered verification and seamless payments
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/events"
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Explore Events
            </Link>
            <Link
              to="/auth"
              className="border border-white/20 text-neutral px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/5 transition-all duration-200"
            >
              Create Event
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral mb-2">Secure Verification</h3>
              <p className="text-neutral/70">Blockchain-powered ticket verification with Civic Auth</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap size={32} className="text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-neutral mb-2">Instant Access</h3>
              <p className="text-neutral/70">QR code tickets with instant validation at events</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral mb-2">Global Reach</h3>
              <p className="text-neutral/70">Connect with attendees worldwide with seamless payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-neutral mb-2">Featured Events</h2>
              <p className="text-neutral/70">Discover amazing events happening around you</p>
            </div>

            <Link
              to="/events"
              className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors duration-200"
            >
              <span>View All Events</span>
              <ArrowRight size={20} />
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}

          {featuredEvents.length === 0 && !loading && (
            <div className="text-center py-12">
              <Calendar size={48} className="text-neutral/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral mb-2">No events yet</h3>
              <p className="text-neutral/70 mb-6">Be the first to create an amazing event!</p>
              <Link
                to="/auth"
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Create Event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-neutral mb-4">
            Ready to create your next event?
          </h2>
          <p className="text-neutral/70 mb-8 text-lg">
            Join thousands of organizers who trust EventPass for seamless event management
          </p>
          <Link
            to="/auth"
            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
