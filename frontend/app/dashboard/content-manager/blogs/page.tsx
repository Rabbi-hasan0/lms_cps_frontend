// app/dashboard/content-manager/blogs/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/app/lib/api';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Upload,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface BlogPost {
  id: number;
  documentId?: string;
  title: string;
  body?: string | any[];
  cover_image_url?: any;
  blog_status?: string;
  author?: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
}

// 🛠️ Strapi Blocks থেকে টেক্সট বের করার হেল্পার
const extractText = (raw: any): string => {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((b: any) =>
        b.children ? b.children.map((c: any) => c.text || '').join('') : b.text || ''
      )
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

// 🛠️ টেক্সটকে Strapi Blocks ফরম্যাটে রূপান্তর
const formatBlocks = (text: string) => {
  if (!text || text.trim() === '') {
    return [{ type: 'paragraph', children: [{ type: 'text', text: '' }] }];
  }
  const lines = text.split('\n');
  return lines.map((line) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: line }],
  }));
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: '',
    body: '',
    blog_status: 'published',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  // ডেটা লোড করার ফাংশন
  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [blogsRes, userRes] = await Promise.all([
        fetchApi('/blogs?populate=*', { headers }).catch(() => null),
        fetchApi('/users/me', { headers }).catch(() => null),
      ]);

      setBlogs(Array.isArray(blogsRes?.data) ? blogsRes.data : []);
      if (userRes) setCurrentUser(userRes);
    } catch (err) {
      console.warn('Could not load blogs:', err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // থাম্বনেইল ইমেজ URL
  const getCoverUrl = (blog: any) => {
    const raw =
      blog.cover_image_url?.url ||
      blog.cover_image_url?.data?.attributes?.url ||
      blog.cover_image_url?.[0]?.url;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${STRAPI_URL}${raw}`;
  };

  const handleOpenModal = (blog: BlogPost | null = null) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title || '',
        body: extractText(blog.body),
        blog_status: blog.blog_status || 'published',
      });
      setImagePreview(getCoverUrl(blog));
      setImageFile(null);
    } else {
      setEditingBlog(null);
      setBlogForm({
        title: '',
        body: '',
        blog_status: 'published',
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 💾 ব্লগ সেভ বা আপডেট
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      let uploadedMediaId = null;

      // ১. মিডিয়া আপলোড
      if (imageFile) {
        const formData = new FormData();
        formData.append('files', imageFile);

        const upHeaders: Record<string, string> = {};
        if (token) upHeaders['Authorization'] = `Bearer ${token}`;

        const upRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          headers: upHeaders,
          body: formData,
        });

        if (upRes.ok) {
          const upJson = await upRes.json();
          if (Array.isArray(upJson) && upJson.length > 0) {
            uploadedMediaId = upJson[0].id;
          }
        }
      }

      // ২. পেলোড গঠন (তোমার মডেলের ফিল্ড অনুযায়ী)
      const payload: any = {
        title: blogForm.title,
        body: formatBlocks(blogForm.body),
        blog_status: blogForm.blog_status,
      };

      if (uploadedMediaId) {
        payload.cover_image_url = uploadedMediaId;
      } else if (imagePreview === null) {
        payload.cover_image_url = null;
      }

      if (!editingBlog && currentUser?.id) {
        payload.author = currentUser.id;
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (!editingBlog) {
        await fetchApi('/blogs', {
          method: 'POST',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      } else {
        const targetId = editingBlog.documentId || editingBlog.id;
        await fetchApi(`/blogs/${targetId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ data: payload }),
        });
      }

      setIsModalOpen(false);
      await loadBlogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save blog post');
    } finally {
      setModalLoading(false);
    }
  };

  // 🗑️ ডিলিট অ্যাকশন
    const handleConfirmDelete = async () => {
        if (!blogToDelete) return;
        setDeleteLoading(true);

        try {
        const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const cleanToken = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';

        const headers: Record<string, string> = {};
        if (cleanToken) {
            headers['Authorization'] = `Bearer ${cleanToken}`;
        }

        // Strapi 5-এ documentId অগ্রাধিকার পায়, Strapi 4-এ id
        const targetId = blogToDelete.documentId || blogToDelete.id;

        await fetchApi(`/blogs/${targetId}`, {
            method: 'DELETE',
            headers,
        });

        setIsDeleteModalOpen(false);
        setBlogToDelete(null);
        await loadBlogs();
        } catch (err: any) {
        console.error('Delete error details:', err);
        alert(err.message || 'Failed to delete blog post. Please verify Strapi permissions.');
        } finally {
        setDeleteLoading(false);
        }
    };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28 text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span>Loading blog posts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-500" />
            Blog Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, write articles, publish news, and manage blog posts.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Blog</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Total: <span className="font-bold text-white">{blogs.length}</span> Posts
        </div>
      </div>

      {/* Blog Cards Grid */}
      {filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.map((blog) => {
            const cover = getCoverUrl(blog);
            const excerpt = extractText(blog.body);
            const isDraft = (blog.blog_status || '').toLowerCase() === 'draft';

            return (
            <div
                key={blog.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between shadow-lg group"
            >
                <div>
                {/* 🖼️ Cover Image */}
                <div className="relative w-full h-44 bg-slate-950 overflow-hidden">
                    {cover ? (
                    <img
                        src={cover}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <FileText className="w-10 h-10" />
                    </div>
                    )}

                    {/* Quick Actions (Edit & Delete) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => handleOpenModal(blog)}
                        className="p-1 text-slate-300 hover:text-amber-400 rounded transition"
                        title="Edit Blog"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => {
                        setBlogToDelete(blog);
                        setIsDeleteModalOpen(true);
                        }}
                        className="p-1 text-slate-300 hover:text-red-400 rounded transition"
                        title="Delete Blog"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    </div>
                </div>

                {/* 📝 Card Info & Title */}
                <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* 🟢 ১. ব্লগের টাইটেলে Details Link */}
                    <Link
                    href={`/dashboard/content-manager/blogs/${blog.documentId || blog.id}`}
                    className="block group/title cursor-pointer"
                    >
                    <h3 className="text-base font-bold text-white group-hover/title:text-indigo-400 transition line-clamp-1">
                        {blog.title}
                    </h3>
                    </Link>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {excerpt || 'No content preview available.'}
                    </p>
                </div>
                </div>

                {/* 🔗 Footer Link & Status */}
                <div className="p-4 pt-0 space-y-3">
                {/* 🟢 ২. পুরো ডিটেইলস পড়ার ডেডিকেটেড বাটন */}
                <Link
                    href={`/dashboard/content-manager/blogs/${blog.documentId || blog.id}`}
                    className="w-full flex items-center justify-center py-2 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition"
                >
                    View Full Details ➔
                </Link>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {blog.author?.username || 'Admin'}
                    </span>
                    <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 capitalize ${
                        isDraft
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}
                    >
                    {isDraft ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {blog.blog_status || 'Published'}
                    </span>
                </div>
                </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
          No blog posts found. Click &quot;Write New Blog&quot; to publish your first post.
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBlog ? 'Edit Blog Post' : 'Write New Blog Post'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Blog Title *</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="e.g. Master React and Web Development"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Publication Status</label>
                <select
                  value={blogForm.blog_status}
                  onChange={(e) => setBlogForm({ ...blogForm, blog_status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Cover Image (cover_image_url)</label>
                {imagePreview ? (
                  <div className="relative w-full h-36 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-500 mb-1" />
                    <p className="text-xs text-slate-300">Click to upload cover photo</p>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Blog Body / Content (body) *</label>
                <textarea
                  rows={6}
                  required
                  value={blogForm.body}
                  onChange={(e) => setBlogForm({ ...blogForm, body: e.target.value })}
                  placeholder="Write your article in text..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center gap-2"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBlog ? 'Update Blog' : 'Save Blog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3.5 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Blog Post</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{blogToDelete?.title}&quot;</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl flex items-center gap-2"
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