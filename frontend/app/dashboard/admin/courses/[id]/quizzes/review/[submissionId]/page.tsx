// app/dashboard/admin/courses/[id]/quizzes/review/[submissionId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Award,
  Loader2,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export default function StudentQuizReviewPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const submissionId = params?.submissionId as string;

  const [submission, setSubmission] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const isNumeric = !isNaN(Number(submissionId));
        const endpoint = isNumeric
          ? `/quiz-results?filters[$or][0][id][$eq]=${submissionId}&filters[$or][1][documentId][$eq]=${submissionId}&populate[quiz][populate]=*&populate[user][populate]=*`
          : `/quiz-results?filters[documentId][$eq]=${submissionId}&populate[quiz][populate]=*&populate[user][populate]=*`;

        const isCourseNumeric = !isNaN(Number(courseId));
        const courseEndpoint = isCourseNumeric
          ? `/courses?filters[$or][0][id][$eq]=${courseId}&filters[$or][1][documentId][$eq]=${courseId}`
          : `/courses?filters[documentId][$eq]=${courseId}`;

        const [subRes, courseRes] = await Promise.all([
          fetchApi(endpoint, { headers }).catch(() => null),
          fetchApi(courseEndpoint, { headers }).catch(() => null),
        ]);

        let foundSubmission = null;
        if (subRes?.data) {
          if (Array.isArray(subRes.data) && subRes.data.length > 0) {
            foundSubmission = subRes.data[0];
          } else if (!Array.isArray(subRes.data)) {
            foundSubmission = subRes.data;
          }
        }
        setSubmission(foundSubmission);

        if (courseRes?.data) {
          setCourse(Array.isArray(courseRes.data) ? courseRes.data[0] : courseRes.data);
        }
      } catch (err: any) {
        console.error('Failed to load quiz result review:', err);
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) loadSubmission();
  }, [submissionId, courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading exam result...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Submission Not Found</h2>
        <Link
          href={`/dashboard/admin/courses/${courseId}/quizzes`}
          className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs text-white"
        >
          Back to Quizzes
        </Link>
      </div>
    );
  }

  const quiz = submission.quiz || {};
  const questions: any[] = Array.isArray(quiz.questions) ? quiz.questions : [];

  let studentAnswers: Record<string | number, number> = {};
  if (submission.answers) {
    if (typeof submission.answers === 'string') {
      try {
        studentAnswers = JSON.parse(submission.answers);
      } catch (_) {
        studentAnswers = {};
      }
    } else if (typeof submission.answers === 'object') {
      studentAnswers = submission.answers;
    }
  }

  const totalQuestions = submission.total || questions.length || 1;
  const percentage = Math.round(((submission.score || 0) / totalQuestions) * 100);
  const isPassed = percentage >= 50;
  const studentName = submission.user?.username || 'Student';
  const studentEmail = submission.user?.email || '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/admin/courses/${courseId}/quizzes`}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {course?.title || 'Course'} / Quizzes
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {quiz.title || 'Exam Paper Review'}
            </h1>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border ${
            isPassed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {isPassed ? 'Passed' : 'Failed'}
        </span>
      </div>

      {/* Summary Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="text-[11px] text-slate-400">Student</p>
            <p className="text-sm font-bold text-white truncate">{studentName}</p>
            {studentEmail && <p className="text-[10px] text-slate-500 truncate">{studentEmail}</p>}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className={`p-3 rounded-xl ${isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Score & Percentage</p>
            <p className="text-base font-bold text-white">
              {submission.score || 0} / {totalQuestions}
              <span className="text-xs font-normal text-slate-400 ml-1.5">({percentage}%)</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Submitted On</p>
            <p className="text-xs font-bold text-white">
              {submission.createdAt
                ? new Date(submission.createdAt).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Answer Paper Analysis */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          Detailed Exam Paper ({questions.length} Questions)
        </h2>

        {questions.length > 0 ? (
          questions.map((q: any, qIdx: number) => {
            const studentChoice =
              studentAnswers[qIdx] !== undefined
                ? Number(studentAnswers[qIdx])
                : studentAnswers[String(qIdx)] !== undefined
                ? Number(studentAnswers[String(qIdx)])
                : null;

            const isCorrect = studentChoice !== null && studentChoice === Number(q.correctAnswer);
            const isUnanswered = studentChoice === null || isNaN(studentChoice);

            return (
              <div
                key={qIdx}
                className={`p-5 bg-slate-900 border rounded-2xl space-y-3.5 transition shadow-md ${
                  isCorrect
                    ? 'border-emerald-500/30'
                    : isUnanswered
                    ? 'border-amber-500/30'
                    : 'border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white leading-relaxed">
                    <span className="text-indigo-400 mr-1.5">Q{qIdx + 1}.</span>
                    {q.questionText}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isUnanswered
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </>
                    ) : isUnanswered ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> Not Answered
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {(q.options || []).map((opt: string, optIdx: number) => {
                    const isStudentPicked = studentChoice === optIdx;
                    const isTheCorrectOption = Number(q.correctAnswer) === optIdx;

                    let cardStyle = 'bg-slate-950/60 border-slate-800/80 text-slate-400';

                    if (isTheCorrectOption) {
                      cardStyle = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium';
                    } else if (isStudentPicked && !isCorrect) {
                      cardStyle = 'bg-red-500/10 border-red-500/40 text-red-300 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 border rounded-xl text-xs flex items-center justify-between gap-2 transition ${cardStyle}`}
                      >
                        <span className="truncate">{opt}</span>
                        <div className="shrink-0 flex items-center gap-1">
                          {isTheCorrectOption && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                              Correct Answer
                            </span>
                          )}
                          {isStudentPicked && !isCorrect && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No questions found for this quiz paper.
          </div>
        )}
      </div>
    </div>
  );
}