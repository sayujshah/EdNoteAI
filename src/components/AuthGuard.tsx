'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Define public paths that don't require authentication
    const publicPaths = ['/', '/login', '/auth'];
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/auth/');

    // Don't redirect while loading
    if (loading) return;

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicPath) {
      console.log('Redirecting unauthenticated user to login');
      router.push('/login');
      return;
    }

    // If user is authenticated and on login page, redirect to dashboard
    if (user && pathname === '/login') {
      console.log('Redirecting authenticated user to dashboard');
      router.push('/dashboard/library');
      return;
    }
  }, [user, loading, pathname, router]);

  // Show loading state for protected routes while checking auth
  if (loading && pathname !== '/' && pathname !== '/login' && !pathname.startsWith('/auth/')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
