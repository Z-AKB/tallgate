import { requireAdmin } from "@/lib/auth/guards"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { siteConfig } from "@/lib/config/site"

export const metadata = {
  title: "System Settings | TallGate Admin",
}

type ConfigItem = {
  label: string
  configured: boolean
  detail: string
}

export default async function AdminSettingsPage() {
  const user = await requireAdmin()

  const config: ConfigItem[] = [
    {
      label: "Supabase (public)",
      configured: isSupabaseConfigured(),
      detail: "Powers authentication, the learning catalogue, and every database-backed feature.",
    },
    {
      label: "Supabase service role",
      configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: "Required for admin actions, certificate issuance, and server-side rate limiting.",
    },
    {
      label: "Public site URL",
      configured: Boolean(
        process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ),
      detail: "Used to build certificate verification and QR links.",
    },
    {
      label: "Email delivery",
      configured: Boolean(process.env.RESEND_API_KEY),
      detail: "Used by the admin email endpoint to send messages to contacts.",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="mt-1 text-sm text-slate-300">
          Integration status and account-level configuration for the TallGate admin console.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">Signed-in administrator</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</dt>
            <dd className="mt-0.5 text-slate-900">{user.profile?.full_name || "Admin"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</dt>
            <dd className="mt-0.5 break-all text-slate-900">
              {user.email || user.profile?.email || "Not set"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">Integration status</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {config.map((item) => (
            <li key={item.label} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  item.configured
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                {item.configured ? "Configured" : "Not configured"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          These values come from environment variables. Update them in your hosting provider
          (or `.env.local` in development) and redeploy to change them. Contact information shown
          across the site comes from the shared site config ({siteConfig.supportEmail}).
        </p>
      </div>
    </div>
  )
}