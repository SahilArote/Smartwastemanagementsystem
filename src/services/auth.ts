import { getSupabaseClient } from './supabaseClient';
import type { UserProfile, Role, UserAccount } from '../types';
import { 
  setCurrentUser as persistCurrentUser, 
  clearActiveSession, 
  fetchUserAccounts, 
  saveUserAccount,
  logActivity 
} from './storage';

export function getAdminEmail(): string {
  return (import.meta.env.VITE_ADMIN_EMAIL || 'admin@citywaste.gov').trim().toLowerCase();
}

/**
 * Determine default role for registered email
 */
export function determineRoleForEmail(email: string): Role {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === getAdminEmail()) return 'admin';
  if (cleanEmail.includes('supervisor') || cleanEmail.includes('manager')) return 'supervisor';
  return 'worker';
}

/**
 * Robust Sign In:
 * 1. If Supabase is connected, attempt Supabase Auth.
 * 2. Also validates against the application's secure user accounts registry.
 */
export async function signInUser(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !pass) {
    return { success: false, error: 'Email and password are required.' };
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (!error && data?.user) {
        const autoRole: Role = determineRoleForEmail(cleanEmail);
        const fullName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
        const userProfile: UserProfile = {
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          role: autoRole,
          zone: autoRole === 'admin' ? 'All Operational Zones (HQ)' : 'Assigned Operational Sector',
          created_at: data.user.created_at || new Date().toISOString(),
        };

        try {
          await client.from('profiles').upsert([userProfile]);
        } catch {
          // silent warning
        }

        persistCurrentUser(userProfile);
        logActivity('User Signed In', `Authenticated via Supabase as ${userProfile.role.toUpperCase()}.`, 'user', userProfile.id);
        return { success: true, user: userProfile };
      }
    } catch (e: any) {
      console.warn('Supabase auth attempt failed, evaluating local registry:', e);
    }
  }

  // Standalone / Persistent Database Auth Check
  const registeredUsers = await fetchUserAccounts();
  const matchedUser = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!matchedUser) {
    return { 
      success: false, 
      error: 'Account not found. Please verify your email or contact your municipal system administrator.' 
    };
  }

  if (matchedUser.status === 'Suspended') {
    return { 
      success: false, 
      error: 'This account has been suspended by the municipal administrator. Access denied.' 
    };
  }

  // Password verification
  if (matchedUser.password_hash && matchedUser.password_hash !== pass) {
    return { 
      success: false, 
      error: 'Invalid password. Please check your credentials.' 
    };
  }

  const profile: UserProfile = {
    id: matchedUser.id,
    email: matchedUser.email,
    full_name: matchedUser.full_name,
    role: matchedUser.role,
    phone: matchedUser.phone,
    zone: matchedUser.zone,
    created_at: matchedUser.created_at,
  };

  persistCurrentUser(profile);
  logActivity('User Signed In', `User "${profile.full_name}" logged in with role ${profile.role.toUpperCase()}.`, 'user', profile.id);
  return { success: true, user: profile };
}

/**
 * Register / Create New Account
 */
export async function signUpUser(
  email: string,
  pass: string,
  fullName: string,
  requestedRole: Role = 'worker'
): Promise<{ success: boolean; user?: UserProfile; error?: string; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !pass || !fullName.trim()) {
    return { success: false, error: 'Full name, email, and password are required.' };
  }

  const client = getSupabaseClient();
  let supabaseId: string | null = null;

  if (client) {
    try {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
            role: requestedRole,
          },
        },
      });
      if (!error && data?.user) {
        supabaseId = data.user.id;
      }
    } catch {
      // proceed to local registry
    }
  }

  const existingUsers = await fetchUserAccounts();
  if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email address already exists.' };
  }

  const newAccount: UserAccount = {
    id: supabaseId || 'usr-' + Date.now(),
    email: cleanEmail,
    password_hash: pass,
    full_name: fullName.trim(),
    role: requestedRole,
    status: 'Active',
    zone: requestedRole === 'admin' ? 'Headquarters (HQ)' : 'Assigned Sector',
    created_at: new Date().toISOString(),
  };

  await saveUserAccount(newAccount);

  const profile: UserProfile = {
    id: newAccount.id,
    email: newAccount.email,
    full_name: newAccount.full_name,
    role: newAccount.role,
    zone: newAccount.zone,
    created_at: newAccount.created_at,
  };

  persistCurrentUser(profile);
  logActivity('Account Created', `New user "${profile.full_name}" registered as ${profile.role.toUpperCase()}.`, 'user', profile.id);

  return {
    success: true,
    user: profile,
    message: `Account created successfully! Logged in as ${profile.role.toUpperCase()}.`,
  };
}

/**
 * Genuine Sign Out
 */
export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }

  clearActiveSession();
  logActivity('User Signed Out', 'User session terminated.', 'user');
}

/**
 * Check if active session exists
 */
export async function checkActiveSession(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      if (data?.session?.user) {
        const email = data.session.user.email || '';
        const autoRole = determineRoleForEmail(email);
        const fullName = data.session.user.user_metadata?.full_name || email.split('@')[0];

        const user: UserProfile = {
          id: data.session.user.id,
          email: email,
          full_name: fullName,
          role: autoRole,
          zone: autoRole === 'admin' ? 'Headquarters (HQ)' : 'Assigned Sector',
          created_at: data.session.user.created_at,
        };
        persistCurrentUser(user);
        return user;
      }
    } catch {
      // fallback to stored local session
    }
  }

  // Check stored active session
  const stored = localStorage.getItem('smartwaste_active_session');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return null;
}
