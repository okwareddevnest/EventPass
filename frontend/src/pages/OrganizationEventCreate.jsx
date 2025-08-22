import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { eventsAPI } from '../services/api';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Upload,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

const OrganizationEventCreate = () => {
  const { user } = useAuth();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    maxAttendees: '',
    tags: [],
    image: null,
    eventPeriod: {
      startTime: '',
      endTime: '',
      duration: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.date || !formData.location || !formData.price) {
        showError('Please fill in all required fields');
        return;
      }

      // Validate date is in the future
      const eventDate = new Date(formData.date);
      if (eventDate <= new Date()) {
        showError('Event date must be in the future');
        return;
      }

      // Prepare event data
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: eventDate.toISOString(),
        location: formData.location.trim(),
        price: parseFloat(formData.price),
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        tags: formData.tags,
        eventPeriod: formData.eventPeriod
      };

      // Handle image upload if provided
      if (formData.image) {
        const formDataWithFile = new FormData();
        formDataWithFile.append('image', formData.image);

        // Note: You'll need to implement the image upload endpoint
        // const uploadResponse = await eventsAPI.uploadImage(formDataWithFile);
        // eventData.image = uploadResponse.imageUrl;
      }

      const response = await eventsAPI.createEvent(eventData);

      success('Event created successfully!');
      navigate('/organization');

    } catch (err) {
      console.error('Error creating event:', err);
      showError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/organization');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-accent p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-neutral/70 hover:text-neutral transition-colors duration-200 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral">Create New Event</h1>
              <p className="text-neutral/70 mt-1">Fill in the details to create your event</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-6 flex items-center">
              <Calendar size={20} className="mr-2 text-primary" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter event title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Event Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Describe your event in detail"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Event Date *
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Venue address or location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Price per Ticket *
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Maximum Attendees
                </label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Period */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-6 flex items-center">
              <Clock size={20} className="mr-2 text-secondary" />
              Event Timing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  name="eventPeriod.startTime"
                  value={formData.eventPeriod.startTime}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="eventPeriod.endTime"
                  value={formData.eventPeriod.endTime}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  name="eventPeriod.duration"
                  value={formData.eventPeriod.duration}
                  onChange={handleInputChange}
                  min="0.5"
                  step="0.5"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          {/* Categories/Tags */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-6 flex items-center">
              <MapPin size={20} className="mr-2 text-purple-400" />
              Categories & Tags
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Add Tags
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Add a tag (e.g., music, tech, conference)"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-400 transition-colors duration-200"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Event Image */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-neutral mb-6 flex items-center">
              <Upload size={20} className="mr-2 text-green-400" />
              Event Image
            </h2>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="event-image"
              />
              <label htmlFor="event-image" className="cursor-pointer">
                <Upload size={32} className="mx-auto mb-2 text-neutral/50" />
                <p className="text-neutral/70">
                  {formData.image ? formData.image.name : 'Click to upload event image'}
                </p>
                <p className="text-xs text-neutral/50 mt-1">
                  PNG, JPG up to 5MB (optional)
                </p>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleBack}
              className="px-8 py-3 text-neutral/70 hover:text-neutral transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Event...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationEventCreate;
