'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api'; // Path Fixed
import {
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  Loader2,
  Sparkles,
  Eye,
  PlusCircle,
  X,
  Lock,
  PlayCircle,
  Clock,
  User,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | number | null>(null);

  // Preview Modal
  const [previewCourse, setPreviewCourse] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const cleanToken = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
      };

      // ১. কারেন্ট ইউজার ফেচ (যদি টোকেন থাকে)
      let currentUser: any = null;
      if (cleanToken) {
        try {
          currentUser = await fetchApi('/users/me?populate=role', { headers });
          setUser(currentUser);
        } catch {
          const cached = localStorage.getItem('user');
          if (cached) {
            currentUser = JSON.parse(cached);
            setUser(currentUser);
          }
        }
      }

      const userId = currentUser?.id;
      const userDocId = currentUser?.documentId;

      // ২. এনরোলমেন্ট ও সমস্ত কোর্স ফেচ
      const enrollQuery = userId
        ? `/enrollments?filters[$or][0][user][id][$eq]=${userId}${
            userDocId ? `&filters[$or][1][user][documentId][$eq]=${userDocId}` : ''
          }&populate=*`
        : null;

      const [enrollRes, coursesRes] = await Promise.all([
        enrollQuery ? fetchApi(enrollQuery, { headers }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        fetchApi('/courses?populate=*', { headers }).catch(() => ({ data: [] })),
      ]);

      const rawEnrollments = Array.isArray(enrollRes?.data) ? enrollRes.data : [];
      const enrolledSet = new Set<string>();

      rawEnrollments.forEach((enr: any) => {
        const item = enr.attributes || enr;
        const c = item.course?.data?.attributes || item.course?.data || item.course;
        if (c) {
          if (c.id) enrolledSet.add(String(c.id));
          if (c.documentId) enrolledSet.add(String(c.documentId));
          if (item.course?.id) enrolledSet.add(String(item.course.id));
          if (item.course?.documentId) enrolledSet.add(String(item.course.documentId));
        }
      });

      setEnrolledCourseIds(enrolledSet);
      setEnrolledCount(rawEnrollments.length);
      setAllCourses(Array.isArray(coursesRes?.data) ? coursesRes.data : []);
    } catch (err) {
      console.error('Failed to load home page data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInstantEnroll = async (course: any) => {
    if (!user?.id) {
      // লগইন না থাকলে লগইন পেজে রিডাইরেক্ট করবে
      router.push('/login');
      return;
    }

    const courseTargetRef = course.documentId || course.id;
    const userTargetRef = user.documentId || user.id;

    setEnrollingId(courseTargetRef);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const enrollmentPayload = {
        user: userTargetRef,
        course: courseTargetRef,
        progress: 0,
        completed_lessons: [],
      };

      await fetchApi('/enrollments', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: enrollmentPayload }),
      });

      if (isPreviewOpen) setIsPreviewOpen(false);

      // সফলভাবে এনরোল হওয়ার পর সরাসরি ড্যাশবোর্ড বা এনরোল্ড কোর্স পেজে যাবে
      router.push('/dashboard/student/courses');
    } catch (err: any) {
      console.error('Enroll error:', err);
      alert(err.message || 'Failed to enroll in this course');
    } finally {
      setEnrollingId(null);
    }
  };

  const getThumbnailUrl = (course: any) => {
    const rawUrl =
      course.thumbnail?.url ||
      course.thumbnail?.data?.attributes?.url ||
      course.thumbnail?.[0]?.url;

    if (!rawUrl) return null;
    return rawUrl.startsWith('http') ? rawUrl : `${STRAPI_URL}${rawUrl}`;
  };

  const availableCourses = allCourses.filter((course) => {
    const numericIdStr = course.id ? String(course.id) : '';
    const docIdStr = course.documentId ? String(course.documentId) : '';
    return !enrolledCourseIds.has(numericIdStr) && (!docIdStr || !enrolledCourseIds.has(docIdStr));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl mt-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome Learners! &nbsp; Discover Our Courses...
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Unlock a world of knowledge and skills with our curated collection of courses. Enroll now and embark on a transformative learning journey.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">My Active Courses</p>
            <p className="text-2xl font-bold text-white">{enrolledCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Available to Enroll</p>
            <p className="text-2xl font-bold text-indigo-400">{availableCourses.length}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Earned Certificates</p>
            <p className="text-2xl font-bold text-amber-400">0</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Available Courses Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            Explore Available Courses
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click &quot;Enroll&quot; to instantly join and start learning.
          </p>
        </div>

        {availableCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableCourses.map((course) => {
              const thumb = getThumbnailUrl(course);
              const targetId = course.documentId || course.id;
              const isEnrolling = enrollingId === targetId;

              return (
                <div
                  key={course.id || course.documentId}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition flex flex-col justify-between shadow-xl group"
                >
                  <div>
                    <div className="relative w-full h-44 bg-slate-950 overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <BookOpen className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-lg">
                          Available
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {course.instructor?.username || 'Lead Instructor'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {course.lessons?.length || 0} Lessons
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description || 'Full comprehensive syllabus, hands-on modules and assessments.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        setPreviewCourse(course);
                        setIsPreviewOpen(true);
                      }}
                      className="py-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleInstantEnroll(course)}
                      disabled={isEnrolling}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isEnrolling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{isEnrolling ? 'Enrolling...' : 'Enroll'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-slate-400">
              You are currently enrolled in all published courses available on the platform.
            </p>
            {user && (
              <Link
                href="/dashboard/student/courses"
                className="inline-block mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Go to My Enrolled Courses
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Course Curriculum Preview Modal */}
      {isPreviewOpen && previewCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  Course Preview
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{previewCourse.title}</h3>
                <p className="text-xs text-slate-400">
                  Instructor: <span className="text-slate-300 font-medium">{previewCourse.instructor?.username || 'Platform Instructor'}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">About This Course</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
                {previewCourse.description || 'No detailed course description provided yet.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Course Curriculum ({previewCourse.lessons?.length || 0} Lessons)
                </h4>
                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Lock className="w-3 h-3" /> Enroll to Unlock
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {previewCourse.lessons && previewCourse.lessons.length > 0 ? (
                  previewCourse.lessons.map((lesson: any, idx: number) => (
                    <div
                      key={lesson.id || idx}
                      className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl opacity-75 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-300 line-clamp-1">{lesson.title}</p>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <PlayCircle className="w-3 h-3" /> Video Lecture (Locked)
                          </span>
                        </div>
                      </div>

                      <div className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
                    No curriculum lessons posted yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => handleInstantEnroll(previewCourse)}
                disabled={enrollingId === (previewCourse.documentId || previewCourse.id)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {enrollingId === (previewCourse.documentId || previewCourse.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>Enroll Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}