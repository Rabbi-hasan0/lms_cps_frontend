'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  BookOpen,
  HelpCircle,
  Users,
  Award,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Loader2,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function InstructorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myCoursesCount: 0,
    myQuizzesCount: 0,
    mySubmissionsCount: 0,
    reviewedCount: 0,
  });
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myRecentSubmissions, setMyRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const loadInstructorData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // ১. কারেন্ট লগইন করা ইন্সট্রাক্টরের প্রোফাইল ফেচ
        const me = await fetchApi('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ২. শুধুমাত্র ইন্সট্রাক্টরের নিজের কোর্স ফেচ (Own only)
        const coursesRes = await fetchApi(
          `/courses?filters[$or][0][instructor][id][$eq]=${me.id}&filters[$or][1][instructor][documentId][$eq]=${me.documentId || me.id}&populate=*`
        );
        const ownCourses = coursesRes?.data || [];
        setMyCourses(ownCourses);

        const courseIds = ownCourses.map((c: any) => c.id || c.documentId);

        // ৩. নিজের কোর্সের সাথে সম্পর্কিত কুইজ ফেচ
        let ownQuizzes: any[] = [];
        if (courseIds.length > 0) {
          try {
            const quizFilter = courseIds
              .map((id: any, index: number) => `filters[$or][${index}][course][id][$eq]=${id}`)
              .join('&');
            const quizzesRes = await fetchApi(`/quizzes?${quizFilter}&populate=*`);
            ownQuizzes = quizzesRes?.data || [];
          } catch {
            ownQuizzes = [];
          }
        }

        // ৪. নিজের কোর্সের কুইজ সাবমিশন ও স্টুডেন্ট প্রগ্রেস ফেচ
        let ownSubmissions: any[] = [];
        if (courseIds.length > 0) {
          try {
            const subFilter = courseIds
              .map((id: any, index: number) => `filters[$or][${index}][course][id][$eq]=${id}`)
              .join('&');
            const subRes = await fetchApi(`/quiz-submissions?${subFilter}&populate=*`);
            ownSubmissions = subRes?.data || [];
          } catch {
            ownSubmissions = [];
          }
        }

        setMyRecentSubmissions(ownSubmissions.slice(0, 5));

        const reviewed = ownSubmissions.filter(
          (s: any) => s.status === 'reviewed' || s.isReviewed
        ).length;

        setStats({
          myCoursesCount: ownCourses.length,
          myQuizzesCount: ownQuizzes.length,
          mySubmissionsCount: ownSubmissions.length,
          reviewedCount: reviewed,
        });
      } catch (err) {
        console.error('Failed to load instructor data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInstructorData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading your studio workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Instructor Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your own courses, lessons, quizzes, and evaluate student progress.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/instructor/courses"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage My Courses</span>
          </Link>
        </div>
      </div>

      {/* Permission Matrix Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">My Courses</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats.myCoursesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Owned curricula</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">My Quizzes</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats.myQuizzesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Assessment sets</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Student Attempts</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats.mySubmissionsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">On your courses</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Reviewed Submissions</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{stats.reviewedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Evaluated so far</p>
        </div>
      </div>

      {/* Grid: My Courses & Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Own Courses list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">My Active Courses</h2>
            <Link
              href="/dashboard/instructor/courses"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myCourses.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">You have not created any courses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCourses.slice(0, 4).map((course) => (
                <div
                  key={course.id || course.documentId}
                  className="p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {course.title || course.attributes?.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {course.description || course.attributes?.description || 'No description'}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/instructor/courses`}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium rounded-lg shrink-0 transition"
                  >
                    Manage Content
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submissions on Instructor's Courses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Student Activity</h2>
            <Link
              href="/dashboard/instructor/progress"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Progress <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {myRecentSubmissions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No submissions on your courses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRecentSubmissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {sub.user?.username || 'Student'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Score: {sub.score ?? 'N/A'}</span>
                    </div>
                  </div>
                  {sub.status === 'reviewed' ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Graded
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}