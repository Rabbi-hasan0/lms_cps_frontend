// app/dashboard/student/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  Mail,
  BookOpen,
  Award,
  Loader2,
  ShieldCheck,
  Calendar,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react';

export default function StudentProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ enrolledCourses: 0, completedQuizzes: 0 });
  const [loading, setLoading] = useState(true);

  // পাসওয়ার্ড পরিবর্তনের স্টেট
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const userRes = await fetchApi('/users/me?populate=*', authHeader).catch(() => null);
        setUser(userRes);

        if (userRes?.id) {
          const [enrollRes, quizRes] = await Promise.all([
            fetchApi(`/enrollments?filters[user][id][$eq]=${userRes.id}`, authHeader).catch(() => null),
            fetchApi(`/quiz-results?filters[user][id][$eq]=${userRes.id}`, authHeader).catch(() => null),
          ]);

          const enrollmentsCount = Array.isArray(enrollRes?.data) ? enrollRes.data.length : Array.isArray(enrollRes) ? enrollRes.length : 0;
          const quizzesCount = Array.isArray(quizRes?.data) ? quizRes.data.length : Array.isArray(quizRes) ? quizRes.length : 0;

          setStats({
            enrolledCourses: enrollmentsCount,
            completedQuizzes: quizzesCount,
          });
        }
      } catch (err) {
        console.error('Failed to load student profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // পাসওয়ার্ড চেঞ্জ হ্যান্ডলার
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }

      // Strapi-এর স্ট্যান্ডার্ড পাসওয়ার্ড চেঞ্জ এন্ডপয়েন্ট
      await fetchApi('/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
          passwordConfirmation: confirmPassword,
        }),
      });

      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordMsg({ type: 'error', text: err?.message || 'Failed to change password. Check your current password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium">Loading student profile...</p>
      </div>
    );
  }

  return (
    /* 🎯 হোম পেজের মতো max-w-7xl উইডথ এবং প্যাডিং নিশ্চিত করা হলো */
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard/student/courses"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider">
              Account Settings
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Student Profile & Security
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Profile Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-800 pb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-emerald-600/20">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'S'}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {user?.username || 'Student User'}
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {user?.email || 'No email provided'}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Enrolled Courses</p>
                  <h3 className="text-2xl font-bold text-white mt-0.5">{stats.enrolledCourses}</h3>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Quizzes Completed</p>
                  <h3 className="text-2xl font-bold text-white mt-0.5">{stats.completedQuizzes}</h3>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Information</h3>
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 text-xs sm:text-sm">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-slate-400">Username</span>
                  <span className="text-white font-medium">{user?.username || 'N/A'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-slate-400">Email Address</span>
                  <span className="text-white font-medium">{user?.email || 'N/A'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-slate-400">Account Status</span>
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Change Password Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Password</h3>
                <p className="text-xs text-slate-400">Update your account security</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${
                  passwordMsg.type === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}