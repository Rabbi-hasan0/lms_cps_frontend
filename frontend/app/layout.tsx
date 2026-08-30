import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LMS Platform',
  description: 'Public Landing & Learning Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        {/* Global Public Navbar */}
        <Navbar />
        
        {/* Main Page Content (app/page.tsx or other routes) */}
        {children}
      </body>
    </html>
  );
}