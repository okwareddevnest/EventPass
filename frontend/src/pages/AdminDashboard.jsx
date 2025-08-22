import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import OrganizationApproval from '../components/OrganizationApproval';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  Crown,
  Activity,
  BarChart3,
  Settings,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  Server,
  Database,
  Clock,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { error: showError, success } = useNotification();

  const [activeTab, setActiveTab] = useState('overview');
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({});
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [roleRequests, setRoleRequests] = useState([]);
  const [showRoleRequestModal, setShowRoleRequestModal] = useState(false);
  const [selectedRoleRequest, setSelectedRoleRequest] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUserList(usersData.users);
        setStats(usersData.stats);
      }

      // Fetch system stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData);
      }

      // Fetch role requests
      const roleRequestsResponse = await fetch('/api/admin/role-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (roleRequestsResponse.ok) {
        const roleRequestsData = await roleRequestsResponse.json();
        setRoleRequests(roleRequestsData.roleRequests);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        success('User role updated successfully');
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      showError('Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      showError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        success('User deleted successfully');
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showError('Failed to delete user');
    }
  };

  const handleRoleRequestReview = async (requestId, status, reviewNotes = '') => {
    try {
      const response = await fetch(`/api/admin/role-requests/${requestId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reviewNotes }),
      });

      if (response.ok) {
        success(`Role request ${status} successfully`);
        setShowRoleRequestModal(false);
        setSelectedRoleRequest(null);
        fetchDashboardData(); // Refresh data
      } else {
        const errorData = await response.json();
        showError(errorData.message || `Failed to ${status} role request`);
      }
    } catch (err) {
      console.error('Error reviewing role request:', err);
      showError(`Failed to ${status} role request`);
    }
  };

  const filteredUsers = userList.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield size={48} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral mb-4">Access Denied</h2>
        <p className="text-neutral/70 mb-6">You need administrator privileges to access this dashboard.</p>
        <Link
          to="/"
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white/5 rounded-2xl p-6">
                <div className="h-8 bg-white/10 rounded mb-2"></div>
                <div className="h-6 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral">Admin Dashboard</h1>
            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-200 border border-red-500/30">
              <Crown size={12} className="text-red-400" />
              <span>System Admin</span>
            </div>
          </div>
          <p className="text-neutral/70">Manage users and monitor system performance</p>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateUser(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <UserPlus size={20} />
            <span>Create User</span>
          </button>
          <Link
            to="/profile"
            className="bg-white/5 border border-white/10 text-neutral px-6 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-2"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'userManagement', label: 'User Management', icon: UsersIcon },
          { id: 'organizations', label: 'Organizations', icon: Shield },
          { id: 'roleRequests', label: 'Role Requests', icon: FileText },
          { id: 'system', label: 'System Monitor', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg'
                : 'text-neutral/70 hover:text-neutral hover:bg-white/10'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral/70 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-neutral">
                    {(stats.attendee || 0) + (stats.organizer || 0) + (stats.admin || 0)}
                  </p>
                </div>
                <UsersIcon size={32} className="text-primary" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral/70 text-sm">Active Events</p>
                  <p className="text-3xl font-bold text-neutral">{systemStats.events?.published || 0}</p>
                </div>
                <Calendar size={32} className="text-secondary" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral/70 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-neutral">
                    ${systemStats.revenue?.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <DollarSign size={32} className="text-green-400" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral/70 text-sm">System Uptime</p>
                  <p className="text-3xl font-bold text-neutral">
                    {systemStats.systemInfo ? Math.floor(systemStats.systemInfo.uptime / 3600) : 0}h
                  </p>
                </div>
                <Server size={32} className="text-purple-400" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-neutral mb-4 flex items-center space-x-2">
                <Activity size={20} className="text-primary" />
                <span>Recent Activity (30 days)</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">New Users</span>
                  <span className="text-neutral font-semibold">{systemStats.recentActivity?.users || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">New Events</span>
                  <span className="text-neutral font-semibold">{systemStats.recentActivity?.events || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">Tickets Sold</span>
                  <span className="text-neutral font-semibold">{systemStats.recentActivity?.tickets || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-neutral mb-4 flex items-center space-x-2">
                <FileText size={20} className="text-secondary" />
                <span>System Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">Node Version</span>
                  <span className="text-neutral font-mono text-sm">{systemStats.systemInfo?.version || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">Platform</span>
                  <span className="text-neutral font-mono text-sm">{systemStats.systemInfo?.platform || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-neutral/70">Memory Usage</span>
                  <span className="text-neutral font-mono text-sm">
                    {systemStats.systemInfo?.memory ?
                      `${Math.round(systemStats.systemInfo.memory.rss / 1024 / 1024)}MB` :
                      'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Requests Tab */}
      {activeTab === 'roleRequests' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-neutral">Role Requests Management</h2>
              <p className="text-neutral/70">Review and manage role escalation requests</p>
            </div>

            <div className="divide-y divide-white/10">
              {roleRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={48} className="text-neutral/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral mb-2">No role requests</h3>
                  <p className="text-neutral/70">No pending role requests to review</p>
                </div>
              ) : (
                roleRequests.map((request) => (
                  <div key={request._id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral">
                            {request.userId?.name || 'Unknown User'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-200' :
                            request.status === 'approved' ? 'bg-green-500/20 text-green-200' :
                            'bg-red-500/20 text-red-200'
                          }`}>
                            {request.status}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-200">
                            Requesting: {request.requestedRole}
                          </span>
                        </div>

                        <p className="text-neutral/70 text-sm mb-2">{request.reason}</p>

                        <div className="flex items-center space-x-4 text-sm text-neutral/60">
                          <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                          {request.reviewedAt && (
                            <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        {request.reviewNotes && (
                          <div className="mt-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-neutral/70">
                              <strong>Review Notes:</strong> {request.reviewNotes}
                            </p>
                            {request.reviewedBy && (
                              <p className="text-xs text-neutral/50 mt-1">
                                Reviewed by: {request.reviewedBy.name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRoleRequest(request);
                                setShowRoleRequestModal(true);
                              }}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors duration-200"
                              title="Review Request"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleRoleRequestReview(request._id, 'approved')}
                              className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors duration-200"
                              title="Approve Request"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleRoleRequestReview(request._id, 'rejected')}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                              title="Reject Request"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          <OrganizationApproval />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'userManagement' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral/50" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="organizer">Organizer</option>
                <option value="attendee">Attendee</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-neutral">User Management</h2>
              <p className="text-neutral/70">Manage user accounts and permissions</p>
            </div>

            <div className="divide-y divide-white/10">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <UsersIcon size={48} className="text-neutral/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral mb-2">No users found</h3>
                  <p className="text-neutral/70">Try adjusting your search or filter criteria</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user._id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral">{user.name}</h3>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-200 border-red-500/30' :
                            user.role === 'organizer' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-200 border-blue-500/30'
                          }`}>
                            {user.role === 'admin' && <Crown size={10} />}
                            {user.role === 'organizer' && <Shield size={10} />}
                            {user.role === 'attendee' && <UsersIcon size={10} />}
                            <span className="capitalize">{user.role}</span>
                          </div>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                            user.isActive ? 'bg-green-500/20 text-green-200 border-green-500/30' :
                            'bg-red-500/20 text-red-200 border-red-500/30'
                          }`}>
                            {user.isActive ? <UserCheck size={10} /> : <UserX size={10} />}
                            <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>

                        <p className="text-neutral/70 text-sm mb-2">{user.email}</p>
                        <p className="text-neutral/60 text-sm">
                          Member since {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {user._id !== localStorage.getItem('userId') && (
                          <>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="px-3 py-1 bg-white/5 border border-white/20 rounded text-sm text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              <option value="attendee">Attendee</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Admin</option>
                            </select>

                            <button
                              onClick={() => handleStatusToggle(user._id, !user.isActive)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                user.isActive
                                  ? 'text-red-400 hover:bg-red-500/20'
                                  : 'text-green-400 hover:bg-green-500/20'
                              }`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral mb-4 flex items-center space-x-2">
              <Database size={20} className="text-primary" />
              <span>Database Status</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-neutral/70 text-sm">Users</p>
                <p className="text-2xl font-bold text-neutral">
                  {(stats.attendee || 0) + (stats.organizer || 0) + (stats.admin || 0)}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-neutral/70 text-sm">Events</p>
                <p className="text-2xl font-bold text-neutral">
                  {(systemStats.events?.published || 0) + (systemStats.events?.draft || 0) + (systemStats.events?.cancelled || 0)}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-neutral/70 text-sm">Tickets</p>
                <p className="text-2xl font-bold text-neutral">
                  {(systemStats.tickets?.valid || 0) + (systemStats.tickets?.used || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-neutral mb-4 flex items-center space-x-2">
              <AlertTriangle size={20} className="text-yellow-400" />
              <span>System Health</span>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="text-neutral">Server Status</span>
                <span className="text-green-400 font-semibold">Online</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-neutral">Database Connection</span>
                <span className="text-blue-400 font-semibold">Connected</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-neutral">Last Backup</span>
                <span className="text-neutral/70">Never (Configure backups)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            fetchDashboardData();
            success('User created successfully');
          }}
        />
      )}

      {/* Role Request Review Modal */}
      {showRoleRequestModal && selectedRoleRequest && (
        <RoleRequestReviewModal
          roleRequest={selectedRoleRequest}
          onClose={() => {
            setShowRoleRequestModal(false);
            setSelectedRoleRequest(null);
          }}
          onReview={handleRoleRequestReview}
        />
      )}
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
  const { error: showError, success } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'organizer',
    phone: '',
    walletAddress: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      showError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-neutral mb-4">Create New User</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="organizer">Event Organizer</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
              placeholder="0x..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Role Request Review Modal Component
const RoleRequestReviewModal = ({ roleRequest, onClose, onReview }) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onReview(roleRequest._id, 'approved', reviewNotes);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReview(roleRequest._id, 'rejected', reviewNotes);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold text-neutral mb-4 flex items-center space-x-2">
          <FileText size={20} className="text-blue-400" />
          <span>Review Role Request</span>
        </h3>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-neutral mb-2">Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral/70">User:</span>
                <p className="text-neutral font-medium">{roleRequest.userId?.name}</p>
                <p className="text-neutral/70 text-xs">{roleRequest.userId?.email}</p>
              </div>
              <div>
                <span className="text-neutral/70">Current Role:</span>
                <p className="text-neutral font-medium capitalize">{roleRequest.userId?.role}</p>
              </div>
              <div className="col-span-2">
                <span className="text-neutral/70">Requested Role:</span>
                <p className="text-neutral font-medium capitalize">{roleRequest.requestedRole}</p>
              </div>
            </div>
          </div>

          {/* Request Reason */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-neutral mb-2">Reason for Request</h4>
            <p className="text-neutral/70 text-sm">{roleRequest.reason}</p>
          </div>

          {/* Review Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral/70 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-neutral focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Reject Request'}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-200 rounded-lg hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Approve Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
