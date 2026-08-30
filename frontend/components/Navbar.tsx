'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, LogIn, UserPlus, BookOpen } from 'lucide-react';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      setIsCheckingAuth(false);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [pathname]);

  const isDashboardRoute = pathname?.startsWith('/dashboard');
  
  // ইউজার অনঅথরাইজড এবং ড্যাশবোর্ডের বাইরে থাকলে নেভবার দেখাবে
  const showPublicNavbar = !isAuthenticated && !isDashboardRoute && !isCheckingAuth;

  if (!showPublicNavbar) return null;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-white group">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-105 transition">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="tracking-tight">LMS Platform</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <Link href="/" className="hover:text-emerald-400 transition">
            Home
          </Link>
          <Link href="/blogs" className="hover:text-emerald-400 transition flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Blog
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span>Sign In</span>
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Get Started</span>
          </Link>
        </div>
      </div>
    </header>
  );
}