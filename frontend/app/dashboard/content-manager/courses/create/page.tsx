// app/dashboard/content-manager/courses/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Upload,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

export default function CreateCoursePage() {
    const router = useRouter();
    const [instructors, setInstructors] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructorId: '',
    });

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Strapi থেকে ইন্সট্রাক্টর/ইউজার লিস্ট ফেচ করা
    useEffect(() => {
    const token = localStorage.getItem('token');
    const loadInstructors = async () => {
        try {
        const users = await fetchApi('/users?populate=role', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (Array.isArray(users)) {
            // শুধুমাত্র যাদের রোল 'instructor' বা 'teacher' তাদের ফিল্টার করা
            const onlyInstructors = users.filter((u: any) => {
            const roleName = u.role?.name?.toLowerCase() || u.role?.type?.toLowerCase() || '';
            return roleName.includes('instructor') || roleName.includes('teacher');
            });

            setInstructors(onlyInstructors);

            if (onlyInstructors.length > 0) {
            setFormData((prev) => ({ ...prev, instructorId: onlyInstructors[0].id.toString() }));
            } else {
            setFormData((prev) => ({ ...prev, instructorId: '' }));
            }
        }
        } catch (err) {
        console.warn('Failed to fetch instructors:', err);
        }
    };

    loadInstructors();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
        const token = localStorage.getItem('token');
        let uploadedThumbnailId = null;

        // ১. থাম্বনেইল থাকলে আগে Strapi upload API তে আপলোড করা
        if (thumbnailFile) {
            const uploadData = new FormData();
            uploadData.append('files', thumbnailFile);

            const uploadRes = await fetch(
            `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}/api/upload`,
            {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: uploadData,
            }
            );

            const uploadJson = await uploadRes.json();
            if (uploadRes.ok && uploadJson[0]) {
            uploadedThumbnailId = uploadJson[0].id;
            }
        }

        // ২. Strapi তে কোর্স ডাটা পাঠানো
        const coursePayload: any = {
            title: formData.title,
            description: formData.description,
        };

        if (formData.instructorId) {
            coursePayload.instructor = Number(formData.instructorId);
        }

        if (uploadedThumbnailId) {
            coursePayload.thumbnail = uploadedThumbnailId;
        }

        await fetchApi('/courses', {
            method: 'POST',
            body: JSON.stringify({ data: coursePayload }),
        });

        setSuccess(true);
        setTimeout(() => {
            router.push('/dashboard/content-manager/courses');
        }, 1500);
        } catch (err: any) {
        console.error('Failed to create course:', err);
        setError(err.message || 'Failed to create course. Please verify Strapi fields & permissions.');
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
            <Link
            href="/dashboard/content-manager/courses"
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition"
            >
            <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
            <h1 className="text-2xl font-bold text-white">Create New Course</h1>
            <p className="text-xs sm:text-sm text-slate-400">Fill in the fields to create a new course entry</p>
            </div>
        </div>

        {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Course created successfully! Redirecting to course list...</span>
            </div>
        )}

        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Title */}
            <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
            </label>
            <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. C Programming Basic to Advanced"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
            </div>
            </div>

            {/* Description */}
            <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-red-400">*</span>
            </label>
            <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Write course description and learning objectives..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
            </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Thumbnail</label>
            {thumbnailPreview ? (
                <div className="relative w-full h-48 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <img src={thumbnailPreview} alt="Course Preview" className="w-full h-full object-cover" />
                <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition"
                >
                    <X className="w-4 h-4" />
                </button>
                </div>
            ) : (
                <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-sm text-slate-300 font-medium">Click to upload course thumbnail</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
            )}
            </div>

            {/* Instructor Selection */}
            <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Instructor</label>
            <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition appearance-none"
                >
                {instructors.length > 0 ? (
                    instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                        {ins.username} ({ins.email})
                    </option>
                    ))
                ) : (
                    <option value="">No instructors available</option>
                )}
                </select>
            </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
                href="/dashboard/content-manager/courses"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
            >
                Cancel
            </Link>
            <button
                type="submit"
                disabled={loading || success}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-indigo-500/25 transition disabled:opacity-50"
            >
                {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Course...</span>
                </>
                ) : (
                <span>Create Course</span>
                )}
            </button>
            </div>
        </form>
        </div>
    );
}