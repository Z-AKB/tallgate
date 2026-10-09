import Link from "next/link"
import { requireUser } from "@/lib/auth/guards"
import { getPortalPresentation } from "@/lib/auth/roles"
import SignOutButton from "@/components/auth/SignOutButton"
import { siteConfig } from "@/lib/config/site"
import { HiOutlineCog6Tooth, HiOutlineUserCircle } from "react-icons/hi2"

export const metadata = {
  title: "Account Settings | TallGate",
  description: "Manage your TallGate account and portal preferences.",
}

export default async function DashboardSettingsPage() {
  const user = await requireUser()
  const portal = getPortalPresentation(user.roles)

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">
          <HiOutlineCog6Tooth className="w-4 h-4" />
          <span>Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your account details and jump to the settings you use most.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HiOutlineUserCircle className="w-4 h-4 text-brand-primary" />
          <span>Account</span>
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</dt>
            <dd className="text-slate-900 mt-0.5">{user.profile?.full_name || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</dt>
            <dd className="text-slate-900 mt-0.5 break-all">
              {user.email || user.profile?.email || "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Portal</dt>
            <dd className="text-slate-900 mt-0.5">
              {portal.isLearner ? "Learner & Client" : "Client"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <Link href="/dashboard/profile" className="btn-primary text-xs">
            Edit profile details
          </Link>
          <Link href="/dashboard/certificates" className="btn-secondary-light text-xs">
            My certificates
          </Link>
          <Link href="/dashboard/support" className="btn-secondary-light text-xs">
            Contact support
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Session</h2>
        <p className="text-xs text-slate-500">
          Sign out of this device. You can sign back in any time with your email and password.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SignOutButton className="btn-secondary-light text-xs">Sign out</SignOutButton>
          <p className="text-[11px] text-slate-400">
            Need help? <a href={`mailto:${siteConfig.supportEmail}`} className="underline">{siteConfig.supportEmail}</a>
          </p>
        </div>
      </div>
    </div>
  )
}