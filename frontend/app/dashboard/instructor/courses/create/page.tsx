'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  Loader2,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function InstructorCreateCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (token: string) => {
    if (!thumbnailFile) return null;
    const formData = new FormData();
    formData.append('files', thumbnailFile);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://lms-cps.up.railway.app';

  const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

    if (!uploadRes.ok) {
      throw new Error('Image upload failed.');
    }

    const uploadedData = await uploadRes.json();
    return uploadedData[0]?.id || null;
  };

  const handleSubmit = async (isPublished: boolean = false) => {
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      if (isPublished) setPublishing(true);
      else setSaving(true);

      const token = localStorage.getItem('token') || '';

      const me = await fetchApi('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      let thumbnailId = null;
      if (thumbnailFile) {
        thumbnailId = await uploadImage(token);
      }

      // creator এবং instructor দুটোতেই me.id পাঠানো হচ্ছে
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        creator: me.id,
        instructor: me.id,
      };

      if (thumbnailId) {
        payload.thumbnail = thumbnailId;
      }

      if (isPublished) {
        payload.publishedAt = new Date().toISOString();
      }

      await fetchApi('/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
      });

      router.push('/dashboard/instructor/courses');
    } catch (err: any) {
      setError(err?.message || 'Failed to save course. Please try again.');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/instructor/courses"
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {title || 'Untitled Course'}
          </h1>
          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
            Draft
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-[#0b101b] border border-slate-800 rounded-2xl p-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. C programming basic course"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              description
            </label>
            <textarea
              rows={4}
              placeholder="This is basic course..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              thumbnail
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!thumbnailPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-[#060a12] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition"
              >
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-300">Click to upload thumbnail</p>
                <p className="text-[11px] text-slate-500">PNG, JPG, WEBP up to 5MB</p>
              </div>
            ) : (
              <div className="relative w-full h-48 bg-[#060a12] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-3 group">
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-3 right-3 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                instructor (1)
              </label>
              <div className="px-3 py-2 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-assigned to You</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                lessons & quizzes
              </label>
              <div className="px-3 py-2 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-slate-500">
                Manageable after creating course
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase block">
              ENTRY
            </span>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={publishing || saving}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Publish Course</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving || publishing}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save as Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}