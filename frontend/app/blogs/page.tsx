// app/blogs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Search,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

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
      .join(' ');
  }
  if (typeof raw === 'object') {
    if (raw.text) return raw.text;
    if (raw.children) return extractStrapiText(raw.children);
  }
  return String(raw);
};

export default function StudentBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const res = await fetchApi('/blogs?sort=createdAt:desc&populate=*', authHeader).catch(() => null);
        const rawData = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        
        const formattedBlogs = rawData.map((item: any) => {
          const attr = item.attributes || item;
          return {
            id: item.id,
            documentId: item.documentId,
            title: attr.title || 'Untitled Update',
            content: extractStrapiText(attr.body || attr.content || ''),
            createdAt: attr.createdAt || new Date().toISOString(),
            status: attr.blog_status || 'Published',
          };
        });

        setBlogs(formattedBlogs);
      } catch (err) {
        console.error('Failed to load blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium">Loading recent updates & blogs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider">
              Student Feed
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              Recent Updates & Blogs
            </h1>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog, idx) => {
            const isLatest = idx === 0 && !searchQuery;

            return (
              <div
                key={blog.documentId || blog.id}
                className={`bg-slate-900 border rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-4 shadow-xl transition-all duration-200 hover:border-slate-700 ${
                  isLatest ? 'md:col-span-2 border-emerald-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20' : 'border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isLatest && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          🔥 Latest Update
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        {blog.status}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(blog.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition cursor-pointer">
                      {blog.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                      {blog.content}
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Published recently
                  </span>

                  <Link
                    href={`/blogs/${blog.documentId || blog.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition group bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl"
                  >
                    <span>Read Full Update</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto stroke-[1.2]" />
            <p className="text-sm font-medium">No recent updates or blogs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}