// app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [user, setUser] = useState<{ username?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalRevenue: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);

        const authHeader = { Authorization: `Bearer ${token}` };

        // ১. সেফ ইউজার ফেচিং
        let studentsCount = 0;
        let instructorsCount = 0;
        try {
          const usersRes = await fetchApi('/users?populate=role', {
            headers: authHeader,
          });
          if (Array.isArray(usersRes)) {
            const students = usersRes.filter(
              (u: any) =>
                u.role?.name?.toLowerCase() === 'student' ||
                u.role?.name?.toLowerCase() === 'authenticated'
            );
            const instructors = usersRes.filter((u: any) =>
              u.role?.name?.toLowerCase().includes('instructor')
            );
            studentsCount = students.length;
            instructorsCount = instructors.length;
          }
        } catch (userErr) {
          console.warn('Users permission notice:', userErr);
        }

        // ২. কোর্স ফেচিং
        let coursesCount = 0;
        let revenue = 0;
        try {
          const coursesRes = await fetchApi('/courses?populate=*', {
            headers: authHeader,
          });
          const coursesList = coursesRes.data || [];
          coursesCount = coursesList.length;
          revenue = coursesList.reduce(
            (sum: number, c: any) => sum + Number(c.price || 0),
            0
          );
        } catch (courseErr) {
          console.warn('Course fetch notice:', courseErr);
        }

        // ৩. এনরোলমেন্ট ফেচিং
        let enrollmentsList: any[] = [];
        try {
          const enrollRes = await fetchApi('/enrollments?populate=*&sort=createdAt:desc', {
            headers: authHeader,
          });
          if (enrollRes.data) {
            enrollmentsList = enrollRes.data.map((item: any) => ({
              id: item.id,
              studentName: item.user?.username || item.student?.username || 'Student',
              courseTitle: item.course?.title || 'Course',
              amount: item.price || item.course?.price || 0,
              status: item.status || 'Completed',
              createdAt: new Date(item.createdAt).toLocaleDateString(),
            }));
          }
        } catch {}

        setStats({
          totalStudents: studentsCount,
          totalInstructors: instructorsCount,
          totalCourses: coursesCount,
          totalRevenue: revenue,
        });

        setRecentEnrollments(enrollmentsList);
      } catch (err) {
        console.error('Overview general error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const statCards = [
    { title: 'Total Students', count: stats.totalStudents, change: '+Active', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Total Instructors', count: stats.totalInstructors, change: '+Active', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Total Courses', count: stats.totalCourses, change: 'Live', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Total Revenue', count: `$${stats.totalRevenue}`, change: 'Gross', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 p-6 rounded-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome back, {user?.username || 'Admin'} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time LMS performance analytics & operations.
        </p>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
            >
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {loading ? '...' : stat.count}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 📋 Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Recent Enrollments</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {recentEnrollments.length > 0 ? (
                  recentEnrollments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-medium text-white">{item.studentName}</td>
                      <td className="py-3 text-slate-300">{item.courseTitle}</td>
                      <td className="py-3 font-semibold text-indigo-400">${item.amount}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 text-xs text-right">{item.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                      {loading ? 'Fetching records...' : 'No enrollments found yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4">System Overview</h2>
            <p className="text-xs text-slate-400">All core services are synced with Strapi backend.</p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>API Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Strapi Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}