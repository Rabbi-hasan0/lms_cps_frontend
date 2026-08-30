// app/dashboard/student/progress/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  TrendingUp,
  Loader2,
  BookOpen,
  Award,
} from 'lucide-react';

export default function StudentProgressPage() {
  const [coursesProgress, setCoursesProgress] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        // ১. কারেন্ট ইউজার, সব এনরোলমেন্ট এবং কুইজ রেজাল্ট একসাথে ফেচ করা
        const [meRes, enrollRes, quizResultsRes] = await Promise.all([
          fetchApi('/users/me', authHeader).catch(() => null),
          fetchApi('/enrollments?populate=*', authHeader).catch(() => null),
          fetchApi('/quiz-results?populate=*', authHeader).catch(() => null),
        ]);

        const userId = meRes?.id;
        const rawEnrollments = Array.isArray(enrollRes?.data) ? enrollRes.data : Array.isArray(enrollRes) ? enrollRes : [];
        const rawQuizResults = Array.isArray(quizResultsRes?.data) ? quizResultsRes.data : Array.isArray(quizResultsRes) ? quizResultsRes : [];

        // ২. ক্লায়েন্ট-সাইডে ইউজারের এনরোলমেন্ট ফিল্টার করা (যাতে সব ফরম্যাট সাপোর্ট করে)
        const userEnrollments = rawEnrollments.filter((item: any) => {
          const attr = item.attributes || item;
          const userField = attr.user?.data || attr.user;
          const uId = userField?.id || userField;
          
          // যদি ইউজার আইডি ম্যাচ করে অথবা ইউজার অবজেক্টের সাথে ইউজারনেম মিলে যায়
          return (
            (userId && Number(uId) === Number(userId)) ||
            (userField?.username && userField.username === meRes?.username) ||
            !userId // ফলব্যাক হিসেবে সব দেখাবে যদি আইডি না মেলে
          );
        });

        const formattedCourses = userEnrollments.map((item: any) => {
          const attr = item.attributes || item;
          const courseRef = attr.course?.data || attr.course;
          const courseAttr = courseRef?.attributes || courseRef || {};
          
          const title = courseAttr.title || courseAttr.name || 'Enrolled Course';
          const progressPercent = attr.progress ?? 0;

          return {
            id: item.id,
            title,
            progress: progressPercent,
            status: attr.status_enrollment || 'Active',
          };
        });

        setCoursesProgress(formattedCourses);

        // ৩. কুইজ রেজাল্ট ফিল্টার ও ফরম্যাট করা
        const userQuizResults = rawQuizResults.filter((item: any) => {
          const attr = item.attributes || item;
          const userField = attr.user?.data || attr.user;
          const uId = userField?.id || userField;
          return !userId || Number(uId) === Number(userId);
        });

        const formattedQuizzes = userQuizResults.map((item: any) => {
          const attr = item.attributes || item;
          const quizRef = attr.quiz?.data || attr.quiz;
          const quizAttr = quizRef?.attributes || quizRef || {};
          const quizTitle = quizAttr.title || 'Course Assessment';

          return {
            id: item.id,
            quizTitle,
            score: attr.score ?? 0,
            total: attr.total ?? 0,
            date: attr.createdAt || new Date().toISOString(),
          };
        });

        setQuizResults(formattedQuizzes);
      } catch (err) {
        console.error('Failed to load student progress:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium">Loading your progress & analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider">
            Performance Overview
          </span>
          <h1 className="text-lg sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            My Learning Progress & Quiz Scoreboard
          </h1>
        </div>
      </div>

      {/* 📊 Section 1: Course Progress */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">Course Completion Status</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
            {coursesProgress.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {coursesProgress.length > 0 ? (
            coursesProgress.map((course) => (
              <div
                key={course.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {course.title}
                  </h3>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0">
                    {course.progress}% Completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(course.progress, 5), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Started</span>
                    <span>{course.progress === 100 ? 'Finished' : 'In Progress'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl text-slate-500">
              <p className="text-xs">You are not enrolled in any courses yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 🏆 Section 2: Quiz Scoreboard */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">Quiz Scoreboard & History</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
            {quizResults.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizResults.length > 0 ? (
            quizResults.map((result) => {
              const percentage = Math.round((result.score / (result.total || 1)) * 100);
              const isPassed = percentage >= 40;

              return (
                <div
                  key={result.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        Assessment Result
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {result.quizTitle}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Score Obtained</p>
                        <p className="text-base font-bold text-white">
                          <span className="text-emerald-400">{result.score}</span> / {result.total}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        isPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {percentage}% ({isPassed ? 'Passed' : 'Needs Practice'})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-900/50 border border-slate-800/80 rounded-3xl text-slate-500">
              <p className="text-xs">No quiz results recorded yet. Complete quizzes to see your scores here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}