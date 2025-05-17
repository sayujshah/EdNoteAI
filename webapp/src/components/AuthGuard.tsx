'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase'; // Adjust path as needed

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // If no user and not on a public page, redirect to login
      const publicPaths = ['/', '/login']; // Define public paths
      if (!user && !publicPaths.includes(pathname)) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        // Redirect authenticated users away from login page
        router.push('/'); // Redirect to home or dashboard after login
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const publicPaths = ['/', '/login']; // Define public paths
      if (!session && !publicPaths.includes(pathname)) {
        router.push('/login');
      } else if (session && pathname === '/login') {
        // Redirect authenticated users away from login page
        router.push('/'); // Redirect to home or dashboard after login
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]); // Rerun effect if pathname or router changes

  if (loading && pathname !== '/login') {
    // Optionally show a loading spinner or null while checking auth
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
