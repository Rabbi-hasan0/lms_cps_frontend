// app/dashboard/student/courses/[id]/lessons/[lessonId]/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import { extractYouTubeId } from '@/app/lib/videoUtils';
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Loader2,
  GraduationCap,
  FileText,
  Clock,
  ListVideo,
  Video,
  Layers,
} from 'lucide-react';

// 🛠️ Strapi Rich Text (Blocks) এক্সট্রাক্টর
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

export default function StudentLessonPlayerPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [course, setCourse] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  // 🎯 YouTube / Vimeo Embed URL রূপান্তরকারী
  const getEmbedUrl = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    if (typeof window !== 'undefined' && (cleanUrl.startsWith('/') || cleanUrl.includes(window.location.host))) {
      return null;
    }

    const videoId = extractYouTubeId(cleanUrl);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
    }

    if (cleanUrl.includes('player.vimeo.com/video/')) {
      return cleanUrl;
    }
    if (cleanUrl.includes('vimeo.com/')) {
      const id = cleanUrl.split('vimeo.com/')[1]?.split(/[?#]/)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    return null;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
      const authHeader = cleanToken ? { headers: { Authorization: `Bearer ${cleanToken}` } } : {};

      // ১. বর্তমান স্টুডেন্ট ফেচ
      const me = await fetchApi('/users/me', authHeader);
      if (!me?.id) {
        router.push('/login');
        return;
      }

      // ২. কোর্স ফেচ (নিরাপদ ফ্ল্যাট কুয়েরি)
      const isCourseNumeric = !isNaN(Number(courseId));
      const courseQuery = isCourseNumeric
        ? `/courses?filters[$or][0][id][$eq]=${courseId}&filters[$or][1][documentId][$eq]=${courseId}&populate[instructor]=true&populate[thumbnail]=true`
        : `/courses?filters[documentId][$eq]=${courseId}&populate[instructor]=true&populate[thumbnail]=true`;

      let foundCourse = null;
      try {
        const courseRes = await fetchApi(courseQuery, authHeader);
        if (courseRes?.data && Array.isArray(courseRes.data) && courseRes.data.length > 0) {
          foundCourse = courseRes.data[0];
        } else if (courseRes?.data && !Array.isArray(courseRes.data)) {
          foundCourse = courseRes.data;
        } else if (courseRes && !courseRes.data) {
          foundCourse = courseRes;
        }
      } catch (err) {
        console.warn('Course fetch error:', err);
      }

      if (foundCourse) {
        setCourse(foundCourse);
      }

      const currentDbCourseId = foundCourse?.id || courseId;
      const currentDocCourseId = foundCourse?.documentId || courseId;

      // ৩. এই কোর্সের সমস্ত লেসন ও কুইজ আলাদা এন্ডপয়েন্ট থেকে ফেচ
      const [lessonsRes, quizzesRes] = await Promise.all([
        fetchApi(
          `/lessons?filters[$or][0][course][id][$eq]=${currentDbCourseId}&filters[$or][1][course][documentId][$eq]=${currentDocCourseId}&sort=order:asc,createdAt:asc`,
          authHeader
        ).catch(() => ({ data: [] })),
        fetchApi(
          `/quizzes?filters[$or][0][course][id][$eq]=${currentDbCourseId}&filters[$or][1][course][documentId][$eq]=${currentDocCourseId}`,
          authHeader
        ).catch(() => ({ data: [] })),
      ]);

      const formattedLessons = Array.isArray(lessonsRes?.data)
        ? lessonsRes.data
        : Array.isArray(lessonsRes)
        ? lessonsRes
        : [];
      setLessonsList(formattedLessons);

      const formattedQuizzes = Array.isArray(quizzesRes?.data)
        ? quizzesRes.data
        : Array.isArray(quizzesRes)
        ? quizzesRes
        : [];
      setQuizzesList(formattedQuizzes);

      // ৪. সিলেক্টেড লেসন বের করা
      let foundLesson = null;
      if (lessonId && lessonId !== 'undefined') {
        foundLesson = formattedLessons.find(
          (l: any) =>
            String(l.documentId) === String(lessonId) ||
            String(l.id) === String(lessonId)
        );
      }

      if (!foundLesson && formattedLessons.length > 0) {
        foundLesson = formattedLessons[0];
      }

      if (foundLesson) {
        const itemData = foundLesson.attributes ? { id: foundLesson.id, ...foundLesson.attributes } : foundLesson;

        const rawContent = itemData.content ?? itemData.description;
        const rawNote = itemData.note;
        const extractedVideoUrl = itemData.video_url || itemData.videoUrl || '';

        setCurrentLesson({
          id: itemData.id,
          documentId: itemData.documentId,
          title: itemData.title || 'Untitled Lesson',
          videoUrl: typeof extractedVideoUrl === 'string' ? extractedVideoUrl : '',
          description: extractStrapiText(rawContent),
          note: extractStrapiText(rawNote),
          createdAt: itemData.createdAt,
          order: itemData.order || 1,
        });
      }

      // ৫. স্টুডেন্টের এনরোলমেন্ট ডাটা ফেচ
      const enrollRes = await fetchApi(
        `/enrollments?filters[$or][0][user][id][$eq]=${me.id}${
          me.documentId ? `&filters[$or][1][user][documentId][$eq]=${me.documentId}` : ''
        }&populate[course]=true`,
        authHeader
      ).catch(() => ({ data: [] }));

      const rawEnrollments = Array.isArray(enrollRes?.data) ? enrollRes.data : Array.isArray(enrollRes) ? enrollRes : [];
      const myEnrollment = rawEnrollments.find((enr: any) => {
        const c = enr.attributes?.course?.data || enr.course?.data || enr.course;
        const eCourseId = c?.id || c?.documentId;
        return (
          String(eCourseId) === String(currentDbCourseId) ||
          String(eCourseId) === String(currentDocCourseId) ||
          String(eCourseId) === String(courseId)
        );
      });

      if (myEnrollment) {
        setEnrollment(myEnrollment);
        const enrItem = myEnrollment.attributes || myEnrollment;
        let compArr: string[] = [];

        if (Array.isArray(enrItem.completed_lessons)) {
          compArr = enrItem.completed_lessons.map((x: any) => String(x));
        } else if (typeof enrItem.completed_lessons === 'object' && enrItem.completed_lessons !== null) {
          compArr = Object.keys(enrItem.completed_lessons);
        }
        setCompletedLessons(compArr);
      }
    } catch (err) {
      console.error('Failed to load lesson player:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, router]);

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId, lessonId, loadData]);

  const handleSelectLesson = (targetLesson: any) => {
    const targetRef = targetLesson.documentId || targetLesson.id;
    router.push(`/dashboard/student/courses/${courseId}/lessons/${targetRef}`);
  };

    const handleToggleComplete = async () => {
        if (!currentLesson || !enrollment) return;

        const curRef = String(currentLesson.documentId || currentLesson.id);
        const isAlreadyDone = completedLessons.includes(curRef);

        let updatedList = isAlreadyDone
        ? completedLessons.filter((id) => id !== curRef)
        : [...completedLessons, curRef];

        setCompletedLessons(updatedList);
        setMarkingComplete(true);

        try {
        // 🔑 টোকেন রিড করার জন্য আরও সিকিউর ও ক্লিন পদ্ধতি
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (cleanToken) {
            headers['Authorization'] = `Bearer ${cleanToken}`;
        }

        const totalLessonsCount = lessonsList.length || 1;
        const newProgressPercent = Math.min(
            100,
            Math.round((updatedList.length / totalLessonsCount) * 100)
        );

        const enrollTargetId = enrollment.documentId || enrollment.id;

        await fetchApi(`/enrollments/${enrollTargetId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
            data: {
                completed_lessons: updatedList,
                progress: newProgressPercent,
            },
            }),
        });

        if (!isAlreadyDone) {
            const currentIndex = lessonsList.findIndex(
            (l) => String(l.documentId || l.id) === curRef
            );
            if (currentIndex !== -1 && currentIndex < lessonsList.length - 1) {
            const nextLesson = lessonsList[currentIndex + 1];
            const nextRef = nextLesson.documentId || nextLesson.id;
            router.push(`/dashboard/student/courses/${courseId}/lessons/${nextRef}`);
            }
        }
        } catch (err: any) {
        console.error('Progress update failed:', err);
        alert(err?.message || 'Failed to update progress. Please log in again.');
        } finally {
        setMarkingComplete(false);
        }
    };

  const currentLessonIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return lessonsList.findIndex(
      (l) => String(l.documentId || l.id) === String(currentLesson.documentId || currentLesson.id)
    );
  }, [currentLesson, lessonsList]);

  const prevLesson = currentLessonIndex > 0 ? lessonsList[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex !== -1 && currentLessonIndex < lessonsList.length - 1
      ? lessonsList[currentLessonIndex + 1]
      : null;

  const progressPercentage = lessonsList.length
    ? Math.round((completedLessons.length / lessonsList.length) * 100)
    : 0;

  const isCurrentCompleted =
    currentLesson && completedLessons.includes(String(currentLesson.documentId || currentLesson.id));

  const embedUrl = currentLesson ? getEmbedUrl(currentLesson.videoUrl) : null;

  if (loading) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Loading playlist & video lectures...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-12">
      {/* 🧭 Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/student/courses"
            className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
              {course?.title || 'Course'}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-white truncate mt-1">
              {currentLesson?.title || 'Select a lesson'}
            </h1>
          </div>
        </div>

        <div className="w-full sm:w-56 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Course Progress</span>
            <span className="text-emerald-400 font-bold">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🎬 Main Player Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Video + Details + Notes */}
        <div className="lg:col-span-8 space-y-5">
          <div className="relative w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={currentLesson?.title || 'Video Player'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500 p-6 text-center">
                <Video className="w-14 h-14 stroke-[1.2] text-slate-600" />
                <p className="text-sm font-medium text-slate-400">
                  {currentLesson?.videoUrl
                    ? 'Video is processing or invalid link.'
                    : 'No video uploaded for this session.'}
                </p>
                <p className="text-xs text-slate-600">Review the lecture text below.</p>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <button
              onClick={handleToggleComplete}
              disabled={markingComplete || !currentLesson}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition ${
                isCurrentCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {markingComplete ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isCurrentCompleted ? 'Completed (Click to Undo)' : 'Mark as Completed'}</span>
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                ক্লাস বিবরণ (Class Details)
              </h3>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {currentLesson?.description || 'এই ক্লাসের জন্য কোনো বিবরণ এখনো যুক্ত করা হয়নি।'}
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                ক্লাস নোট এবং রিসোর্স (Class Notes & Links)
              </h3>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line break-words">
              {currentLesson?.note || 'কোনো রিসোর্স বা নোট লিংক সংযুক্ত নেই।'}
            </div>
          </div>
        </div>

        {/* Right Side: YouTube-Style Playlist Sidebar */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-2xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-emerald-400" />
                  Course Playlist
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {completedLessons.length} / {lessonsList.length} Lessons Finished
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                {progressPercentage}%
              </span>
            </div>

            {/* Playlist Container */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
              {lessonsList.length > 0 ? (
                lessonsList.map((lessonItem, idx) => {
                  const lRef = String(lessonItem.documentId || lessonItem.id);
                  const isCurrent =
                    currentLesson &&
                    String(currentLesson.documentId || currentLesson.id) === lRef;
                  const isDone = completedLessons.includes(lRef);

                  return (
                    <button
                      key={lessonItem.id || idx}
                      onClick={() => handleSelectLesson(lessonItem)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all duration-150 ${
                        isCurrent
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-white shadow-md'
                          : 'bg-slate-950/70 border border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isCurrent
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-emerald-400 font-bold' : 'text-slate-200'
                            }`}
                          >
                            {lessonItem.title || `Lesson ${idx + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <PlayCircle className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Lecture Video</span>
                          </p>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No lessons found in this course.
                </div>
              )}
            </div>

            {/* Quizzes Footer */}
            {quizzesList.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 text-indigo-400" />
                  Course Quizzes
                </span>
                {quizzesList.map((quiz, idx) => (
                  <Link
                    key={quiz.id || idx}
                    href={`/dashboard/student/courses/${courseId}/quizzes/${quiz.documentId || quiz.id}`}
                    className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-between text-indigo-300 hover:text-white transition group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition shrink-0" />
                      <span className="text-xs font-semibold truncate">
                        {quiz.title || 'Course Quiz'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}