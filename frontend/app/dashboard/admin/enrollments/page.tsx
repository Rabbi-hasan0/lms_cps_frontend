'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/app/lib/api';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  CreditCard,
  Loader2,
  Search,
  BookOpen,
  Filter,
} from 'lucide-react';

export default function AdminEnrollmentRequestsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');

    const loadEnrollments = async () => {
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

        // Strapi v5 Compatible Population Query (user + course + thumbnail)
        const queryParams = new URLSearchParams({
            'populate[user][fields][0]': 'username',
            'populate[user][fields][1]': 'email',
            'populate[course][fields][0]': 'title',
            'populate[course][fields][1]': 'documentId',
            'sort': 'createdAt:desc',
        });

        let res = await fetchApi(`/enrollments?${queryParams.toString()}`, { headers }).catch(() => null);

        // Fallback: যদি স্পেসিফিক কুয়েরি ফেইল করে, populate=* দিয়ে চেষ্টা করবে
        if (!res?.data) {
            res = await fetchApi('/enrollments?populate=*&sort=createdAt:desc', { headers }).catch(() => null);
        }

        let dataArray: any[] = [];
        if (res?.data && Array.isArray(res.data)) {
            dataArray = res.data;
        } else if (Array.isArray(res)) {
            dataArray = res;
        }

        setEnrollments(dataArray);
        } catch (err) {
        console.error('Failed to load enrollments:', err);
        setEnrollments([]);
        } finally {
        setLoading(false);
        }
    };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const handleUpdateStatus = async (id: string | number, newStatus: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetchApi(`/enrollments/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          data: { status_enrollment: newStatus },
        }),
      });

      await loadEnrollments();
    } catch (err: any) {
      alert(err.message || 'Failed to update enrollment status');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredEnrollments = enrollments.filter((enr: any) => {
    const item = enr.attributes || enr;
    const user = item.user?.data?.attributes || item.user;
    const course = item.course?.data?.attributes || item.course;
    const currentStatus = item.status_enrollment || item.status || 'pending';

    const statusMatch = filterStatus === 'all' ? true : currentStatus === filterStatus;
    const searchMatch =
      (user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone || '').includes(searchTerm) ||
      (item.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="w-full space-y-6 lg:space-y-8 pb-10">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-500" />
            Course Enrollment Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review student applications, verify transaction details and grant course access.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, phone, trx id or course..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="pending">Pending Requests</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Requests</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs">Loading requests...</span>
          </div>
        ) : filteredEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-5">Phone & Payment</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEnrollments.map((enr: any) => {
                  const item = enr.attributes || enr;
                  const user = item.user?.data?.attributes || item.user;
                  const course = item.course?.data?.attributes || item.course;
                  const targetId = enr.documentId || enr.id;
                  const isProcessing = processingId === targetId;
                  const status = item.status_enrollment || item.status || 'pending';

                  return (
                    <tr key={enr.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-white">{user?.username || 'Student'}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{user?.email || 'No email'}</p>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{course?.title || 'Course'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 space-y-1">
                        <p className="text-slate-300 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {item.phone || 'N/A'}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {item.payment_method || 'Direct'} {item.transaction_id ? `• Trx: ${item.transaction_id}` : ''}
                        </p>
                      </td>

                      <td className="py-4 px-5 text-slate-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {status === 'pending' && <Clock className="w-3 h-3" />}
                          {status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(targetId, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Approve
                            </button>
                            <button
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(targetId, 'rejected')}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            No enrollment requests found matching the filter.
          </div>
        )}
      </div>
    </div>
  );
}