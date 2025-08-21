import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Modal from './Modal';
import FormField from './FormField';

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  const { user } = useAuth();
  const { success, error } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    price: '',
    maxAttendees: '',
    image: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const eventDate = new Date(formData.date);
      const now = new Date();
      if (eventDate <= now) {
        newErrors.date = 'Event date must be in the future';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.maxAttendees && (isNaN(formData.maxAttendees) || parseInt(formData.maxAttendees) <= 0)) {
      newErrors.maxAttendees = 'Maximum attendees must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...formData,
        price: parseFloat(formData.price),
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const result = await response.json();
        success('Event created successfully!');
        onEventCreated(result.event);

        // Reset form
        setFormData({
          title: '',
          description: '',
          date: '',
          location: '',
          price: '',
          maxAttendees: '',
          image: '',
        });
        setErrors({});
      } else {
        const errorData = await response.json();
        error(errorData.message || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      error('Network error occurred while creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Event Title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          error={errors.title}
          placeholder="Enter event title"
          required
        />

        <FormField
          label="Description"
          type="textarea"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          error={errors.description}
          placeholder="Describe your event in detail"
          rows={4}
          required
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            label="Date & Time"
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            error={errors.date}
            required
          />

          <FormField
            label="Price ($)"
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            error={errors.price}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <FormField
          label="Location"
          type="text"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          error={errors.location}
          placeholder="Venue address or virtual meeting link"
          required
        />

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            label="Maximum Attendees"
            type="number"
            name="maxAttendees"
            value={formData.maxAttendees}
            onChange={handleInputChange}
            error={errors.maxAttendees}
            placeholder="Leave empty for unlimited"
            min="1"
          />

          <FormField
            label="Event Image URL"
            type="url"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            error={errors.image}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventModal;
