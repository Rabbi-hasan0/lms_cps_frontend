'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchApi } from '@/app/lib/api';
import {
  Layers,
  BookOpen,
  Newspaper,
  LogOut,
  Sparkles,
  Menu,
  X,
  Loader2,
  Search,
  Bell,
  Settings,
  Users,
} from 'lucide-react';

export default function ContentManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const verifyContentManager = async () => {
      try {
        const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const cleanToken = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : null;

        if (!cleanToken) {
          localStorage.clear();
          router.replace('/login');
          return;
        }

        const me = await fetchApi('/users/me?populate=role', {
          headers: { Authorization: `Bearer ${cleanToken}` },
        });

        if (!isMounted) return;

        const roleName = (me?.role?.name || me?.role?.type || '').toLowerCase();

        // রোল চেক
        if (roleName.includes('admin')) {
          router.replace('/dashboard/admin');
          return;
        }
        if (roleName.includes('instructor') || roleName.includes('teacher')) {
          router.replace('/dashboard/instructor');
          return;
        }
        if (roleName.includes('student')) {
          router.replace('/dashboard/student');
          return;
        }

        setUser(me);
        setIsAuthorized(true);
      } catch (err) {
        console.warn('Content manager auth check failed, checking cache:', err);
        const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (cachedUser && isMounted) {
          const parsed = JSON.parse(cachedUser);
          const roleName = (parsed?.role?.name || parsed?.role?.type || '').toLowerCase();
          if (roleName.includes('content') || roleName.includes('manager')) {
            setUser(parsed);
            setIsAuthorized(true);
            setLoading(false);
            return;
          }
        }
        localStorage.clear();
        router.replace('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyContentManager();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Overview', href: '/dashboard/content-manager', icon: Layers, exact: true },
    { name: 'Courses & Lessons', href: '/dashboard/content-manager/courses', icon: BookOpen, exact: false },
    { name: 'Blogs & Articles', href: '/dashboard/content-manager/blogs', icon: Newspaper, exact: false },
    { name: 'Student Progress', href: '/dashboard/content-manager/progress', icon: Users, exact: false },
    { name: 'Settings', href: '/dashboard/content-manager/settings', icon: Settings, exact: false },
  ];

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs tracking-wide">Loading Content Manager Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base text-white">Content Manager Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'Content Manager'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email || 'manager@lms.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-64 pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <Bell className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full">
              Content Manager
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}