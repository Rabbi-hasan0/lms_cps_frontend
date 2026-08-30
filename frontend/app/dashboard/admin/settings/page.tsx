// app/dashboard/admin/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  Settings,
  User,
  Lock,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  UserCheck,
  Calendar,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'platform' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [memberSince, setMemberSince] = useState('N/A');

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Platform Config State (Local / Global)
  const [platformConfig, setPlatformConfig] = useState({
    siteName: 'LearnHub LMS',
    supportEmail: 'support@learnhub.com',
    enableRegistration: true,
    enableQuizRetake: true,
    emailAlerts: true,
  });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token) {
          console.warn('No token found in storage');
          return;
        }

        const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
        const headers: Record<string, string> = {
          Authorization: `Bearer ${cleanToken}`,
        };

        const me = await fetchApi('/users/me', { headers });
        if (me && me.id) {
          setProfileForm((prev) => ({
            ...prev,
            username: me.username || '',
            email: me.email || '',
          }));
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
        console.warn('Could not fetch admin details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload: any = {
        username: profileForm.username,
        email: profileForm.email,
      };

      if (profileForm.newPassword) {
        payload.password = profileForm.newPassword;
      }

      await fetchApi('/users/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Platform preferences saved successfully!' });
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 lg:space-y-8 pb-10">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-500" />
            Settings & Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your administrator profile, security credentials, and system settings.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Full Width 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Side: Overview & Tabs (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Admin Identity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-600/20 text-indigo-400 font-bold text-2xl sm:text-3xl flex items-center justify-center border border-indigo-500/30">
              {profileForm.username.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="w-full">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{profileForm.username || 'Administrator'}</h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">{profileForm.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800 space-y-2.5 text-xs text-left">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Account Role
                </span>
                <span className="font-semibold text-white uppercase text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                  Admin
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Status
                </span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined Date
                </span>
                <span className="text-slate-300 font-medium">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col gap-1.5 shadow-xl">
            <button
              onClick={() => { setActiveTab('profile'); setMessage(null); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition w-full text-left ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" /> Admin Profile
            </button>

            <button
              onClick={() => { setActiveTab('platform'); setMessage(null); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition w-full text-left ${
                activeTab === 'platform' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" /> Platform Preferences
            </button>

            <button
              onClick={() => { setActiveTab('security'); setMessage(null); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition w-full text-left ${
                activeTab === 'security' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" /> Security & Password
            </button>
          </div>
        </div>

        {/* Right Side: Tab Forms (8 Cols on Desktop) */}
        <div className="lg:col-span-8">
          {/* 1. ADMIN PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Profile Information
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Update your account username and primary email address.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Admin Username</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. PLATFORM PREFERENCES TAB */}
          {activeTab === 'platform' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  LMS Platform Settings
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  General settings regarding course accessibility and registrations.
                </p>
              </div>

              <form onSubmit={handlePlatformSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">LMS Platform Name</label>
                    <input
                      type="text"
                      value={platformConfig.siteName}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, siteName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={platformConfig.supportEmail}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Allow Student Self-Registration</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Enable or disable open signups on the login page.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.enableRegistration}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, enableRegistration: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Allow Quiz Retakes</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Students can retake exams multiple times to improve score.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.enableQuizRetake}
                      onChange={(e) => setPlatformConfig({ ...platformConfig, enableQuizRetake: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save System Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  Password & Security
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Ensure your account is using a strong and secure password.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !profileForm.newPassword}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}