// app/dashboard/content-manager/courses/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import { getVideoDuration } from '@/app/lib/videoUtils';
import {
  BookOpen,
  ArrowLeft,
  Clock,
  PlayCircle,
  Calendar,
  Video,
  HelpCircle,
  GraduationCap,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
  Award,
} from 'lucide-react';

interface CourseDetails {
  id: number;
  documentId?: string;
  title: string;
  description?: string;
  instructor?: {
    username: string;
    email: string;
  };
  createdAt: string;
  lessons: Array<{
    id: number;
    documentId?: string;
    title: string;
    duration?: string;
    videoUrl?: string;
    description?: string;
    notes?: string;
    isCompleted?: boolean;
  }>;
  completedLessons: number;
  dueLessons: number;
  progressPercentage: number;
  students: Array<{
    id: number;
    name: string;
    email: string;
    enrolledAt: string;
    progress: number;
  }>;
}

// 🛠️ Strapi Blocks থেকে টেক্সট বের করার হেল্পার
const extractTextFromBlocks = (raw: any): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((block: any) => {
        if (block.children && Array.isArray(block.children)) {
          return block.children.map((c: any) => c.text || '').join('');
        }
        return block.text || '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

// 🛠️ সাধারণ টেক্সটকে Strapi Blocks JSON-এ কনভার্ট করার হেল্পার
const formatToStrapiBlocks = (text: string) => {
  if (!text || text.trim() === '') {
    return [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '' }],
      },
    ];
  }
  const lines = text.split('\n');
  return lines.map((line) => ({
    type: 'paragraph',
    children: [
      {
        type: 'text',
        text: line,
      },
    ],
  }));
};

