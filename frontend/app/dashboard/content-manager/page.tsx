'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  BookOpen,
  Newspaper,
  Video,
  HelpCircle,
  Plus,
  ArrowRight,
  Loader2,
  Clock,
  PlayCircle,
} from 'lucide-react';

export default function ContentManagerDashboardPage() {
  const [stats, setStats] = useState({
    courses: 0,
    lessons: 0,
    quizzes: 0,
    blogs: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        setLoading(true);
        
        const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const cleanToken = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (cleanToken) {
          headers['Authorization'] = `Bearer ${cleanToken}`;
        }

        const [coursesRes, blogsRes, lessonsRes, quizzesRes] = await Promise.all([
          fetchApi('/courses?populate=*', { headers }).catch(() => ({ data: [] })),
          fetchApi('/blogs?populate=*', { headers }).catch(() => ({ data: [] })),
          fetchApi('/lessons?populate=*', { headers }).catch(() => ({ data: [] })),
          fetchApi('/quizzes', { headers }).catch(() => ({ data: [] })),
        ]);

        const coursesList = Array.isArray(coursesRes?.data) ? coursesRes.data : [];
        const blogsList = Array.isArray(blogsRes?.data) ? blogsRes.data : [];
        const lessonsList = Array.isArray(lessonsRes?.data) ? lessonsRes.data : [];

        setStats({
          courses: coursesList.length,
          blogs: blogsList.length,
          lessons: lessonsList.length,
          quizzes: Array.isArray(quizzesRes?.data) ? quizzesRes.data.length : 0,
        });

        setRecentCourses(coursesList.slice(0, 4));
        setRecentBlogs(blogsList.slice(0, 4));
        setRecentLessons(lessonsList.slice(0, 4));
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading Content Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Manager Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, update curriculum, manage quizzes, and publish blog articles across the platform.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/content-manager/courses" className="p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl space-y-2 transition block">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400">Total Courses</p>
          <p className="text-xl font-bold text-white">{stats.courses}</p>
        </Link>

        <Link href="/dashboard/content-manager/blogs" className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl space-y-2 transition block">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Newspaper className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400">Published Blogs</p>
          <p className="text-xl font-bold text-white">{stats.blogs}</p>
        </Link>

        <Link href="/dashboard/content-manager/courses" className="p-4 bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl space-y-2 transition block">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400">Lessons Uploaded</p>
          <p className="text-xl font-bold text-white">{stats.lessons}</p>
        </Link>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-400">Active Quizzes</p>
          <p className="text-xl font-bold text-white">{stats.quizzes}</p>
        </div>
      </div>

      {/* Main Grid: Courses, Lessons & Blogs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Recent Courses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Courses
            </h2>
            <Link
              href="/dashboard/content-manager/courses"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCourses.length > 0 ? (
            <div className="space-y-2.5">
              {recentCourses.map((c) => {
                const targetCourseId = c.documentId || c.id;
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/content-manager/courses/${targetCourseId}`}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-indigo-500/40 transition group"
                  >
                    <div className="truncate mr-2">
                      <h3 className="text-xs font-semibold text-white group-hover:text-indigo-400 transition truncate">
                        {c.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {c.lessons?.length || 0} Lessons
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 transition" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No courses found.</p>
          )}
        </div>

        {/* 2. Recent Lessons (Direct Linked to Course Management) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" /> Recent Lessons
            </h2>
            <Link
              href="/dashboard/content-manager/courses"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLessons.length > 0 ? (
            <div className="space-y-2.5">
              {recentLessons.map((l) => {
                const parentCourseId = l.course?.documentId || l.course?.id || l.course_id;
                const linkHref = parentCourseId 
                  ? `/dashboard/content-manager/courses/${parentCourseId}`
                  : '/dashboard/content-manager/courses';

                return (
                  <Link
                    key={l.id}
                    href={linkHref}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-blue-500/40 transition group"
                  >
                    <div className="truncate mr-2">
                      <h3 className="text-xs font-semibold text-white group-hover:text-blue-400 transition truncate flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        {l.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        Course: {l.course?.title || 'General Curriculum'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No lessons found.</p>
          )}
        </div>

        {/* 3. Recent Blogs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-400" /> Articles
            </h2>
            <Link
              href="/dashboard/content-manager/blogs"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentBlogs.length > 0 ? (
            <div className="space-y-2.5">
              {recentBlogs.map((b) => {
                const targetBlogId = b.documentId || b.id;
                return (
                  <Link
                    key={b.id}
                    href={`/dashboard/content-manager/blogs/${targetBlogId}`}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-emerald-500/40 transition group"
                  >
                    <div className="truncate mr-2">
                      <h3 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition truncate">
                        {b.title}
                      </h3>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 transition" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No articles found.</p>
          )}
        </div>

      </div>
    </div>
  );
}