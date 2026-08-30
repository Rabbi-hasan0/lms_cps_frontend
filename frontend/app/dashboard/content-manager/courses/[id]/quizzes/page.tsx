// app/dashboard/content-manager/courses/[id]/quizzes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function AdminCourseQuizzesPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'results'>('quizzes');

  // Quiz Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
      },
    ],
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // ১. Fetch Course Info
      const isCourseNumeric = !isNaN(Number(courseId));
      const courseQuery = isCourseNumeric
        ? `/courses?filters[$or][0][id][$eq]=${courseId}&filters[$or][1][documentId][$eq]=${courseId}&populate=*`
        : `/courses?filters[documentId][$eq]=${courseId}&populate=*`;

      const courseRes = await fetchApi(courseQuery, { headers }).catch(() => null);
      let currentCourse: any = null;
      if (courseRes?.data && Array.isArray(courseRes.data) && courseRes.data.length > 0) {
        currentCourse = courseRes.data[0];
      } else if (courseRes?.data) {
        currentCourse = courseRes.data;
      }
      setCourse(currentCourse);

      const numericId = currentCourse?.id || (isCourseNumeric ? courseId : null);
      const docId = currentCourse?.documentId || (!isCourseNumeric ? courseId : null);

      // ২. Fetch Quizzes
      let quizQuery = `/quizzes?populate=*`;
      if (numericId && docId) {
        quizQuery = `/quizzes?filters[$or][0][course][id][$eq]=${numericId}&filters[$or][1][course][documentId][$eq]=${docId}&populate=*`;
      } else if (numericId) {
        quizQuery = `/quizzes?filters[course][id][$eq]=${numericId}&populate=*`;
      } else if (docId) {
        quizQuery = `/quizzes?filters[course][documentId][$eq]=${docId}&populate=*`;
      }

      const quizRes = await fetchApi(quizQuery, { headers }).catch(() => null);
      setQuizzes(Array.isArray(quizRes?.data) ? quizRes.data : []);

      // ৩. Fetch Quiz Results (Relation path: quiz.course)
      let resultsQuery = `/quiz-results?populate[quiz][populate]=*&populate[user][populate]=*`;
      if (numericId && docId) {
        resultsQuery += `&filters[$or][0][quiz][course][id][$eq]=${numericId}&filters[$or][1][quiz][course][documentId][$eq]=${docId}`;
      } else if (numericId) {
        resultsQuery += `&filters[quiz][course][id][$eq]=${numericId}`;
      } else if (docId) {
        resultsQuery += `&filters[quiz][course][documentId][$eq]=${docId}`;
      }

      const resData = await fetchApi(resultsQuery, { headers }).catch(() => null);
      setSubmissions(Array.isArray(resData?.data) ? resData.data : []);

    } catch (err: any) {
      console.error('Quiz Page Main Error:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...quizForm.questions];
    updated[index].questionText = text;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...quizForm.questions];
    updated[qIndex].options[optIndex] = value;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleCorrectAnswerChange = (qIndex: number, optIndex: number) => {
    const updated = [...quizForm.questions];
    updated[qIndex].correctAnswer = optIndex;
    setQuizForm({ ...quizForm, questions: updated });
  };

  const addQuestionField = () => {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        { questionText: '', options: ['', '', '', ''], correctAnswer: 0 },
      ],
    });
  };

  const removeQuestionField = (index: number) => {
    if (quizForm.questions.length === 1) return;
    const updated = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updated });
  };

  const handleOpenModal = (quiz: any = null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title || '',
        questions: quiz.questions || [
          { questionText: '', options: ['', '', '', ''], correctAnswer: 0 },
        ],
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        title: '',
        questions: [
          { questionText: '', options: ['', '', '', ''], correctAnswer: 0 },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload: any = {
        title: quizForm.title,
        questions: quizForm.questions,
      };

      if (!editingQuiz && course) {
        payload.course = course.id;
        await fetchApi('/quizzes', {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      } else if (editingQuiz) {
        const targetId = editingQuiz.documentId || editingQuiz.id;
        await fetchApi(`/quizzes/${targetId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save quiz');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return;
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('token');
      const targetId = quizToDelete.documentId || quizToDelete.id;

      await fetchApi(`/quizzes/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setIsDeleteModalOpen(false);
      setQuizToDelete(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete quiz');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading quizzes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/content-manager/courses/${courseId}`}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs text-indigo-400 font-medium">
              {course?.title || 'Course'} / Exams
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              Quiz Management & Submissions
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> All Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Exam Results ({submissions.length})
          </button>
        </div>
      </div>

      {/* 1. QUIZZES TAB */}
      {activeTab === 'quizzes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Course Quizzes</h2>
              <p className="text-xs text-slate-400">Create, edit and manage exam MCQs</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" /> Create Quiz
            </button>
          </div>

          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {quizzes.map((quiz, idx) => (
                <div
                  key={quiz.id || idx}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">{quiz.title}</h3>
                    <p className="text-xs text-slate-400">
                      {quiz.questions?.length || 0} Questions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(quiz)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition"
                      title="Edit Quiz"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setQuizToDelete(quiz);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No quizzes created yet. Click &quot;Create Quiz&quot; above.
            </div>
          )}
        </div>
      )}

      {/* 2. RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Student Exam Papers</h2>
            <p className="text-xs text-slate-400">
              Click on a student&apos;s name or &quot;Check Paper&quot; to review their answers.
            </p>
          </div>

          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Quiz</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Percentage</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Review Paper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {submissions.map((sub: any) => {
                    const totalQ = sub.total || sub.quiz?.questions?.length || 1;
                    const percent = Math.round(((sub.score || 0) / totalQ) * 100);
                    const isPassed = percent >= 50;
                    const targetSubId = sub.documentId || sub.id;
                    const reviewLink = `/dashboard/content-manager/courses/${courseId}/quizzes/review/${targetSubId}`;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-950/40 transition">
                        <td className="py-3.5">
                          <Link
                            href={reviewLink}
                            className="font-medium text-indigo-400 hover:underline hover:text-indigo-300 transition block"
                          >
                            {sub.user?.username || 'Student'}
                          </Link>
                        </td>
                        <td className="py-3.5 text-xs text-slate-300">
                          {sub.quiz?.title || 'Quiz'}
                        </td>
                        <td className="py-3.5 text-xs font-bold text-white">
                          {sub.score || 0} / {totalQ}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {percent}%
                          </span>
                        </td>
                        <td className="py-3.5 text-xs text-slate-400">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={reviewLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-indigo-600 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Check Paper
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No students have taken any quizzes yet.
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="e.g. Basic C Programming Quiz"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Questions ({quizForm.questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addQuestionField}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {quizForm.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Question #{qIndex + 1}
                      </span>
                      {quizForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionField(qIndex)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={q.questionText}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() => handleCorrectAnswerChange(qIndex, optIndex)}
                            className="accent-indigo-600 cursor-pointer"
                            title="Select as correct answer"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(qIndex, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                            className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 flex items-center gap-2"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingQuiz ? 'Update Quiz' : 'Save Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE WARNING MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3.5 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Quiz</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{quizToDelete?.title}&quot;</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}