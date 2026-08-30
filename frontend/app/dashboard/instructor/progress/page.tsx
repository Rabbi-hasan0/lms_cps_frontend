'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  Users,
  Search,
  BookOpen,
  GraduationCap,
  Calendar,
  Loader2,
  Mail,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpRight,
} from 'lucide-react';

interface StudentProgress {
  id: string | number;
  studentId: string | number;
  studentName: string;
  studentEmail: string;
  courseId: string | number;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
}

export default function InstructorStudentsProgressPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [coursesList, setCoursesList] = useState<{ id: string | number; title: string }[]>([]);
  const [studentProgressList, setStudentProgressList] = useState<StudentProgress[]>([]);

  useEffect(() => {
    loadInstructorStudents();
  }, []);

  const loadInstructorStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // ১. কারেন্ট ইন্সট্রাক্টরের প্রোফাইল ফেচ
      const me = await fetchApi('/users/me', { headers });
      if (!me?.id) return;

      const currentUserId = Number(me.id);
      const currentUserDocId = me.documentId ? String(me.documentId) : '';

      // ২. এই ইন্সট্রাক্টরের কোর্স ও এনরোলমেন্ট ডাটা ফেচ
      const queryParams = new URLSearchParams({
        'populate[creator][fields][0]': 'id',
        'populate[creator][fields][1]': 'documentId',
        'populate[instructor][fields][0]': 'id',
        'populate[instructor][fields][1]': 'documentId',
        'populate[enrollments][populate][user]': 'true',
      });

      const coursesRes = await fetchApi(`/courses?${queryParams.toString()}`, { headers });
      const rawCourses = Array.isArray(coursesRes?.data) ? coursesRes.data : [];

      // ৩. শুধুমাত্র নিজের তৈরি অথবা অ্যাসাইন করা কোর্সগুলো ফিল্টার
      const myCourses = rawCourses.filter((course: any) => {
        const item = course.attributes || course;
        const cCreator = item.creator?.data?.attributes || item.creator;
        const cInstructor = item.instructor?.data?.attributes || item.instructor;

        const creatorId = cCreator ? Number(cCreator.id) : null;
        const creatorDocId = cCreator?.documentId ? String(cCreator.documentId) : '';
        const instructorId = cInstructor ? Number(cInstructor.id) : null;
        const instructorDocId = cInstructor?.documentId ? String(cInstructor.documentId) : '';

        return (
          creatorId === currentUserId ||
          (currentUserDocId && creatorDocId === currentUserDocId) ||
          instructorId === currentUserId ||
          (currentUserDocId && instructorDocId === currentUserDocId)
        );
      });

      // ড্রপডাউন ফিল্টারের জন্য কোর্সের তালিকা
      const coursesDropdown = myCourses.map((c: any) => {
        const item = c.attributes || c;
        return {
          id: c.documentId || c.id,
          title: item.title || 'Untitled Course',
        };
      });
      setCoursesList(coursesDropdown);

      // ৪. এনরোলড স্টুডেন্টদের প্রগ্রেস লিস্ট বের করা
      const progressData: StudentProgress[] = [];

      myCourses.forEach((c: any) => {
        const courseData = c.attributes || c;
        const courseRefId = c.documentId || c.id;
        const cTitle = courseData.title || 'Untitled Course';

        const rawEnrollments = courseData.enrollments?.data || courseData.enrollments || [];

        rawEnrollments.forEach((enr: any, idx: number) => {
          const enrData = enr.attributes || enr;
          const u = enrData.user?.data?.attributes || enrData.user || enrData.student;

          if (u) {
            progressData.push({
              id: `${courseRefId}-${u.id || idx}`,
              studentId: u.id || idx,
              studentName: u.username || 'Student',
              studentEmail: u.email || 'No email',
              courseId: courseRefId,
              courseTitle: cTitle,
              enrolledAt: enrData.createdAt
                ? new Date(enrData.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent',
              progress: typeof enrData.progress === 'number' ? enrData.progress : 0,
            });
          }
        });
      });

      setStudentProgressList(progressData);
    } catch (err) {
      console.error('Failed to load instructor students progress:', err);
    } finally {
      setLoading(false);
    }
  };

  // সার্চ ও কোর্স ফিল্টারিং লজিক
  const filteredList = useMemo(() => {
    return studentProgressList.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCourse =
        selectedCourseFilter === 'ALL' || String(item.courseId) === String(selectedCourseFilter);

      return matchSearch && matchCourse;
    });
  }, [studentProgressList, searchTerm, selectedCourseFilter]);

  // স্ট্যাটিস্টিকস
  const totalEnrolledStudents = studentProgressList.length;
  const completedStudents = studentProgressList.filter((s) => s.progress >= 100).length;
  const inProgressStudents = studentProgressList.filter((s) => s.progress > 0 && s.progress < 100).length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading enrolled students progress...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-500" />
            Students Progress
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track student learning progress only for your created & assigned courses
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b101b] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Enrolled</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{totalEnrolledStudents}</h3>
          </div>
        </div>

        <div className="bg-[#0b101b] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">In Progress</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{inProgressStudents}</h3>
          </div>
        </div>

        <div className="bg-[#0b101b] border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completed (100%)</p>
            <h3 className="text-xl font-bold text-white mt-0.5">{completedStudents}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b101b] border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or course..."
            className="w-full pl-10 pr-4 py-2 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All My Courses ({coursesList.length})</option>
            {coursesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Data Table */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#060a12]/60 text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Enrolled Course</th>
                  <th className="py-3.5 px-5">Enrolled Date</th>
                  <th className="py-3.5 px-5 min-w-[200px]">Progress</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    {/* Student Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                          {item.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{item.studentName}</p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {item.studentEmail}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course Title */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{item.courseTitle}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-5 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.enrolledAt}</span>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4 px-5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">
                            {item.progress >= 100
                              ? 'Completed'
                              : item.progress === 0
                              ? 'Not Started'
                              : 'In Progress'}
                          </span>
                          <span
                            className={`font-bold ${
                              item.progress >= 100
                                ? 'text-emerald-400'
                                : item.progress > 0
                                ? 'text-indigo-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#060a12] border border-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              item.progress >= 100
                                ? 'bg-emerald-500'
                                : item.progress > 0
                                ? 'bg-indigo-600'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Course Link */}
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/dashboard/instructor/courses/${item.courseId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#060a12] hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-lg transition"
                      >
                        <span>Course</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="text-xs">No enrolled students found for your courses.</p>
          </div>
        )}
      </div>
    </div>
  );
}