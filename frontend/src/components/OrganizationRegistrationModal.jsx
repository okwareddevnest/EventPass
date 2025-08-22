import React, { useState } from 'react';
import { X, Upload, DollarSign, Calendar, MapPin, Users } from 'lucide-react';
import apiService, { organizationsAPI } from '../services/api';

const OrganizationRegistrationModal = ({ isOpen, onClose, userEmail }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    orgDescription: '',
    orgWebsite: '',
    orgPhone: '',
    orgAddress: '',
    orgLogo: null,
    depositAmount: 100, // Default deposit amount
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        orgLogo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload logo if provided
      let logoUrl = null;
      if (formData.orgLogo) {
        try {
          const formDataWithFile = new FormData();
          formDataWithFile.append('logo', formData.orgLogo);

          const uploadResponse = await organizationsAPI.uploadLogo(formDataWithFile);
          logoUrl = uploadResponse.logoUrl;
        } catch (uploadError) {
          console.warn('Logo upload failed, continuing without logo:', uploadError);
          // Continue registration without logo
        }
      }

      // Submit organization registration
      const registrationData = {
        orgName: formData.orgName,
        orgDescription: formData.orgDescription,
        orgWebsite: formData.orgWebsite,
        orgPhone: formData.orgPhone,
        orgAddress: formData.orgAddress,
        orgLogo: logoUrl,
        depositAmount: formData.depositAmount,
      };

      const response = await organizationsAPI.register(registrationData);

      // Show success message and close modal
      alert('Organization registration submitted successfully! An admin will review your application.');
      onClose();

      // If payment URL exists, redirect to payment
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }

    } catch (err) {
      console.error('Organization registration error:', err);
      setError(err.message || 'Failed to register organization');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral">Register as Organization</h2>
          <button
            onClick={onClose}
            className="text-neutral/70 hover:text-neutral transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral flex items-center">
              <Users size={20} className="mr-2 text-primary" />
              Organization Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Email (Auto-filled from login)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral/70 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral/70 mb-2">
                Organization Description *
              </label>
              <textarea
                name="orgDescription"
                value={formData.orgDescription}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Describe your organization and what kind of events you organize"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="orgWebsite"
                  value={formData.orgWebsite}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral/70 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="orgPhone"
                  value={formData.orgPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral/70 mb-2">
                Address *
              </label>
              <textarea
                name="orgAddress"
                value={formData.orgAddress}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-neutral placeholder-neutral/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Full address of your organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral/70 mb-2">
                Organization Logo
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto mb-2 text-neutral/50" />
                  <p className="text-neutral/70">
                    {formData.orgLogo ? formData.orgLogo.name : 'Click to upload logo'}
                  </p>
                  <p className="text-xs text-neutral/50 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Deposit Information */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-neutral mb-3 flex items-center">
              <DollarSign size={20} className="mr-2 text-primary" />
              Organization Deposit
            </h3>
            <p className="text-neutral/70 text-sm mb-3">
              To become an approved organization, you need to pay a deposit of <strong className="text-primary">${formData.depositAmount}</strong>.
              This deposit will be held until your first event is approved and will be refunded if your organization is not approved.
            </p>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-neutral/70">
                <strong>Deposit Amount:</strong> ${formData.depositAmount}
              </p>
              <p className="text-xs text-neutral/50 mt-1">
                This amount will be processed via secure payment gateway
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-200 mb-2">Terms & Conditions</h3>
            <ul className="text-xs text-yellow-200/80 space-y-1">
              <li>• Organization approval is subject to admin review</li>
              <li>• Deposit will be held until first event approval</li>
              <li>• Refund policy applies if organization is not approved</li>
              <li>• All events must comply with platform guidelines</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-neutral/70 hover:text-neutral transition-colors"
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
                  Processing...
                </>
              ) : (
                <>
                  <Users size={20} className="mr-2" />
                  Register Organization
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationRegistrationModal;
