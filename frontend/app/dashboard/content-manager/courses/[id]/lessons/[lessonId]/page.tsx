// app/dashboard/content-manager/courses/[id]/lessons/[lessonId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import { extractYouTubeId } from '@/app/lib/videoUtils';
import {
  ArrowLeft,
  Video,
  FileText,
  Clock,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Layers,
  Plus,
  X,
} from 'lucide-react';

// 🛠️ Strapi Blocks / Rich Text রেন্ডারার
const extractStrapiText = (raw: any): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;

  if (Array.isArray(raw)) {
    return raw
      .map((block: any) => {
        if (block.children && Array.isArray(block.children)) {
          return block.children.map((c: any) => c.text || '').join('');
        }
        if (block.text) return block.text;
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof raw === 'object') {
    if (raw.text) return raw.text;
    if (raw.children) return extractStrapiText(raw.children);
  }

  return String(raw);
};

// 🛠️ টেক্সটকে Strapi Blocks ফরম্যাটে নেওয়া
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

export default function LessonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Adding New Lesson
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    videoUrl: '',
    description: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // ১. Fetch Course
      const isCourseNumeric = !isNaN(Number(courseId));
      const courseQueryParams = new URLSearchParams({
        'populate[thumbnail]': 'true',
        'populate[instructor]': 'true',
        'populate[creator]': 'true',
        'populate[lessons]': 'true',
      });

      let courseQuery = isCourseNumeric
        ? `/courses?filters[$or][0][id][$eq]=${courseId}&filters[$or][1][documentId][$eq]=${courseId}&${courseQueryParams.toString()}`
        : `/courses?filters[documentId][$eq]=${courseId}&${courseQueryParams.toString()}`;

      const courseRes = await fetchApi(courseQuery, authHeader);
      let foundCourse = null;
      if (courseRes?.data) {
        if (Array.isArray(courseRes.data) && courseRes.data.length > 0) {
          foundCourse = courseRes.data[0];
        } else if (!Array.isArray(courseRes.data)) {
          foundCourse = courseRes.data;
        }
      }

      if (foundCourse) {
        setCourse(foundCourse);
      }

      // ২. Fetch Current Lesson
      const isLessonNumeric = !isNaN(Number(lessonId));
      let lessonQuery = isLessonNumeric
        ? `/lessons?filters[$or][0][id][$eq]=${lessonId}&filters[$or][1][documentId][$eq]=${lessonId}&populate=*`
        : `/lessons?filters[documentId][$eq]=${lessonId}&populate=*`;

      const lessonRes = await fetchApi(lessonQuery, authHeader);

      let foundLesson = null;
      if (lessonRes?.data) {
        if (Array.isArray(lessonRes.data) && lessonRes.data.length > 0) {
          foundLesson = lessonRes.data[0];
        } else if (!Array.isArray(lessonRes.data)) {
          foundLesson = lessonRes.data;
        }
      }

      if (foundLesson) {
        const rawContent =
          foundLesson.content ??
          foundLesson.description ??
          foundLesson.body ??
          foundLesson.details;

        const rawNote = foundLesson.note ?? foundLesson.notes ?? foundLesson.resource;

        // 🎯 Strapi Video Field Parsing Fix
        const extractedVideoUrl =
          foundLesson.video_url ||
          foundLesson.videoUrl ||
          foundLesson.video ||
          foundLesson.url ||
          '';

        setLesson({
          id: foundLesson.id,
          documentId: foundLesson.documentId,
          title: foundLesson.title || 'Untitled Lesson',
          videoUrl: typeof extractedVideoUrl === 'string' ? extractedVideoUrl : '',
          description: extractStrapiText(rawContent),
          note: extractStrapiText(rawNote),
          createdAt: foundLesson.createdAt,
        });
      }

      // ৩. এই প্যারেন্ট কোর্সের সব লেসন আনা
      const currentDbCourseId = foundCourse?.id || courseId;
      const currentDocCourseId = foundCourse?.documentId || courseId;
      try {
        const allLessonsRes = await fetchApi(
          `/lessons?filters[$or][0][course][id][$eq]=${currentDbCourseId}&filters[$or][1][course][documentId][$eq]=${currentDocCourseId}&sort=order:asc,createdAt:asc`,
          authHeader
        );
        if (allLessonsRes?.data && Array.isArray(allLessonsRes.data)) {
          setAllLessons(allLessonsRes.data);
        }
      } catch (_) {}
    } catch (err) {
      console.error('Failed to load lesson details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId && courseId) loadData();
  }, [lessonId, courseId]);

  // 🚀 Save New Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) {
      alert('Parent course not found!');
      return;
    }

    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const targetDocId = course.documentId || courseId;

      const payload: any = {
        title: newLessonForm.title.trim(),
        video_url: newLessonForm.videoUrl.trim(),
        content: formatToStrapiBlocks(newLessonForm.description),
        note: newLessonForm.notes.trim(),
        order: (allLessons?.length || 0) + 1,
        course: targetDocId,
      };

      const res = await fetchApi('/lessons', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: payload }),
      });

      const createdItem = res?.data || res;
      const createdLessonDocId = createdItem?.documentId || createdItem?.id;

      if (createdLessonDocId) {
        try {
          await fetchApi(`/lessons/${createdLessonDocId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              data: {
                course: targetDocId,
              },
            }),
          });
        } catch (err) {
          console.warn('Fallback link:', err);
        }
      }

      setIsModalOpen(false);
      setNewLessonForm({ title: '', videoUrl: '', description: '', notes: '' });

      if (createdLessonDocId) {
        router.push(`/dashboard/content-manager/courses/${courseId}/lessons/${createdLessonDocId}`);
      } else {
        await loadData();
      }
    } catch (err: any) {
      console.error('Lesson creation error:', err);
      alert(err.message || 'Failed to create lesson');
    } finally {
      setModalLoading(false);
    }
  };

  // 🎯 STRICT YouTube Embed Parser (যাতে কখনোই ওয়েবসাইট রি-লোড না হতে পারে)
  const getEmbedUrl = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    // ওয়েবসাইট বা লোকাল লিঙ্ক সম্পূর্ণ ব্লক করবে
    if (cleanUrl.startsWith('/') || cleanUrl.includes(window.location.host)) {
      return null;
    }

    const videoId = extractYouTubeId(cleanUrl);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading lesson details...</span>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Lesson Not Found</h2>
        <Link
          href={`/dashboard/content-manager/courses/${courseId}`}
          className="inline-block mt-2 px-4 py-2 bg-indigo-600 rounded-xl text-xs text-white"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(lesson.videoUrl);

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
              {course?.title || 'Course'} / Lessons
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-500" />
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Add Lesson Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lesson</span>
        </button>
      </div>

      {/* Main Grid: Left Video Player & Notes + Right Info Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Video + Details + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Video Player */}
          <div className="aspect-video w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={lesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 p-6 text-center">
                <Video className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs">
                  {lesson.videoUrl
                    ? 'Invalid YouTube video URL'
                    : 'No video URL provided for this lesson'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Class Details Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              ক্লাস বিবরণ (Class Details)
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {lesson.description || 'এই ক্লাসের জন্য কোনো বিবরণ এখনো যুক্ত করা হয়নি।'}
            </div>
          </div>

          {/* 3. Class Notes & Resources Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              ক্লাস নোট এবং রিসোর্স (Class Notes & Links)
            </h3>
            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm text-slate-300 leading-relaxed whitespace-pre-line break-words">
              {lesson.note || 'কোনো রিসোর্স বা নোট লিংক সংযুক্ত নেই।'}
            </div>
          </div>
        </div>

        {/* Right Side: ক্লাস তথ্য ও প্যারেন্ট কোর্স ওভারভিউ */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              ক্লাস তথ্য
            </h3>

            <div className="divide-y divide-slate-800/70 text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 text-xs">ক্লাস শিরোনাম:</span>
                <span className="font-semibold text-white text-xs truncate max-w-[170px]">{lesson.title}</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 text-xs">ইন্সট্রাক্টর:</span>
                <span className="font-medium text-slate-200 text-xs">
                  {course?.instructor?.username || 'Lead Instructor'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 text-xs">তৈরি করেছেন (Author):</span>
                <span className="font-medium text-emerald-400 text-xs">
                  {course?.creator?.username || 'Platform Admin'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 text-xs">তারিখ:</span>
                <span className="font-medium text-slate-200 text-xs">
                  {lesson.createdAt
                    ? new Date(lesson.createdAt).toLocaleDateString('en-GB')
                    : 'N/A'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-400 text-xs">প্যারেন্ট কোর্স:</span>
                <Link
                  href={`/dashboard/content-manager/courses/${courseId}`}
                  className="font-medium text-indigo-400 hover:text-indigo-300 text-xs truncate max-w-[170px]"
                >
                  {course?.title || 'General'}
                </Link>
              </div>
            </div>
          </div>

          {/* এই কোর্সের অন্যান্য লেসন তালিকা */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              এই কোর্সের অন্যান্য লেসন ({allLessons.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allLessons.map((item: any, idx: number) => {
                const itemTargetId = item.documentId || item.id;
                const isCurrent = String(itemTargetId) === String(lessonId) || String(item.id) === String(lessonId);

                return (
                  <Link
                    key={item.id || idx}
                    href={`/dashboard/content-manager/courses/${courseId}/lessons/${itemTargetId}`}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition ${
                      isCurrent
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
                        : 'bg-slate-950/40 border border-slate-800/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="truncate flex-1">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ MODAL: CREATE LESSON */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Add New Lesson</h3>
                <p className="text-xs text-indigo-400">
                  Auto-assigning to: {course?.title}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  value={newLessonForm.title}
                  onChange={(e) =>
                    setNewLessonForm({ ...newLessonForm, title: e.target.value })
                  }
                  placeholder="e.g. Variables and Data Types"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Video URL (YouTube) *
                </label>
                <input
                  type="text"
                  required
                  value={newLessonForm.videoUrl}
                  onChange={(e) =>
                    setNewLessonForm({ ...newLessonForm, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Class Details / Description
                </label>
                <textarea
                  rows={3}
                  value={newLessonForm.description}
                  onChange={(e) =>
                    setNewLessonForm({
                      ...newLessonForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="What will be covered in this class..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Class Notes / Resources Link
                </label>
                <textarea
                  rows={2}
                  value={newLessonForm.notes}
                  onChange={(e) =>
                    setNewLessonForm({ ...newLessonForm, notes: e.target.value })
                  }
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
                  {modalLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Save Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}