'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  Users,
  Search,
  BookOpen,
  HelpCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Award,
  Filter,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';

export default function StudentProgressPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState<string | number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProgressData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (cleanToken) {
          headers['Authorization'] = `Bearer ${cleanToken}`;
        }

        const fetchSafe = async (endpoint: string) => {
          try {
            return await fetchApi(endpoint, { headers: headers as any });
          } catch {
            return { data: [] };
          }
        };

        const [coursesRes, enrollRes, quizRes] = await Promise.all([
          fetchSafe('/courses?populate=lessons'),
          fetchSafe('/enrollments?populate[0]=user&populate[1]=course'),
          fetchSafe('/quiz-results?populate[0]=user&populate[1]=quiz'),
        ]);

        if (!isMounted) return;

        const rawEnrollments = Array.isArray(enrollRes?.data) ? enrollRes.data : Array.isArray(enrollRes) ? enrollRes : [];
        const rawCourses = Array.isArray(coursesRes?.data) ? coursesRes.data : Array.isArray(coursesRes) ? coursesRes : [];
        const rawQuizResults = Array.isArray(quizRes?.data) ? quizRes.data : Array.isArray(quizRes) ? quizRes : [];

        // শুধুমাত্র আসল এনরোল্ড স্টুডেন্টদের সংগ্রহ করা
        const studentMap = new Map<string | number, any>();

        rawEnrollments.forEach((enr: any) => {
          const u = enr.user || enr.users_permissions_user;
          if (u) {
            const uid = u.documentId || u.id;
            if (!studentMap.has(uid)) {
              studentMap.set(uid, { ...u });
            }
          }
        });

        setStudents(Array.from(studentMap.values()));
        setCourses(rawCourses);
        setEnrollments(rawEnrollments);
        setQuizResults(rawQuizResults);
      } catch (err) {
        console.error('Failed to load student progress data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProgressData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (id: string | number) => {
    setExpandedStudentId(expandedStudentId === id ? null : id);
  };

  // সার্চ ও কোর্স ফিল্টারিং লজিক
  const filteredStudents = students.filter((s) => {
    const sId = s.documentId || s.id;
    const matchesSearch =
      (s.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCourseFilter !== 'all') {
      return enrollments.some(
        (e) =>
          ((e.user?.id === sId || e.user?.documentId === sId) ||
           (e.users_permissions_user?.id === sId || e.users_permissions_user?.documentId === sId)) &&
          (e.course?.id == selectedCourseFilter || e.course?.documentId == selectedCourseFilter)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Loading student analytics & progress metrics...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 lg:space-y-8 pb-10">
      {/* Full Width Gradient Banner */}
      <div className="relative overflow-hidden bg-[#0b101b] border border-slate-800/80 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Analytics & Oversight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 flex items-center gap-3">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
              Student Progress & Performance
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Monitor individual learning milestones, syllabus completion rates, and assessment test scores
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{students.length} Total Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Filter and Search Control */}
      <div className="bg-[#0b101b] border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, username or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full sm:w-72 px-3.5 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.documentId || c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List Container (Full Width Cards) */}
      <div className="space-y-4">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const studentId = student.documentId || student.id;
            const isExpanded = expandedStudentId === studentId;

            // এই নির্দিষ্ট শিক্ষার্থীর সমস্ত Enrollment
            const userEnrollments = enrollments.filter(
              (e) =>
                e.user?.id === studentId ||
                e.user?.documentId === studentId ||
                e.users_permissions_user?.id === studentId ||
                e.users_permissions_user?.documentId === studentId
            );

            // এই শিক্ষার্থীর সমস্ত Quiz Results
            const userQuizzes = quizResults.filter(
              (q) =>
                q.user?.id === studentId ||
                q.user?.documentId === studentId ||
                q.users_permissions_user?.id === studentId ||
                q.users_permissions_user?.documentId === studentId
            );

            // প্রতি কোর্সের প্রগ্রেস ক্যালকুলেশন
            let totalProgressSum = 0;
            const enrollmentDetails = userEnrollments.map((enr) => {
              const matchedCourse =
                courses.find(
                  (c) =>
                    c.id === enr.course?.id ||
                    c.documentId === enr.course?.documentId
                ) || enr.course;

              const totalLessons = matchedCourse?.lessons?.length || 0;
              let completedCount = 0;

              if (Array.isArray(enr.completed_lessons)) {
                completedCount = enr.completed_lessons.length;
              } else if (typeof enr.completed_lessons === 'object' && enr.completed_lessons !== null) {
                completedCount = Object.keys(enr.completed_lessons).length;
              }

              const progressPercent =
                totalLessons > 0
                  ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
                  : (enr.progress || 0);

              totalProgressSum += progressPercent;

              return {
                ...enr,
                matchedCourse,
                totalLessons,
                completedCount,
                progressPercent,
              };
            });

            const overallProgress =
              enrollmentDetails.length > 0
                ? Math.round(totalProgressSum / enrollmentDetails.length)
                : 0;

            return (
              <div
                key={studentId}
                className="w-full bg-[#0b101b] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-xl"
              >
                {/* Accordion Header Row */}
                <div
                  onClick={() => toggleExpand(studentId)}
                  className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 transition select-none"
                >
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-base shrink-0 shadow-lg shadow-emerald-500/5">
                      {student.username?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate">{student.username}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase tracking-wider">
                          Enrolled
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{student.email}</p>
                    </div>
                  </div>

                  {/* Middle & Right: Overall Progress Bar and Action */}
                  <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <div className="w-full md:w-64 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-400">Total Completion</span>
                        <span className="text-emerald-400 font-bold">{overallProgress}%</span>
                      </div>
                      <div className="w-full h-3 bg-[#060a12] border border-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:flex items-center gap-1.5 text-slate-300 bg-[#060a12] border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                        {userEnrollments.length} Courses
                      </span>

                      <div className="p-2 text-slate-400 hover:text-white bg-[#060a12] border border-slate-800 rounded-xl transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-8 bg-[#060a12]/80 border-t border-slate-800/80 space-y-8 animate-in fade-in duration-200">
                    {/* 1. Enrolled Courses Grid */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        Course Curriculum Progress ({enrollmentDetails.length})
                      </h4>

                      {enrollmentDetails.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {enrollmentDetails.map((item) => (
                            <div
                              key={item.id}
                              className="p-5 bg-[#0b101b] border border-slate-800 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-semibold text-white text-xs sm:text-sm truncate">
                                  {item.matchedCourse?.title || 'Course'}
                                </h5>
                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                                  {item.progressPercent}%
                                </span>
                              </div>

                              <div className="w-full h-2.5 bg-[#060a12] border border-slate-800 rounded-full overflow-hidden p-0.5">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${item.progressPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {item.completedCount}/{item.totalLessons} Lessons
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No courses enrolled yet.</p>
                      )}
                    </div>

                    {/* 2. Quizzes and Assessment Grid */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-400" />
                        Examination Submissions ({userQuizzes.length})
                      </h4>

                      {userQuizzes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {userQuizzes.map((q: any) => {
                            const score = q.score || 0;
                            const isPassed = score >= (q.quiz?.passScore || 60);

                            return (
                              <div
                                key={q.id}
                                className="p-4 bg-[#0b101b] border border-slate-800 rounded-xl flex items-center justify-between shadow-md"
                              >
                                <div className="truncate mr-3">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {q.quiz?.title || 'Quiz Test'}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    Submitted: {new Date(q.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-xs font-bold ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {score}%
                                  </span>
                                  <p className={`text-[10px] font-semibold mt-0.5 ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isPassed ? 'PASSED' : 'FAILED'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No quiz submissions recorded for this student.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-[#0b101b] border border-slate-800 rounded-2xl text-slate-500 text-xs sm:text-sm">
            No enrolled students match your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}