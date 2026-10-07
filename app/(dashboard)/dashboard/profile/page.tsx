import { requireUser } from "@/lib/auth/guards"
import ProfileForm from "@/app/(dashboard)/dashboard/profile/ProfileForm"

export const metadata = {
  title: "Profile Settings | TallGate",
  description: "Manage your account profile and preferences.",
}

export default async function ProfilePage() {
  const user = await requireUser()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Profile Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your personal details and contact information.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <ProfileForm initialProfile={user.profile} userId={user.id} />
      </div>
    </div>
  )
}
