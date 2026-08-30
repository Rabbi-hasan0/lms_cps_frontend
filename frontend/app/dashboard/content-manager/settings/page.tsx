// app/dashboard/content-manager/settings/page.tsx
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
  Sparkles,
  KeyRound,
  FileEdit,
  EyeOff,
} from 'lucide-react';

export default function ContentManagerSettingsPage() {
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
    const loadUserData = async () => {
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
        console.warn('Could not fetch user details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
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

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-medium tracking-wide">Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 lg:space-y-8 pb-10">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Content Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 flex items-center gap-3">
              <Settings className="w-7 h-7 text-indigo-500" />
              Settings & Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your personal credentials, workspace preferences, and security settings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <FileEdit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editor Privilege</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium border shadow-lg animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Full Width Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Side: Profile Card & Tabs (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Identity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col items-center text-center space-y-4 shadow-xl">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-3xl flex items-center justify-center border-4 border-slate-950 shadow-lg shadow-indigo-600/20">
                {profileForm.username.charAt(0).toUpperCase() || 'C'}
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="w-full">
              <h3 className="text-base sm:text-lg font-bold text-white truncate px-2">
                {profileForm.username || 'Content Manager'}
              </h3>
              <p className="text-xs text-slate-400 truncate px-2 mt-0.5">{profileForm.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Assigned Role
                </span>
                <span className="font-semibold text-white uppercase text-[10px] bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  Content Manager
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Status
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                <span className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined
                </span>
                <span className="text-slate-300 font-medium">{memberSince}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col gap-1.5 shadow-xl">
            <button
              onClick={() => {
                setActiveTab('profile');
                setMessage(null);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition w-full text-left ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Your Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('platform');
                setMessage(null);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition w-full text-left ${
                activeTab === 'platform'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>Platform Preferences</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('security');
                setMessage(null);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition w-full text-left ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* Right Side: Tab Forms (8 Cols) */}
        <div className="lg:col-span-8">
          {/* 1. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Profile Information
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Update your account username and registered email address.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
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
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner"
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
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. PLATFORM PREFERENCES TAB (Read Only) */}
          {activeTab === 'platform' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 select-none">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    LMS Platform Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    General system settings regarding course accessibility and registrations.
                  </p>
                </div>
                <span className="px-3 py-1 text-[11px] font-semibold bg-slate-950 text-slate-400 border border-slate-800 rounded-lg flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" /> Read Only (Admin Only)
                </span>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-5 opacity-60 pointer-events-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">LMS Platform Name</label>
                    <input
                      type="text"
                      disabled
                      value={platformConfig.siteName}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Support Email</label>
                    <input
                      type="email"
                      disabled
                      value={platformConfig.supportEmail}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Allow Student Self-Registration</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                        Enable open accounts creation directly from the sign-up page
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      disabled
                      checked={platformConfig.enableRegistration}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">Allow Quiz Retakes</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                        Students can retake MCQ tests to improve score evaluation
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      disabled
                      checked={platformConfig.enableQuizRetake}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    disabled
                    className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-500 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Platform Settings (Disabled)</span>
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
                  Ensure your editor account is using a strong and secure password.
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !profileForm.newPassword}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
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