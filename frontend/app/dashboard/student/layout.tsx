// app/dashboard/student/layout.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  Home,
  BookOpen,
  TrendingUp,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Loader2,
  GraduationCap,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ক্লিক করলে ড্রপডাউন বন্ধ হওয়ার জন্য ইভেন্ট লিসেনার
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const me = await fetchApi('/users/me?populate=role', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const roleName = (me?.role?.name || me?.role?.type || '').toLowerCase();

        if (roleName.includes('admin')) {
          router.replace('/dashboard/admin');
          return;
        }
        if (roleName.includes('content') || roleName.includes('manager')) {
          router.replace('/dashboard/content-manager');
          return;
        }
        if (roleName.includes('instructor')) {
          router.replace('/dashboard/instructor');
          return;
        }

        setUser(me);
      } catch (err) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  // 🧭 নেভবার থেকে 'Profile' সরিয়ে ফেলা হয়েছে এবং 'Quizzes' যুক্ত করা হয়েছে
  const navItems = [
    { label: 'Home', href: '/dashboard/student', icon: Home },
    { label: 'My Enrolled Course', href: '/dashboard/student/courses', icon: BookOpen },
    { label: 'Quizzes', href: '/dashboard/student/quizzes', icon: HelpCircle },
    { label: 'My Progress', href: '/dashboard/student/progress', icon: TrendingUp },
    { label: 'Blogs', href: '/dashboard/student/blogs', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs tracking-wider">Verifying student credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 🧭 Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/dashboard/student" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                LearnHub <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">Student</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard/student'
                  ? pathname === '/dashboard/student'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 🌟 Professional Profile Dropdown Menu */}
          <div className="hidden md:flex items-center relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'S'}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-[100px] truncate">
                {user?.username || 'Student'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Box */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/dashboard/student/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>My Profile</span>
                </Link>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* 📱 Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl mb-3 border border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard/student'
                  ? pathname === '/dashboard/student'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 space-y-1">
              <Link
                href="/dashboard/student/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>My Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-xl font-medium transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 📄 Page Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}