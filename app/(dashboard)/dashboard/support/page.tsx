import { requireUser } from "@/lib/auth/guards"
import DashboardSupportForm from "./SupportForm"

export const metadata = {
  title: "Support | TallGate Dashboard",
  description: "Contact the TallGate support team from your user dashboard.",
}

export default async function DashboardSupportPage() {
  const user = await requireUser()

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">
          Learner &amp; Client Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Support
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Need help with your account, courses, or services? Send our team a
          message and we’ll follow up with you.
        </p>
      </div>

      <DashboardSupportForm
        fullName={user.profile?.full_name || ""}
        email={user.email || user.profile?.email || ""}
        phone={user.profile?.phone || ""}
      />
    </div>
  )
}
