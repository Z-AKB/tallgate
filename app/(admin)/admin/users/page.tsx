import { requireAdmin } from "@/lib/auth/guards"
import { createClient } from "@/lib/supabase/server"
import UsersClient from "@/components/admin/UsersClient"

export const metadata = {
  title: "Users & Roles | TallGate Admin",
}

export default async function AdminUsersPage() {
  await requireAdmin()
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
    console.error("Error fetching users:", error)
  }

  const users = (profiles || []).map((p: any) => {
    const roleObj = p.user_roles?.[0]?.roles
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      created_at: p.created_at,
      role: roleObj ? roleObj.name : "learner"
    }
  })

  const { data: roles } = await supabase.from("roles").select("name")
  const roleNames = roles?.map((r) => r.name) || ["learner", "admin", "instructor"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users & Roles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage system users, assign roles, and create new accounts.
        </p>
      </div>
      <UsersClient initialUsers={users} availableRoles={roleNames} />
    </div>
  )
}
