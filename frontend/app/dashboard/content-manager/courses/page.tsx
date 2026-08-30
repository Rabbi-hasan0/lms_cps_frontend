// app/dashboard/content-manager/courses/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  BookOpen,
  Video,
  ChevronRight,
  Loader2,
  Plus,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  User,
  Upload,
  AlertTriangle,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🛠️ Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    instructorId: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // ⚠️ Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  const loadCourses = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetchApi('/courses?populate=*', { headers });
      setCourses(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setError(err.message || 'Failed to fetch courses. Please check Strapi permissions.');
    }
  }, []);

  const loadInstructors = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const users = await fetchApi('/users?populate=role', { headers });
      if (Array.isArray(users)) {
        const onlyInstructors = users.filter((u: any) => {
          const roleName = u.role?.name?.toLowerCase() || u.role?.type?.toLowerCase() || '';
          return (
            roleName.includes('instructor') ||
            roleName.includes('admin') ||
            roleName.includes('teacher')
          );
        });
        setInstructors(onlyInstructors);
      }
    } catch (err) {
      console.warn('Could not load instructor list, fallback to empty:', err);
      setInstructors([]);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const init = async () => {
      setLoading(true);
      setError('');
      await Promise.all([loadCourses(), loadInstructors()]);
      setLoading(false);
    };

    init();
  }, [router, loadCourses, loadInstructors]);

  // থাম্বনেইল ইমেজ URL বের করার হেল্পার
  const getThumbnailUrl = (course: any) => {
    const rawUrl =
      course.thumbnail?.url ||
      course.thumbnail?.data?.attributes?.url ||
      course.thumbnail?.[0]?.url;

    if (!rawUrl) return null;
    return rawUrl.startsWith('http') ? rawUrl : `${STRAPI_URL}${rawUrl}`;
  };

  // ✏️ Edit Modal ওপেন
  const handleOpenEditModal = (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCourse(course);
    setEditFormData({
      title: course.title || '',
      description: course.description || '',
      instructorId: course.instructor?.id ? course.instructor.id.toString() : '',
    });

    const existingThumb = getThumbnailUrl(course);
    setThumbnailPreview(existingThumb);
    setThumbnailFile(null);
    setIsEditModalOpen(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  // 💾 Update Course
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const targetId = editingCourse.documentId || editingCourse.id;

      let uploadedMediaId = null;

      // ১. থাম্বনেইল ফাইল থাকলে Strapi Media Library-তে আপলোড করা
      if (thumbnailFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('files', thumbnailFile);

        const uploadHeaders: Record<string, string> = {};
        if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

        const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          headers: uploadHeaders,
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errJson = await uploadRes.json().catch(() => ({}));
          throw new Error(errJson?.error?.message || 'Image upload failed. Please check Strapi upload permissions.');
        }

        const uploadJson = await uploadRes.json();
        if (Array.isArray(uploadJson) && uploadJson.length > 0) {
          uploadedMediaId = uploadJson[0].id;
        }
      }

      // ২. কোর্স পেলোড গঠন
      const payload: any = {
        title: editFormData.title,
        description: editFormData.description,
      };

      if (editFormData.instructorId) {
        payload.instructor = Number(editFormData.instructorId);
      }

      if (uploadedMediaId) {
        payload.thumbnail = uploadedMediaId;
      } else if (thumbnailPreview === null) {
        payload.thumbnail = null;
      }

      // ৩. ডাটাবেজে কোর্স আপডেট
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetchApi(`/courses/${targetId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: payload }),
      });

      setIsEditModalOpen(false);
      await loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to update course');
    } finally {
      setModalLoading(false);
    }
  };

  // ⚠️ Delete Confirmation Modal ওপেন
  const handleOpenDeleteModal = (e: React.MouseEvent, course: any) => {
    e.preventDefault();
    e.stopPropagation();
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  // 🗑️ নিশ্চিত ডিলিট অ্যাকশন
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setDeleteLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const targetId = courseToDelete.documentId || courseToDelete.id;

      await fetchApi(`/courses/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
      await loadCourses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course. Please check Strapi permissions.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Create, view, update and manage your courses
          </p>
        </div>
        <Link
          href="/dashboard/content-manager/courses/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition self-start sm:self-auto shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Course
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span>Loading courses...</span>
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {courses.map((course: any) => {
            const thumbnailUrl = getThumbnailUrl(course);
            const courseTargetId = course.documentId || course.id;

            return (
              <div
                key={course.id}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition flex flex-col justify-between shadow-lg max-w-sm w-full mx-auto"
              >
                <div>
                  {/* 🖼️ Top Banner Thumbnail */}
                  <div className="relative w-full h-40 bg-slate-950 overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-700">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}

                    {/* Quick Actions (Edit & Delete) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md p-1 rounded-lg border border-slate-800/80">
                      <button
                        onClick={(e) => handleOpenEditModal(e, course)}
                        className="p-1 text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 rounded transition"
                        title="Edit Course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenDeleteModal(e, course)}
                        className="p-1 text-slate-300 hover:text-red-400 hover:bg-slate-800/80 rounded transition"
                        title="Delete Course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 📝 Card Details */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-medium rounded-md border border-indigo-500/20 truncate max-w-35">
                        {course.instructor?.username || 'Lead Instructor'}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Video className="w-3 h-3 text-indigo-400" />
                        {course.lessons?.length || 0} Lessons
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/content-manager/courses/${courseTargetId}`}
                      className="block cursor-pointer"
                    >
                      <h2 className="text-base font-bold text-white group-hover:text-indigo-400 transition line-clamp-1">
                        {course.title}
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {course.description || 'No description provided.'}
                      </p>
                    </Link>
                  </div>
                </div>

                {/* 🔗 Footer Link */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/dashboard/content-manager/courses/${courseTargetId}`}
                    className="w-full flex items-center justify-center gap-1 py-2 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-xs font-medium text-slate-300 hover:text-white rounded-xl transition"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No courses found</p>
          <p className="text-xs text-slate-500 mt-1">
            Create your first course by clicking the Create Course button above.
          </p>
        </div>
      )}

      {/* 🛠️ MODAL: EDIT COURSE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Course Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Course title..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course Thumbnail</label>
                {thumbnailPreview ? (
                  <div className="relative w-full h-36 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden group">
                    <img
                      src={thumbnailPreview}
                      alt="Course Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeThumbnail}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition shadow"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                    <Upload className="w-6 h-6 text-slate-500 mb-1" />
                    <p className="text-xs text-slate-300 font-medium">Click to upload thumbnail</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Course description..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Instructor</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={editFormData.instructorId}
                    onChange={(e) => setEditFormData({ ...editFormData, instructorId: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.username} ({ins.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL: CUSTOM DELETE CONFIRMATION */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3.5 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Course</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{courseToDelete?.title}&quot;</span>? All associated lessons and enrolments may be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCourseToDelete(null);
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