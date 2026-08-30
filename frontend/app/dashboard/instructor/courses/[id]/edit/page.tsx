'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  Loader2,
  UploadCloud,
  X,
  AlertCircle,
} from 'lucide-react';

export default function InstructorEditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://lms-cps.up.railway.app';

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // ১. কারেন্ট ইউজার ফেচ
      const me = await fetchApi('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ২. নির্দিষ্ট কোর্স ডেটা ফেচ
      const queryParams = new URLSearchParams({
        'populate[thumbnail]': 'true',
        'populate[creator][fields][0]': 'id',
        'populate[creator][fields][1]': 'username',
      });

      const res = await fetchApi(`/courses/${courseId}?${queryParams.toString()}`);
      const data = res?.data || res;

      if (!data) {
        setError('Course not found.');
        return;
      }

      // ৩. ভ্যালিডেশন: ক্রিয়েটর ছাড়া অন্য কেউ এডিট করতে পারবে না
      const rawCreator = data.creator || data.attributes?.creator?.data || data.attributes?.creator;
      const creatorId = rawCreator ? Number(rawCreator.id) : null;
      const creatorDocId = rawCreator?.documentId ? String(rawCreator.documentId) : '';
      const currentUserId = Number(me.id);
      const currentUserDocId = me.documentId ? String(me.documentId) : '';

      const isOwner =
        creatorId === currentUserId ||
        (currentUserDocId !== '' && creatorDocId === currentUserDocId);

      if (!isOwner) {
        alert('Unauthorized! You can only edit courses created by you.');
        router.push('/dashboard/instructor/courses');
        return;
      }

      setTitle(data.title || data.attributes?.title || '');
      setDescription(data.description || data.attributes?.description || '');

      const imgObj = data.thumbnail || data.attributes?.thumbnail?.data?.attributes;
      if (imgObj?.url) {
        let url = imgObj.url;
        if (!url.startsWith('http')) url = `http://localhost:1337${url}`;
        setExistingThumbnail(url);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

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
    setExistingThumbnail(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (token: string) => {
    if (!thumbnailFile) return null;
    const formData = new FormData();
    formData.append('files', thumbnailFile);

    const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) throw new Error('Failed to upload image');
    const data = await uploadRes.json();
    return data[0]?.id || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token') || '';

      let thumbnailId = undefined;
      if (thumbnailFile) {
        thumbnailId = await uploadImage(token);
      }

      // শুধুমাত্র বৈধ স্কিমা ফিল্ড পাঠানো হচ্ছে (category সম্পূর্ণ বাদ)
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (thumbnailId) {
        payload.thumbnail = thumbnailId;
      }

      await fetchApi(`/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: payload }),
      });

      router.push('/dashboard/instructor/courses');
    } catch (err: any) {
      setError(err?.message || 'Failed to update course.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading course data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/instructor/courses"
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edit Course</h1>
          <p className="text-xs text-slate-400 mt-0.5">Update course metadata & visual details</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Course Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#060a12] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Thumbnail</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!thumbnailPreview && !existingThumbnail ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-[#060a12] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition"
            >
              <UploadCloud className="w-6 h-6 text-indigo-400" />
              <p className="text-xs text-slate-400">Click to upload new thumbnail</p>
            </div>
          ) : (
            <div className="relative w-full h-48 bg-[#060a12] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-3 group">
              <img
                src={thumbnailPreview || existingThumbnail || ''}
                alt="Thumbnail"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={removeThumbnail}
                className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                title="Remove Thumbnail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/instructor/courses"
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{saving ? 'Updating...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}