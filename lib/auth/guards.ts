import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { uniqueRoles } from "@/lib/auth/roles"

export type CurrentUser = {
  id: string
  email?: string
  profile: {
    full_name?: string | null
    email?: string | null
    phone?: string | null
    company_name?: string | null
    avatar_url?: string | null
  } | null
  roles: string[]
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, company_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  let roleRows: any[] | null = null
  const withJoin = await supabase
    .from("user_roles")
    .select("role, role_id, roles(name)")
    .eq("user_id", user.id)

  if (!withJoin.error) {
    roleRows = withJoin.data
  } else {
    const withRoleId = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id)
    if (!withRoleId.error) {
      roleRows = withRoleId.data
    } else {
      const withRole = await supabase.from("user_roles").select("role").eq("user_id", user.id)
      roleRows = withRole.data
    }
  }

  const roles = uniqueRoles(
    (roleRows || []).flatMap((row: any) => [row.role, row.roles?.name])
  )

  return {
    id: user.id,
    email: user.email,
    profile,
    roles,
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (!user.roles.includes("admin")) {
    redirect("/dashboard")
  }
  return user
}

export async function requireAdminApi() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  if (!user.roles.includes("admin")) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  return { user, error: null }
}
