// app/dashboard/student/courses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  BookOpen,
  PlayCircle,
  Clock,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export default function MyEnrolledCoursesPage() {
  const [enrolledList, setEnrolledList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  useEffect(() => {
    const loadMyCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const me = await fetchApi('/users/me', { headers });
        if (!me?.id) return;

        const res = await fetchApi(
          `/enrollments?filters[$or][0][user][id][$eq]=${me.id}${
            me.documentId ? `&filters[$or][1][user][documentId][$eq]=${me.documentId}` : ''
          }&populate[course][populate][0]=lessons&populate[course][populate][1]=quizzes&populate[course][populate][2]=thumbnail&populate[course][populate][3]=instructor`,
          { headers }
        );

        setEnrolledList(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load enrolled courses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMyCourses();
  }, []);

  const getThumbnailUrl = (course: any) => {
    const rawUrl =
      course?.thumbnail?.url ||
      course?.thumbnail?.data?.attributes?.url ||
      course?.thumbnail?.[0]?.url;

    if (!rawUrl) return null;
    return rawUrl.startsWith('http') ? rawUrl : `${STRAPI_URL}${rawUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs">Loading your enrolled courses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-emerald-400" />
          My Enrolled Courses
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Continue your lectures, complete homework, and attend course quizzes.
        </p>
      </div>

      {enrolledList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledList.map((enr) => {
            const item = enr.attributes || enr;
            const course = item.course?.data?.attributes || item.course?.data || item.course;
            if (!course) return null;

            const courseRef = course.documentId || course.id;
            const lessons = course.lessons?.data || course.lessons || [];
            const quizzes = course.quizzes?.data || course.quizzes || [];
            const firstLessonId = lessons[0]?.documentId || lessons[0]?.id;
            const progressVal = item.progress || 0;
            const thumb = getThumbnailUrl(course);

            return (
              <div
                key={enr.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative w-full h-40 bg-slate-950 overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Enrolled
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold text-white line-clamp-1">{course.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                        {lessons.length} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        {quizzes.length} Quizzes
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-emerald-400 font-bold">{progressVal}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={
                      firstLessonId
                        ? `/dashboard/student/courses/${courseRef}/lessons/${firstLessonId}`
                        : `/dashboard/student/courses/${courseRef}`
                    }
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{progressVal > 0 ? 'Resume Course' : 'Start Course'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No courses enrolled yet</h3>
          <p className="text-xs text-slate-400">Browse available courses on your home dashboard and enroll.</p>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
          >
            <span>Browse Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}