export default function SingleCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'lessons' | 'students' | 'quizzes'>('lessons');

  // Modal State (Create / Edit Lesson)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [lessonForm, setLessonForm] = useState({
    title: '',
    duration: '',
    videoUrl: '',
    description: '',
    notes: '',
  });

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const isNumeric = !isNaN(Number(courseId));
      let query = isNumeric
        ? `/courses?filters[$or][0][id][$eq]=${courseId}&filters[$or][1][documentId][$eq]=${courseId}&populate=*`
        : `/courses?filters[documentId][$eq]=${courseId}&populate=*`;

      const res = await fetchApi(query, { headers });

      let data = null;
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        data = res.data[0];
      } else if (res?.data && !Array.isArray(res.data)) {
        data = res.data;
      }

      if (!data) throw new Error('Course not found');

      const enrollments = data.enrollments || [];
      const enrolledStudents = enrollments.map((enr: any, idx: number) => ({
        id: enr.id || idx + 1,
        name: enr.user?.username || enr.student?.username || `Student ${idx + 1}`,
        email: enr.user?.email || enr.student?.email || `student${idx + 1}@example.com`,
        enrolledAt: enr.createdAt ? new Date(enr.createdAt).toLocaleDateString() : 'Recent',
        progress: enr.progress || 0,
      }));

      const lessonsList = (data.lessons || []).map((l: any, idx: number) => ({
        id: l.id,
        documentId: l.documentId,
        title: l.title || `Lesson ${idx + 1}`,
        duration: l.duration || 'Auto',
        videoUrl: l.video_url || l.videoUrl || '',
        description: extractTextFromBlocks(l.content || l.description),
        notes: extractTextFromBlocks(l.note || l.notes),
        isCompleted: false,
      }));

      const completedLessons = lessonsList.filter((l: any) => l.isCompleted).length;
      const totalLessons = lessonsList.length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const dueLessons = totalLessons - completedLessons;

      setCourse({
        id: data.id,
        documentId: data.documentId,
        title: data.title || 'Untitled Course',
        description: data.description,
        instructor: data.instructor || { username: 'Lead Instructor', email: 'instructor@lms.com' },
        createdAt: new Date(data.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        lessons: lessonsList,
        completedLessons,
        dueLessons,
        progressPercentage,
        students: enrolledStudents,
      });

      // কুইজ এবং সাবমিশন সংখ্যা লোড করা
      try {
        const targetCourseRef = data.id || data.documentId;
        const [qRes, rRes] = await Promise.all([
          fetchApi(`/quizzes?filters[course][id][$eq]=${targetCourseRef}`, { headers }).catch(() => null),
          fetchApi(`/quiz-results?filters[quiz][course][id][$eq]=${targetCourseRef}`, { headers }).catch(() => null),
        ]);
        if (qRes?.data) setQuizzesCount(qRes.data.length || 0);
        if (rRes?.data) setResultsCount(rRes.data.length || 0);
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Course not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) loadCourse();
  }, [courseId]);

  // Video URL Change
  const handleVideoUrlChange = async (url: string) => {
    setLessonForm((prev) => ({ ...prev, videoUrl: url }));

    if (url.trim().length > 10) {
      setIsDetectingDuration(true);
      try {
        const autoDuration = await getVideoDuration(url);
        if (autoDuration) {
          setLessonForm((prev) => ({ ...prev, duration: autoDuration }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsDetectingDuration(false);
      }
    }
  };

  // Open Modal (Create / Edit)
  const handleOpenModal = (lesson: any = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        duration: lesson.duration || '',
        videoUrl: lesson.videoUrl || '',
        description: lesson.description || '',
        notes: lesson.notes || '',
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: '', duration: '', videoUrl: '', description: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  // 🚀 Save Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload: any = {
        title: lessonForm.title,
        video_url: lessonForm.videoUrl,
        content: formatToStrapiBlocks(lessonForm.description),
        note: lessonForm.notes,
      };

      if (!editingLesson && course) {
        payload.course = course.id;
        payload.order = (course.lessons?.length || 0) + 1;
        await fetchApi('/lessons', {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      } else if (editingLesson) {
        const targetId = editingLesson.documentId || editingLesson.id;
        await fetchApi(`/lessons/${targetId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      }

      setIsModalOpen(false);
      await loadCourse();
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson');
    } finally {
      setModalLoading(false);
    }
  };

  // ⚠️ Open Delete Modal
  const handleOpenDeleteModal = (lesson: any) => {
    setLessonToDelete(lesson);
    setIsDeleteModalOpen(true);
  };

  // 🗑️ Confirm Delete Lesson
  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('token');
      const targetId = lessonToDelete.documentId || lessonToDelete.id;

      await fetchApi(`/lessons/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setIsDeleteModalOpen(false);
      setLessonToDelete(null);
      await loadCourse();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading course details...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Course Not Found</h2>
        <Link href="/dashboard/content-manager/courses" className="inline-block mt-2 px-4 py-2 bg-indigo-600 rounded-xl text-xs text-white">
          Back to Courses
        </Link>
      </div>
    );
  }

  const totalStudents = course.students.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage) || 1;
  const currentStudents = course.students.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);
  const targetCourseId = course.documentId || course.id || courseId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/content-manager/courses" className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Course Curriculum, Quizzes & Enrolled Students</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'lessons' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Lessons ({course.lessons.length})
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'quizzes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Quizzes & Results ({quizzesCount})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Students ({totalStudents})
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (Dynamic Tab Content) */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. LESSONS TAB */}
          {activeTab === 'lessons' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-500" />
                    Course Curriculum & Lessons
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {course.completedLessons} Completed • {course.dueLessons} Due/Pending
                  </p>
                </div>
                <button
                  onClick={() => handleOpenModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow transition"
                >
                  <Plus className="w-4 h-4" /> Add Lesson
                </button>
              </div>

              {course.lessons.length > 0 ? (
                <div className="space-y-2.5">
                  {course.lessons.map((lesson: any, idx: number) => {
                    const targetLessonId = lesson.documentId || lesson.id;
                    const lessonLink = `/dashboard/content-manager/courses/${targetCourseId}/lessons/${targetLessonId}`;

                    return (
                      <div
                        key={lesson.id || idx}
                        className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-indigo-500/50 transition group"
                      >
                        <Link
                          href={lessonLink}
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition">
                              {lesson.title}
                            </p>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {lesson.duration || 'Auto'}
                            </span>
                          </div>
                        </Link>

                        <div className="flex items-center gap-2">
                          <Link
                            href={lessonLink}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                            title="Preview Lesson"
                          >
                            <PlayCircle className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleOpenModal(lesson)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Lesson"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(lesson)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No lessons added to this course yet. Click &quot;Add Lesson&quot; to create one.
                </div>
              )}
            </div>
          )}

          {/* 2. QUIZZES MANAGEMENT TAB (ADMIN VIEW) */}
          {activeTab === 'quizzes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-500" />
                    Quiz & Examination Control
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage multiple choice questions and check student answer submissions.
                  </p>
                </div>
                <Link
                  href={`/dashboard/content-manager/courses/${targetCourseId}/quizzes`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition shrink-0"
                >
                  <span>Open Quiz Manager</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Statistics Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Quiz Question Bank</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Total active quizzes: <span className="text-white font-bold">{quizzesCount}</span>. You can create, edit, and modify questions anytime.
                  </p>
                  <Link
                    href={`/dashboard/content-manager/courses/${targetCourseId}/quizzes`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-2"
                  >
                    Manage Question Sets ➔
                  </Link>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Student Exam Papers</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Total submissions received: <span className="text-white font-bold">{resultsCount}</span>. Review correct/incorrect answers for each student.
                  </p>
                  <Link
                    href={`/dashboard/content-manager/courses/${targetCourseId}/quizzes`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium pt-2"
                  >
                    Review Exam Submissions ➔
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 3. STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Enrolled Students List
              </h2>
              {currentStudents.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {currentStudents.map((st: any) => (
                        <tr key={st.id}>
                          <td className="py-3 font-medium text-white">{st.name}</td>
                          <td className="py-3 text-xs text-slate-400">{st.enrolledAt}</td>
                          <td className="py-3 text-xs text-indigo-400">{st.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1 border border-slate-800 rounded disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 border border-slate-800 rounded disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-xs py-6 text-center">No enrolled students yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Course Overview</h2>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">Status</span>
                <span className="text-indigo-400 font-bold">{course.progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${course.progressPercentage}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 text-center">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[11px] text-slate-400">Completed</p>
                <p className="text-lg font-bold text-emerald-400">{course.completedLessons}</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[11px] text-slate-400">Due / Pending</p>
                <p className="text-lg font-bold text-amber-400">{course.dueLessons}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Author Info</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0">
                {course.instructor?.username?.charAt(0).toUpperCase() || 'I'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{course.instructor?.username}</p>
                <p className="text-xs text-slate-500 truncate">{course.instructor?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Created on {course.createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ MODAL: CREATE / EDIT LESSON */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Orientation of Batch 2"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Video URL (YouTube/MP4) *</span>
                  {isDetectingDuration && (
                    <span className="text-[10px] text-indigo-400 animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Auto-detecting duration...
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={lessonForm.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Class Details / Description</label>
                <textarea
                  rows={3}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="What will be covered in this class..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Class Notes / Resources Link</label>
                <textarea
                  rows={2}
                  value={lessonForm.notes}
                  onChange={(e) => setLessonForm({ ...lessonForm, notes: e.target.value })}
                  placeholder="Drive links, slides, references..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
                  <span>{editingLesson ? 'Update Lesson' : 'Save Lesson'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3.5 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Lesson</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{lessonToDelete?.title}&quot;</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLessonToDelete(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition disabled:opacity-50"
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