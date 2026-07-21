import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/supabase/database.types'

type Role = Database['public']['Enums']['profile_role']

/**
 * Ensures the current user is authenticated and has one of the specified roles.
 * Must be used in Server Components or Server Actions.
 * 
 * @param allowedRoles Array of roles that are allowed to access this resource
 * @param redirectTo Path to redirect to if unauthorized (default: /unauthorized)
 * @returns The user's profile data
 */
export async function requireRole(allowedRoles: Role[], redirectTo: string = '/unauthorized') {
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from('core_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Edge case: User is logged in but has no profile in the DB
    redirect('/login')
  }

  // 3. Verify Role
  if (!allowedRoles.includes(profile.role)) {
    redirect(redirectTo)
  }

  return profile
}

/**
 * Returns the current authenticated user's profile without throwing an error if unauthorized.
 * Useful for checking permissions gracefully in UI components.
 */
export async function getCurrentProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('core_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
