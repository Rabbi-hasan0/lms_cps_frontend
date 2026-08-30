// app/dashboard/student/quizzes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  HelpCircle,
  Loader2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Award,
  Clock,
  Lock,
} from 'lucide-react';

export default function StudentQuizzesPage() {
  const [completedQuizzes, setCompletedQuizzes] = useState<any[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadQuizzesAndData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const [meRes, quizzesRes, resultsRes, enrollmentsRes] = await Promise.all([
        fetchApi('/users/me', authHeader).catch(() => null),
        fetchApi('/quizzes?populate=course', authHeader).catch(() => null),
        fetchApi('/quiz-results?populate=*', authHeader).catch(() => null),
        fetchApi('/enrollments?populate=*', authHeader).catch(() => null),
      ]);

      const userId = meRes?.id;
      const rawQuizzes = Array.isArray(quizzesRes?.data) ? quizzesRes.data : Array.isArray(quizzesRes) ? quizzesRes : [];
      const rawResults = Array.isArray(resultsRes?.data) ? resultsRes.data : Array.isArray(resultsRes) ? resultsRes : [];
      const rawEnrollments = Array.isArray(enrollmentsRes?.data) ? enrollmentsRes.data : Array.isArray(enrollmentsRes) ? enrollmentsRes : [];

      // ১. লগইন করা ইউজারের এনরোল করা কোর্সের ID গুলো বের করা
      const enrolledCourseIds = new Set<string>();
      
      rawEnrollments.forEach((en: any) => {
        const attr = en.attributes || en;
        
        // Strapi schema অনুযায়ী 'user' ফিল্ড বের করা
        const userObj = attr.user?.data || attr.user;
        const enrolledUserId = userObj?.id || userObj;

        // শুধু বর্তমানে লগইন থাকা ইউজারের এনরোলমেন্ট চেক করা
        if (userId && Number(enrolledUserId) === Number(userId)) {
          const courseObj = attr.course?.data || attr.course;
          if (courseObj) {
            const cId = courseObj.id || courseObj;
            const cDocId = courseObj.attributes?.documentId || courseObj.documentId;
            
            if (cId) enrolledCourseIds.add(String(cId));
            if (cDocId) enrolledCourseIds.add(String(cDocId));
          }
        }
      });

      // ২. ইউজারের সাবমিট করা কুইজের রেজাল্ট ম্যাপে রাখা
      const userSubmittedMap = new Map();
      rawResults.forEach((resItem: any) => {
        const attr = resItem.attributes || resItem;
        const quizRef = attr.quiz?.data || attr.quiz;
        const quizUserId = attr.user?.data?.id || attr.user?.id || attr.user;

        if (userId && Number(quizUserId) === Number(userId)) {
          const qId = quizRef?.id || quizRef;
          const qDocId = quizRef?.attributes?.documentId || quizRef?.documentId;
          if (qId) userSubmittedMap.set(String(qId), { score: attr.score, total: attr.total });
          if (qDocId) userSubmittedMap.set(String(qDocId), { score: attr.score, total: attr.total });
        }
      });

      const completed: any[] = [];
      const available: any[] = [];

      // ৩. শুধু এনরোল করা কোর্সের কুইজগুলো ফিল্টার করা
      rawQuizzes.forEach((item: any) => {
        const attr = item.attributes || item;
        const courseData = attr.course?.data || attr.course;
        
        const courseId = courseData?.id || courseData;
        const courseDocId = courseData?.attributes?.documentId || courseData?.documentId;
        const courseTitle = courseData?.attributes?.title || courseData?.title || 'General Course';

        // ইউজার এই কোর্সে এনরোল করা আছে কিনা ফিল্টার চেক
        const isEnrolled = 
          (courseId && enrolledCourseIds.has(String(courseId))) || 
          (courseDocId && enrolledCourseIds.has(String(courseDocId)));

        // এনরোল না থাকলে স্কিপ করবে
        if (!isEnrolled) return;

        const qId = String(item.id);
        const qDocId = String(item.documentId || '');

        const quizObj = {
          id: item.id,
          documentId: item.documentId,
          title: attr.title || 'Untitled Quiz',
          courseTitle,
          questionsCount: Array.isArray(attr.questions) ? attr.questions.length : 0,
          createdAt: attr.createdAt || new Date().toISOString(),
        };

        const submission = userSubmittedMap.get(qDocId) || userSubmittedMap.get(qId);

        if (submission) {
          completed.push({
            ...quizObj,
            score: submission.score,
            total: submission.total || quizObj.questionsCount,
          });
        } else {
          available.push(quizObj);
        }
      });

      setCompletedQuizzes(completed);
      setAvailableQuizzes(available);
    } catch (err) {
      console.error('Failed to load student quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  loadQuizzesAndData();
}, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium">Loading your quizzes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider">
            Assessments Dashboard
          </span>
          <h1 className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            My Quizzes & Exams
          </h1>
        </div>
      </div>

      {/* 🚀 Section 1: Available Quizzes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Available Quizzes</h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold border border-slate-700">
            {availableQuizzes.length} Available
          </span>
        </div>

        {availableQuizzes.length > 0 ? (
          <div className="space-y-3">
            {availableQuizzes.map((quiz) => (
              <div
                key={quiz.documentId || quiz.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-slate-700 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <BookOpen className="w-3.5 h-3.5" /> {quiz.courseTitle}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(quiz.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-400">
                    Total Questions: <span className="text-white font-semibold">{quiz.questionsCount}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                    Pending Attempt
                  </span>
                  <Link
                    href={`/dashboard/student/courses/general/quizzes/${quiz.documentId || quiz.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
                  >
                    <span>Start Quiz</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl text-slate-500">
            <p className="text-xs">No pending quizzes available for your enrolled courses right now.</p>
          </div>
        )}
      </div>

      {/* ✅ Section 2: Completed Quizzes List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Completed Quizzes & Score Board</h2>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold border border-slate-700">
            {completedQuizzes.length} Completed
          </span>
        </div>

        {completedQuizzes.length > 0 ? (
          <div className="space-y-3">
            {completedQuizzes.map((quiz) => (
              <div
                key={quiz.documentId || quiz.id}
                className="bg-slate-900/90 border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <BookOpen className="w-3.5 h-3.5" /> {quiz.courseTitle}
                    </span>
                    <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {quiz.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Your Score</p>
                      <p className="text-sm font-bold text-white">
                        <span className="text-emerald-400 text-base">{quiz.score}</span> / {quiz.total}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Submitted</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl text-slate-500">
            <p className="text-xs">You haven't completed any quizzes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}