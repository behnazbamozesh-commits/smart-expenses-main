'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { DEMO_USER_ID } from '@/lib/demo-data';

const DEMO_FLAG = 'demo_mode';

const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@expensetracker.app',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as SupabaseUser;

type AuthContextType = {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Always start in demo mode — bypasses Supabase auth entirely
    localStorage.setItem(DEMO_FLAG, 'true');
    document.cookie = 'demo_mode=true; path=/; max-age=86400';
    setUser(DEMO_USER);
    setIsDemoMode(true);
    setLoading(false);
  }, []);

  const signInDemo = () => {
    localStorage.setItem(DEMO_FLAG, 'true');
    document.cookie = 'demo_mode=true; path=/; max-age=86400';
    setUser(DEMO_USER);
    setIsDemoMode(true);
    setLoading(false);
    router.push('/');
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_FLAG);
      document.cookie = 'demo_mode=; path=/; max-age=0';
      setUser(null);
      setIsDemoMode(false);
      router.push('/auth/login');
      return;
    }
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemoMode, signUp, signIn, signInDemo, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
