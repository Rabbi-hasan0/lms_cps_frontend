// app/dashboard/admin/roles/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  Shield,
  ShieldCheck,
  Users,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  X,
  Mail,
  Calendar,
} from 'lucide-react';

interface UserItem {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  blocked: boolean;
  confirmed: boolean;
  createdAt: string;
  role?: {
    id: number;
    name: string;
    type: string;
    description?: string;
  };
}

interface RoleItem {
  id: number;
  name: string;
  type: string;
  description?: string;
}

export default function RolesAndPermissionsPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Role Edit Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<number | string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete / Block Confirmation Modal
  const [userToAction, setUserToAction] = useState<UserItem | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsersAndRoles = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // ১. ইউজার ও রোলস ডেটা ফেচ
      const [usersRes, rolesRes] = await Promise.all([
        fetchApi('/users?populate=role', { headers }).catch(() => []),
        fetchApi('/users-permissions/roles', { headers }).catch(() => ({ roles: [] })),
      ]);

      setUsers(Array.isArray(usersRes) ? usersRes : []);
      
      const availableRoles = rolesRes?.roles || (Array.isArray(rolesRes) ? rolesRes : []);
      setRoles(availableRoles);
    } catch (err) {
      console.error('Failed to load roles/users data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsersAndRoles();
  }, [loadUsersAndRoles]);

  // রোল আপডেট সাবমিশন
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !selectedNewRole) return;

    setIsUpdatingRole(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetchApi(`/users/${editingUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          role: Number(selectedNewRole),
        }),
      });

      setEditingUser(null);
      await loadUsersAndRoles();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ব্লক / আনব্লক / ডিলিট নিশ্চিতকরণ
  const handleConfirmAction = async () => {
    if (!userToAction || !actionType) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (actionType === 'delete') {
        await fetchApi(`/users/${userToAction.id}`, {
          method: 'DELETE',
          headers,
        });
      } else if (actionType === 'block' || actionType === 'unblock') {
        await fetchApi(`/users/${userToAction.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            blocked: actionType === 'block',
          }),
        });
      }

      setUserToAction(null);
      setActionType(null);
      await loadUsersAndRoles();
    } catch (err: any) {
      alert(err.message || `Failed to ${actionType} user`);
    } finally {
      setActionLoading(false);
    }
  };

  // সার্চ এবং রোল ফিল্টারিং
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const userRoleName = user.role?.type?.toLowerCase() || user.role?.name?.toLowerCase() || '';
    const matchesRole =
      selectedRoleFilter === 'all' || userRoleName === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (roleType?: string) => {
    const type = (roleType || '').toLowerCase();
    if (type.includes('admin')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    if (type.includes('instructor') || type.includes('teacher')) {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading users & permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            Roles & Permissions Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user accounts, assign roles (Admin, Instructor, Student), and control access permissions.
          </p>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
            Total Accounts: <span className="text-white font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Role Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Admins</p>
            <p className="text-lg font-bold text-white">
              {users.filter((u) => u.role?.name?.toLowerCase().includes('admin')).length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Instructors / Teachers</p>
            <p className="text-lg font-bold text-white">
              {users.filter((u) => (u.role?.name?.toLowerCase().includes('instructor') || u.role?.name?.toLowerCase().includes('teacher'))).length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Students / Authenticated</p>
            <p className="text-lg font-bold text-white">
              {users.filter((u) => (!u.role?.name?.toLowerCase().includes('admin') && !u.role?.name?.toLowerCase().includes('instructor'))).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.type || r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="pb-3.5 font-semibold">User Profile</th>
                  <th className="pb-3.5 font-semibold">Assigned Role</th>
                  <th className="pb-3.5 font-semibold">Status</th>
                  <th className="pb-3.5 font-semibold">Joined Date</th>
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const roleName = user.role?.name || 'Authenticated';
                  const isBlocked = user.blocked;

                  return (
                    <tr key={user.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">{user.username}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border ${getRoleBadgeStyle(
                            user.role?.type || roleName
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {roleName}
                        </span>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            !isBlocked
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {!isBlocked ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {!isBlocked ? 'Active' : 'Blocked'}
                        </span>
                      </td>

                      <td className="py-3.5 text-xs text-slate-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setSelectedNewRole(user.role?.id || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                            title="Change Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Block/Unblock Button */}
                          <button
                            onClick={() => {
                              setUserToAction(user);
                              setActionType(isBlocked ? 'unblock' : 'block');
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              isBlocked
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-amber-400 hover:bg-amber-500/10'
                            }`}
                            title={isBlocked ? 'Unblock User' : 'Block User'}
                          >
                            {isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setUserToAction(user);
                              setActionType('delete');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-14 text-slate-500 text-xs">
            No users found matching your search and filter criteria.
          </div>
        )}
      </div>

      {/* 🛠️ MODAL: CHANGE USER ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Change User Role</h3>
                <p className="text-xs text-slate-400">{editingUser.username} ({editingUser.email})</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select New Role *
                </label>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition ${
                        Number(selectedNewRole) === role.id
                          ? 'bg-indigo-600/10 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="role"
                          value={role.id}
                          checked={Number(selectedNewRole) === role.id}
                          onChange={() => setSelectedNewRole(role.id)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-semibold">{role.name}</p>
                          {role.description && (
                            <p className="text-[10px] text-slate-400">{role.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {role.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center gap-2"
                >
                  {isUpdatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ ACTION CONFIRMATION MODAL (Block / Unblock / Delete) */}
      {userToAction && actionType && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3.5 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">
                  {actionType} User Account
                </h3>
                <p className="text-xs text-slate-400">Please confirm your action</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to <span className="font-bold text-white">{actionType}</span>{' '}
              <span className="font-semibold text-white">&quot;{userToAction.username}&quot;</span>?
              {actionType === 'delete' && ' This will permanently remove the account from LMS.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUserToAction(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition disabled:opacity-50 ${
                  actionType === 'unblock'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span className="capitalize">{actionType}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}