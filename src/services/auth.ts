import { getSupabaseClient } from './supabaseClient';
import type { UserProfile, Role } from '../types';
import { setCurrentUser as persistCurrentUser } from './storage';

export function getAdminEmail(): string {
  return (import.meta.env.VITE_ADMIN_EMAIL || 'admin@citywaste.gov').trim().toLowerCase();
}

/**
 * Determine role automatically based on environment-configured admin email
 */
export function determineRoleForEmail(email: string): Role {
  const admin = getAdminEmail();
  return email.trim().toLowerCase() === admin ? 'admin' : 'worker';
}

/**
 * Sign in using Supabase Auth (Email + Password)
 * Automatically checks and assigns Role (Admin if matching VITE_ADMIN_EMAIL, else Worker)
 */
export async function signInWithSupabase(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase credentials are not configured.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password: pass,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'User record not found.' };
    }

    // Role is automatically assigned: matches VITE_ADMIN_EMAIL -> admin, else -> worker
    const autoRole: Role = determineRoleForEmail(cleanEmail);

    // Sync / Upsert role in Supabase profiles table
    const fullName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
    const userProfile: UserProfile = {
      id: data.user.id,
      email: cleanEmail,
      full_name: fullName,
      role: autoRole,
      zone: autoRole === 'admin' ? 'Headquarters' : 'Assigned Route Zone',
      created_at: data.user.created_at || new Date().toISOString(),
    };

    try {
      await client.from('profiles').upsert([userProfile]);
    } catch (e) {
      console.warn('Profile sync warning:', e);
    }

    persistCurrentUser(userProfile);
    return { success: true, user: userProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}

/**
 * Register a new user with Supabase Auth
 * Automatically assigns Role without any user choice
 */
export async function signUpWithSupabase(
  email: string,
  pass: string,
  fullName: string
): Promise<{ success: boolean; user?: UserProfile; error?: string; message?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase credentials are not configured.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const autoRole: Role = determineRoleForEmail(cleanEmail);

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          full_name: fullName.trim(),
          role: autoRole,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || (error as any).code === 'over_email_send_rate_limit') {
        return {
          success: false,
          error: 'Supabase email rate limit exceeded (free tier limit). In your Supabase dashboard, go to Authentication -> Providers -> Email, and turn OFF "Confirm email" to enable unlimited instant signups.',
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Registration could not be completed.' };
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      email: cleanEmail,
      full_name: fullName.trim(),
      role: autoRole,
      zone: autoRole === 'admin' ? 'Headquarters' : 'Assigned Zone',
      created_at: new Date().toISOString(),
    };

    try {
      await client.from('profiles').upsert([userProfile]);
    } catch (e) {
      console.warn('Profile sync warning:', e);
    }

    persistCurrentUser(userProfile);

    return {
      success: true,
      user: userProfile,
      message: `Account created successfully! Automatically assigned role: ${autoRole.toUpperCase()}.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed.' };
  }
}

/**
 * Sign out of Supabase Auth
 */
export async function signOutSupabase(): Promise<UserProfile> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }

  const defaultUser: UserProfile = {
    id: 'guest',
    full_name: 'Guest User',
    email: '',
    role: 'worker',
    created_at: new Date().toISOString(),
  };
  persistCurrentUser(defaultUser);
  return defaultUser;
}

/**
 * Check if active session exists in Supabase
 */
export async function checkActiveSupabaseSession(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data } = await client.auth.getSession();
    if (data?.session?.user) {
      const email = data.session.user.email || '';
      const autoRole = determineRoleForEmail(email);
      const fullName = data.session.user.user_metadata?.full_name || email.split('@')[0];

      return {
        id: data.session.user.id,
        email: email,
        full_name: fullName,
        role: autoRole,
        zone: autoRole === 'admin' ? 'Headquarters' : 'Assigned Zone',
        created_at: data.session.user.created_at,
      };
    }
  } catch (e) {
    console.warn('Could not fetch Supabase session:', e);
  }
  return null;
}
