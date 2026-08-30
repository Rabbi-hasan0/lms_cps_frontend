// app/dashboard/content-manager/blogs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
  Edit2,
  FileText,
} from 'lucide-react';

interface BlogPost {
  id: number;
  documentId?: string;
  title: string;
  body?: any;
  cover_image_url?: any;
  blog_status?: string;
  author?: {
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

// 🛠️ Strapi Rich Text / Blocks সুন্দরভাবে রেন্ডার করার কম্পোনেন্ট
const RenderBlocks = ({ content }: { content: any }) => {
  if (!content) return <p className="text-slate-500 italic">No content available.</p>;

  if (typeof content === 'string') {
    return (
      <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
        {content}
      </div>
    );
  }

  if (Array.isArray(content)) {
    return (
      <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
        {content.map((block: any, idx: number) => {
          if (block.type === 'heading') {
            const level = block.level || 2;
            const text = block.children?.map((c: any) => c.text).join('') || '';
            if (level === 1) return <h1 key={idx} className="text-2xl font-bold text-white pt-4">{text}</h1>;
            if (level === 2) return <h2 key={idx} className="text-xl font-bold text-white pt-3">{text}</h2>;
            return <h3 key={idx} className="text-lg font-semibold text-white pt-2">{text}</h3>;
          }

          if (block.type === 'list') {
            const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={idx} className={`space-y-1.5 pl-6 ${block.format === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
                {block.children?.map((item: any, itemIdx: number) => (
                  <li key={itemIdx} className="text-slate-300">
                    {item.children?.map((c: any) => c.text).join('')}
                  </li>
                ))}
              </ListTag>
            );
          }

          if (block.type === 'quote') {
            return (
              <blockquote key={idx} className="p-4 my-4 border-l-4 border-indigo-500 bg-slate-950/60 rounded-r-xl italic text-slate-300">
                {block.children?.map((c: any) => c.text).join('')}
              </blockquote>
            );
          }

          // ডিফল্ট প্যারাগ্রাফ
          const text = block.children?.map((c: any) => {
            let el = c.text || '';
            return el;
          }).join('');

          return text ? <p key={idx} className="leading-relaxed">{text}</p> : null;
        })}
      </div>
    );
  }

  return null;
};

export default function BlogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = params?.id as string;

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  useEffect(() => {
    const loadBlogDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const isNumeric = !isNaN(Number(blogId));
        const query = isNumeric
          ? `/blogs?filters[$or][0][id][$eq]=${blogId}&filters[$or][1][documentId][$eq]=${blogId}&populate=*`
          : `/blogs?filters[documentId][$eq]=${blogId}&populate=*`;

        const res = await fetchApi(query, { headers }).catch(() => null);

        let data = null;
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          data = res.data[0];
        } else if (res?.data && !Array.isArray(res.data)) {
          data = res.data;
        }

        if (!data) throw new Error('Blog post not found');
        setBlog(data);
      } catch (err: any) {
        console.error('Failed to load blog post:', err);
        setError(err.message || 'Article not found');
      } finally {
        setLoading(false);
      }
    };

    if (blogId) loadBlogDetails();
  }, [blogId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading blog article...</span>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Article Not Found</h2>
        <Link
          href="/dashboard/content-manager/blogs"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
        >
          Back to Blogs
        </Link>
      </div>
    );
  }

  // কভার ইমেজ URL গঠন
  const rawCover =
    blog.cover_image_url?.url ||
    blog.cover_image_url?.data?.attributes?.url ||
    blog.cover_image_url?.[0]?.url;

  const coverUrl = rawCover
    ? rawCover.startsWith('http')
      ? rawCover
      : `${STRAPI_URL}${rawCover}`
    : null;

  const isDraft = (blog.blog_status || '').toLowerCase() === 'draft';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/content-manager/blogs"
          className="inline-flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Blogs</span>
        </Link>

        <span
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border ${
            isDraft
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}
        >
          {isDraft ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span className="capitalize">{blog.blog_status || 'Published'}</span>
        </span>
      </div>

      {/* Main Article Container */}
      <article className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6">
        {/* Cover Image Banner */}
        {coverUrl ? (
          <div className="w-full h-64 sm:h-96 relative bg-slate-950 overflow-hidden">
            <img src={coverUrl} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-40 bg-slate-950 flex items-center justify-center text-slate-700 border-b border-slate-800">
            <FileText className="w-12 h-12" />
          </div>
        )}

        {/* Content Wrapper */}
        <div className="p-6 sm:p-10 space-y-6">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                {blog.author?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-slate-300 font-medium">{blog.author?.username || 'Admin'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {blog.createdAt
                  ? new Date(blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Recent'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            {blog.title}
          </h1>

          {/* Body Content */}
          <div className="pt-2">
            <RenderBlocks content={blog.body} />
          </div>
        </div>
      </article>
    </div>
  );
}