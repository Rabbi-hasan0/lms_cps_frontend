'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

      // ১. লগইন রিকোয়েস্ট (populate=role সহ, যাতে লগইন রেসপন্সসার সাথেই রোল চলে আসে)
      const loginRes = await fetch(`${STRAPI_URL}/api/auth/local?populate=role`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData?.error?.message || 'Invalid email or password');
      }

      const token = loginData.jwt;
      const userProfile = loginData.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userProfile));

      // ২. রোল ডিটেক্ট করা (সরাসরি loginData থেকে অথবা ফলব্যাক হিসেবে ইউজারনেম দিয়ে)
      let detectedRole = '';
      if (userProfile?.role) {
        detectedRole = typeof userProfile.role === 'string' 
          ? userProfile.role 
          : userProfile.role?.name || userProfile.role?.type || userProfile.role?.title || '';
      }

      const username = (userProfile?.username || '').toLowerCase();
      const email = (userProfile?.email || '').toLowerCase();
      const cleanRole = (detectedRole || '').toLowerCase().replace(/[\s\-_]+/g, '');

      console.log('Logged in user:', username, 'Detected Role:', cleanRole);

      // ৩. সঠিক ড্যাশবোর্ডে রিডাইরেক্ট করা
      if (cleanRole.includes('admin') || username === 'admin') {
        router.push('/dashboard/admin');
      } else if (cleanRole.includes('content') || cleanRole.includes('manager') || username.includes('manager')) {
        router.push('/dashboard/content-manager');
      } else if (cleanRole.includes('instructor') || cleanRole.includes('teacher') || username.includes('instructor')) {
        router.push('/dashboard/instructor');
      } else {
        router.push('/dashboard/student');
      }

    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-white tracking-tight">Welcome to Our Academy</h3>
          <p className="text-sm text-slate-400 mt-2">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email or Username</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="name@gmail.com"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/25 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}