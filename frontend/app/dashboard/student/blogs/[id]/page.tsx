// app/dashboard/student/blogs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  BookOpen,
  UserCircle,
  Tag,
  ChevronRight,
} from 'lucide-react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// 🛠️ Strapi Rich Text Blocks পার্স করার জন্য হেল্পার ফাংশন
const renderRichText = (content: any): React.ReactNode => {
  if (!content) return null;

  // যদি সাধারণ স্ট্রিং হয়
  if (typeof content === 'string') {
    return <p className="leading-relaxed">{content}</p>;
  }

  // যদি Strapi Blocks (Array) হয়
  if (Array.isArray(content)) {
    return content.map((block: any, index: number) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p key={index} className="leading-relaxed mb-4">
              {block.children?.map((child: any, cIdx: number) => {
                let el = child.text || '';
                if (child.bold) return <strong key={cIdx} className="font-bold text-white">{el}</strong>;
                if (child.italic) return <em key={cIdx} className="italic">{el}</em>;
                if (child.underline) return <u key={cIdx} className="underline">{el}</u>;
                return <span key={cIdx}>{el}</span>;
              })}
            </p>
          );
        case 'heading': {
                const levelNum = block.level || 2;
                
                const headingClasses =
                    levelNum === 1
                    ? 'text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-3'
                    : levelNum === 2
                    ? 'text-xl sm:text-2xl font-bold text-white mt-5 mb-3'
                    : 'text-lg font-semibold text-white mt-4 mb-2';

                const textContent = block.children?.map((child: any) => child.text).join('') || '';

                // 🛠️ সেফ রেন্ডারিং: ডায়নামিক ট্যাগের বদলে সুইচ কেস বা ডিরেক্ট রেন্ডার
                if (levelNum === 1) {
                    return <h1 key={index} className={headingClasses}>{textContent}</h1>;
                } else if (levelNum === 2) {
                    return <h2 key={index} className={headingClasses}>{textContent}</h2>;
                } else if (levelNum === 3) {
                    return <h3 key={index} className={headingClasses}>{textContent}</h3>;
                } else if (levelNum === 4) {
                    return <h4 key={index} className={headingClasses}>{textContent}</h4>;
                } else {
                    return <h5 key={index} className={headingClasses}>{textContent}</h5>;
                }
        }
        case 'list':
          const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
          return (
            <ListTag key={index} className={`list-${block.format === 'ordered' ? 'decimal' : 'disc'} pl-6 mb-4 space-y-1`}>
              {block.children?.map((li: any, liIdx: number) => (
                <li key={liIdx}>
                  {li.children?.map((c: any) => c.text).join('')}
                </li>
              ))}
            </ListTag>
          );
        default:
          return null;
      }
    });
  }

  // যদি অবজেক্ট আকারে আসে
  if (typeof content === 'object') {
    if (content.text) return <p>{content.text}</p>;
  }

  return String(content);
};

export default function StudentBlogDetailPage() {
  const params = useParams();
  const blogId = params?.id as string;

  const [blog, setBlog] = useState<any>(null);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const isNumeric = !isNaN(Number(blogId));
        const query = isNumeric
          ? `/blogs?filters[$or][0][id][$eq]=${blogId}&filters[$or][1][documentId][$eq]=${blogId}&populate=*`
          : `/blogs?filters[documentId][$eq]=${blogId}&populate=*`;

        const [blogRes, recentRes] = await Promise.all([
          fetchApi(query, authHeader),
          fetchApi('/blogs?sort=createdAt:desc&pagination[limit]=5&populate=*', authHeader),
        ]).catch(() => [null, null]);

        const found = Array.isArray(blogRes?.data) ? blogRes.data[0] : blogRes?.data || blogRes;

        if (found) {
          const attr = found.attributes || found;
          
          let imageUrl = null;
          const coverData = attr.cover_image_url?.data || attr.cover_image_url;
          if (coverData) {
            const rawUrl = coverData.attributes?.url || coverData.url;
            if (rawUrl) {
              imageUrl = rawUrl.startsWith('http') ? rawUrl : `${STRAPI_URL}${rawUrl}`;
            }
          }

          setBlog({
            title: attr.title || 'Untitled Article',
            content: attr.body || attr.content || '',
            createdAt: attr.createdAt || new Date().toISOString(),
            status: attr.blog_status || 'Published',
            coverUrl: imageUrl,
            authorName: attr.author?.data?.attributes?.name || 'Admin Team',
          });
        }

        const rawRecent = Array.isArray(recentRes?.data) ? recentRes.data : Array.isArray(recentRes) ? recentRes : [];
        const formattedRecent = rawRecent
          .filter((item: any) => String(item.id || item.documentId) !== String(blogId))
          .slice(0, 4)
          .map((item: any) => {
            const attr = item.attributes || item;
            return {
              id: item.id,
              documentId: item.documentId,
              title: attr.title || 'Untitled',
              createdAt: attr.createdAt,
            };
          });
        
        setRecentBlogs(formattedRecent);

      } catch (err) {
        console.error('Failed to load blog details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (blogId) loadData();
  }, [blogId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium">Loading article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto stroke-[1.2]" />
        <h2 className="text-lg font-bold text-white">Article Not Found</h2>
        <Link
          href="/dashboard/student/blogs"
          className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
        >
          Back to Magazine
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Top Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center justify-between sticky top-4 z-10">
        <Link
          href="/dashboard/student/blogs"
          className="p-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Magazine</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
          {blog.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Main Article Content */}
        <article className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          
          {/* Cover Image */}
          {blog.coverUrl && (
            <div className="relative w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner mb-6">
              <img
                src={blog.coverUrl}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-400 border-y border-slate-800 py-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="w-px h-4 bg-slate-700" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <UserCircle className="w-4 h-4 text-sky-400" />
              {blog.authorName}
            </span>
            <span className="w-px h-4 bg-slate-700" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-400" />
              Official Update
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight pt-2">
            {blog.title}
          </h1>

          {/* Body Content Handled via RichText Parser */}
          <div className="text-sm sm:text-base text-slate-300 leading-relaxed space-y-4 pt-2">
            {renderRichText(blog.content)}
          </div>
        </article>

        {/* Right Side: Sidebar */}
        <aside className="lg:col-span-1 sticky top-28 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Latest from Newsfeed
            </h3>
            
            <div className="space-y-4">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((item) => (
                  <Link
                    key={item.documentId || item.id}
                    href={`/dashboard/student/blogs/${item.documentId || item.id}`}
                    className="block group p-4 bg-slate-950/50 border border-slate-800 hover:border-emerald-900 rounded-2xl transition-all duration-300 hover:bg-emerald-950/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 block">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">No other updates available.</p>
              )}
            </div>
            
            <Link
                href="/dashboard/student/blogs"
                className="mt-6 w-full text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
                View All Articles <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>

      </div>
    </div>
  );
}