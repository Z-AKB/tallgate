import { requireAdmin } from "@/lib/auth/guards"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import UsersClient from "@/components/admin/UsersClient"

export const metadata = {
  title: "Users & Roles | TallGate Admin",
}

export default async function AdminUsersPage() {
  await requireAdmin()

  type AdminUser = {
    id: string
    full_name: string
    email: string
    created_at: string
    role: string
  }

  let users: AdminUser[] = []
  let roleNames: string[] = []
  let loadWarning = ""
  let loadFailed = false

  if (!isSupabaseConfigured()) {
    loadFailed = true
    loadWarning = "User records are unavailable because Supabase is not configured."
  } else {
    const supabase = createClient()

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        created_at,
        user_roles (
          roles ( name )
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      loadFailed = true
      console.error("Error fetching users:", error)
      loadWarning = "User records could not be loaded from Supabase."
    } else {
      users = (profiles ?? []).map((p) => {
        const roleObj = p.user_roles?.[0]?.roles
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          created_at: p.created_at,
          role: roleObj ? roleObj.name : "learner",
        }
      })
    }

    const { data: roles, error: rolesError } = await supabase.from("roles").select("name")

    if (rolesError) {
      console.error("Error fetching roles:", rolesError)
      loadWarning = loadWarning
        ? `${loadWarning} The role list could not be loaded, so role assignment may be unavailable.`
        : "The role list could not be loaded, so role assignment may be unavailable."
    } else {
      roleNames = (roles ?? []).map((r) => r.name)
    }
  }

  if (roleNames.length === 0) {
    roleNames = ["learner", "instructor", "startup_founder", "business_owner", "admin"]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage system users, assign roles, and create new accounts.
        </p>
      </div>

      {loadWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {loadWarning}
        </div>
      )}

      <UsersClient
        initialUsers={users}
        availableRoles={roleNames}
        loadFailed={loadFailed}
      />
    </div>
  )
}