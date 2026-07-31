'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function login(prevState: any, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!phone || !password) {
    return { error: 'Phone and password are required' }
  }

  // Use .com domain to avoid Supabase TLD validation errors
  const email = `${phone}@warehouse.com`

  let error;
  let authResult;
  try {
    authResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    error = authResult.error;
  } catch (err: unknown) {
    console.error("Auth Exception:", err);
    return { error: err instanceof Error ? err.message : String(err) }
  }

  if (error) {
    return { error: error.message }
  }

  if (authResult?.data?.user) {
    const { data: profile } = await supabase.from('core_profiles').select('role, is_active').eq('id', authResult.data.user.id).single();
    
    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return { error: 'Your account has been deactivated. Please contact an admin.' };
    }

    const role = profile?.role;
    if (!['admin', 'supervisor', 'viewer'].includes(role)) {
      await supabase.auth.signOut();
      return { error: 'Your role does not have permission to access the web portal.' };
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
