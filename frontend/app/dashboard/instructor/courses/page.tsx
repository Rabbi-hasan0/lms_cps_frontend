'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Video,
  ChevronRight,
  BookOpen,
  Loader2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';

interface Course {
  id: number | string;
  documentId?: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  creator?: any;
  instructor?: any;
  lessons?: any[];
}

export default function InstructorCoursesPage() {
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; course: Course | null }>({
    isOpen: false,
    course: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // ১. কারেন্ট ইউজার ফেচ
      const me = await fetchApi('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ২. সুনির্দিষ্ট ফিল্ড পপুলেট (যাতে creator.role ক্র্যাশ না করে)
      const queryParams = new URLSearchParams({
        'populate[thumbnail]': 'true',
        'populate[lessons]': 'true',
        'populate[creator][fields][0]': 'id',
        'populate[creator][fields][1]': 'username',
        'populate[creator][fields][2]': 'email',
        'populate[instructor][fields][0]': 'id',
        'populate[instructor][fields][1]': 'username',
        'populate[instructor][fields][2]': 'email',
      });

      const res = await fetchApi(`/courses?${queryParams.toString()}`);
      const list = res?.data || [];

      const myCreated: Course[] = [];
      const assignedToMe: Course[] = [];

      const currentUserId = Number(me.id);
      const currentUserDocId = me.documentId ? String(me.documentId) : '';
      const currentUserEmail = me.email ? me.email.toLowerCase().trim() : '';

      list.forEach((item: any) => {
        // Thumbnail URL প্রসেসিং
        const imgObj = item.thumbnail || item.attributes?.thumbnail?.data?.attributes;
        let thumb = imgObj?.url || '';
        if (thumb && !thumb.startsWith('http')) {
          thumb = `http://localhost:1337${thumb}`;
        }

        const rawCreator = item.creator || item.attributes?.creator?.data || item.attributes?.creator;
        const rawInstructor = item.instructor || item.attributes?.instructor?.data || item.attributes?.instructor;

        const courseItem: Course = {
          id: item.id,
          documentId: item.documentId || item.id,
          title: item.title || item.attributes?.title || 'Untitled Course',
          description: item.description || item.attributes?.description || '',
          category: item.category || item.attributes?.category || 'instructor',
          thumbnailUrl: thumb || '/placeholder-course.png',
          creator: rawCreator,
          instructor: rawInstructor,
          lessons: item.lessons || item.attributes?.lessons?.data || item.attributes?.lessons || [],
        };

        // ID এক্সট্র্যাক্ট
        const creatorId = rawCreator ? Number(rawCreator.id) : null;
        const creatorDocId = rawCreator?.documentId ? String(rawCreator.documentId) : '';
        const creatorEmail = rawCreator?.email ? String(rawCreator.email).toLowerCase().trim() : '';

        const instructorId = rawInstructor ? Number(rawInstructor.id) : null;
        const instructorDocId = rawInstructor?.documentId ? String(rawInstructor.documentId) : '';
        const instructorEmail = rawInstructor?.email ? String(rawInstructor.email).toLowerCase().trim() : '';

        const isCreator =
          creatorId === currentUserId ||
          (currentUserDocId !== '' && creatorDocId === currentUserDocId) ||
          (currentUserEmail !== '' && creatorEmail === currentUserEmail);

        const isInstructor =
          instructorId === currentUserId ||
          (currentUserDocId !== '' && instructorDocId === currentUserDocId) ||
          (currentUserEmail !== '' && instructorEmail === currentUserEmail);

        // ১. নিজের তৈরি কোর্স
        if (isCreator) {
          myCreated.push(courseItem);
        }
        // ২. অ্যাসাইন করা কোর্স
        else if (isInstructor) {
          assignedToMe.push(courseItem);
        }
      });

      setCreatedCourses(myCreated);
      setAssignedCourses(assignedToMe);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteModal.course) return;
    try {
      setDeleting(true);
      const targetId = deleteModal.course.documentId || deleteModal.course.id;
      await fetchApi(`/courses/${targetId}`, {
        method: 'DELETE',
      });
      setCreatedCourses((prev) => prev.filter((c) => (c.documentId || c.id) !== targetId));
      setDeleteModal({ isOpen: false, course: null });
    } catch (err) {
      alert('Failed to delete course.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading course catalog...</p>
      </div>
    );
  }

  const renderCourseCard = (course: Course, isOwner: boolean) => {
    const courseId = course.documentId || course.id;
    const lessonCount = course.lessons?.length || 0;

    return (
      <div
        key={courseId}
        className="bg-[#0b101b] border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-xl group"
      >
        <div>
          <div className="relative w-full h-44 bg-white/5 flex items-center justify-center overflow-hidden">
            {course.thumbnailUrl && course.thumbnailUrl !== '/placeholder-course.png' ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900/60">
                <BookOpen className="w-16 h-16 text-indigo-500/40" />
              </div>
            )}

            {isOwner && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#1e2433]/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
                <Link
                  href={`/dashboard/instructor/courses/${courseId}/edit`}
                  className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                  title="Edit Course"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, course })}
                  className="p-1 text-slate-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                  title="Delete Course"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-950/70 border border-indigo-800/40 text-indigo-400 text-[11px] font-medium rounded-lg">
                {course.category}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Video className="w-3.5 h-3.5" />
                <span>{lessonCount} Lessons</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-indigo-400 transition">
              {course.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {course.description || 'No description provided.'}
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 pt-1 flex items-center gap-2">
          <Link
            href={`/dashboard/instructor/courses/${courseId}`}
            className="flex-1 py-2.5 bg-[#060a12] hover:bg-slate-800/60 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center transition"
          >
            View Details
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Course Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, view, update and manage your courses
          </p>
        </div>
        <Link
          href="/dashboard/instructor/courses/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </Link>
      </div>

      {/* SECTION 1: My Created Courses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FolderOpen className="w-4 h-4 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">My Created Courses</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-medium ml-1">
            {createdCourses.length}
          </span>
        </div>

        {createdCourses.length === 0 ? (
          <div className="text-center py-10 bg-[#0b101b]/60 border border-dashed border-slate-800 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">You haven't created any courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdCourses.map((c) => renderCourseCard(c, true))}
          </div>
        )}
      </div>

      {/* SECTION 2: Assigned to Me */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Assigned to Me</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-medium ml-1">
            {assignedCourses.length}
          </span>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="text-center py-10 bg-[#0b101b]/60 border border-dashed border-slate-800 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No external courses currently assigned to you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedCourses.map((c) => renderCourseCard(c, false))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Course</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-white">"{deleteModal.course?.title}"</strong>? All associated
              lessons and quizzes will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, course: null })}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Course</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}