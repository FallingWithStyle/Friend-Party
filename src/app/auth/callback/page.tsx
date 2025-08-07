'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        router.push('/error'); // Redirect to an error page
        return;
      }

      if (data?.session) {
        // User is authenticated, redirect to home or profile
        router.push('/profile'); // Or wherever you want to redirect after login
      } else {
        // No session, likely an unauthenticated access or error
        router.push('/'); // Redirect to home page if no session
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div>
      <p>Authenticating...</p>
    </div>
  );
}