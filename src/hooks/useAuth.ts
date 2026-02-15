import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'ceo' | 'coo' | 'strategic_director' | 'marketing_director' | 'tech_director';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  department: string | null;
  job_title: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        
        if (user) {
          // Fetch profile and role using setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const [profileRes, roleRes] = await Promise.all([
              supabase.from('profiles').select('*').eq('user_id', user.id).single(),
              supabase.rpc('get_user_role', { _user_id: user.id }),
            ]);
            
            setState({
              user,
              session,
              profile: profileRes.data as Profile | null,
              role: (roleRes.data as AppRole) ?? null,
              loading: false,
            });
          }, 0);
        } else {
          setState({ user: null, session: null, profile: null, role: null, loading: false });
        }
      }
    );

    // THEN check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState(s => ({ ...s, loading: false }));
      }
      // If session exists, onAuthStateChange will handle it
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isCEO = state.role === 'ceo';

  return { ...state, signIn, signOut, isCEO };
}
