import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', user.id)

  const roles = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || []

  return {
    ...user,
    profile,
    roles,
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (!user.roles.includes('admin')) {
    redirect('/dashboard')
  }
  return user
}

export async function requireRole(role: string) {
  const user = await requireUser()
  if (!user.roles.includes(role) && !user.roles.includes('admin')) {
    redirect('/dashboard')
  }
  return user
}
