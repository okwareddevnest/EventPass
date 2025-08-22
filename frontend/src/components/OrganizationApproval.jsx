import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Building, Mail, Calendar, DollarSign } from 'lucide-react';
import { organizationsAPI } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const OrganizationApproval = () => {
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { success, error } = useNotification();

  useEffect(() => {
    fetchPendingOrganizations();
  }, []);

  const fetchPendingOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsAPI.getPendingApprovals();
      setPendingOrganizations(data.organizations);
    } catch (err) {
      console.error('Error fetching pending organizations:', err);
      error('Failed to load pending organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await organizationsAPI.approveOrganization(userId);
      success('Organization approved successfully');
      fetchPendingOrganizations(); // Refresh the list
    } catch (err) {
      console.error('Error approving organization:', err);
      error('Failed to approve organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, reason) => {
    setActionLoading(userId);
    try {
      await organizationsAPI.rejectOrganization(userId, reason);
      success('Organization rejected successfully');
      fetchPendingOrganizations(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting organization:', err);
      error('Failed to reject organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithReason = (userId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      handleReject(userId, reason);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral mb-2">Organization Approvals</h2>
        <p className="text-neutral/70">Review and approve pending organization registrations</p>
      </div>

      {pendingOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <Building size={48} className="mx-auto mb-4 text-neutral/30" />
          <h3 className="text-lg font-semibold text-neutral mb-2">No Pending Approvals</h3>
          <p className="text-neutral/70">All organization registrations have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrganizations.map((org) => (
            <div key={org._id} className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {org.organizationDetails?.orgLogo ? (
                    <img
                      src={org.organizationDetails.orgLogo}
                      alt={org.organizationDetails.orgName}
                      className="w-16 h-16 rounded-lg object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Building size={24} className="text-primary" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-neutral">
                        {org.organizationDetails?.orgName || 'Unknown Organization'}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                        Pending Approval
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-neutral/70">
                      <div className="flex items-center">
                        <Mail size={14} className="mr-2" />
                        {org.email}
                      </div>
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2" />
                        Applied: {new Date(org.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <DollarSign size={14} className="mr-2" />
                        Deposit: ${org.organizationDetails?.depositAmount || 0}
                        {org.organizationDetails?.depositPaid && (
                          <span className="ml-2 text-green-400">(Paid)</span>
                        )}
                      </div>
                    </div>

                    {org.organizationDetails?.orgDescription && (
                      <p className="text-neutral/70 text-sm mt-3 line-clamp-2">
                        {org.organizationDetails.orgDescription}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Show organization details modal or navigate to details page
                      console.log('View organization details:', org);
                    }}
                    className="p-2 text-neutral/70 hover:text-neutral hover:bg-white/10 rounded-lg transition-colors duration-200"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    onClick={() => handleRejectWithReason(org._id)}
                    disabled={actionLoading === org._id}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Reject Organization"
                  >
                    <XCircle size={18} />
                  </button>

                  <button
                    onClick={() => handleApprove(org._id)}
                    disabled={actionLoading === org._id}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    title="Approve Organization"
                  >
                    {actionLoading === org._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    ) : (
                      <CheckCircle size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationApproval;
