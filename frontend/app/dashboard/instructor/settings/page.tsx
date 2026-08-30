'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  KeyRound,
  UserCheck,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
} from 'lucide-react';

export default function InstructorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [userId, setUserId] = useState<number | string | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Instructor');
  const [memberSince, setMemberSince] = useState('N/A');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const me = await fetchApi('/users/me?populate=role', { headers });

      if (me) {
        setUserId(me.id);
        setUsername(me.username || '');
        setEmail(me.email || '');
        setRoleName(me.role?.name || me.role?.type || 'Instructor');
        if (me.createdAt) {
          setMemberSince(
            new Date(me.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          );
        }
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!username.trim() || !email.trim()) {
      setProfileError('Username and Email cannot be empty');
      return;
    }

    try {
      setSavingProfile(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
        }),
      });

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          parsed.username = username.trim();
          parsed.email = email.trim();
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch (_) {}
      }

      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetchApi('/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
          passwordConfirmation: confirmPassword,
        }),
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Current password incorrect or update failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading instructor settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 lg:space-y-8 pb-10">
      {/* Page Header with Gradient Accents */}
      <div className="relative overflow-hidden bg-[#0b101b] border border-slate-800/80 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                Control Panel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
              Account & Security Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your personal instructor profile, authentication credentials, and system preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Instructor Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full Width Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Profile Card & Quick Info (4 Cols on Desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center space-y-5 shadow-xl">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center border-4 border-slate-900 shadow-2xl shadow-indigo-600/30">
                {username.charAt(0).toUpperCase() || 'I'}
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="w-full">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate px-2">{username}</h3>
              <p className="text-xs sm:text-sm text-slate-400 truncate px-2 mt-0.5">{email}</p>
            </div>

            <div className="w-full pt-5 border-t border-slate-800/80 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#060a12] border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Account Role
                </span>
                <span className="font-semibold text-white uppercase text-[11px] bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg">
                  {roleName}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#060a12] border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Status
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#060a12] border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Joined Date
                </span>
                <span className="text-slate-300 font-medium">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Helper Card */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Instructor Perks
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Publish unlimited classes & update lectures anytime</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Create exam question sets & review student papers</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Track student progress for assigned courses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms Section (8 Cols on Desktop) */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6 lg:space-y-8">
          {/* Section 1: Profile Information */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <User className="w-5 h-5 text-indigo-400" />
                  Profile Details
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your public username and registered email address
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="instructor@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password & Security */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  Security & Password
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Keep your account secure by using a strong combination of characters
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Current Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Confirm New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition flex items-center gap-2 border border-slate-700 disabled:opacity-50"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{savingPassword ? 'Updating Security...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}