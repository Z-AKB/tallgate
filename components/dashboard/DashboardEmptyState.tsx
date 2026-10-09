import Link from "next/link"
import type { ReactNode } from "react"

type DashboardEmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      {icon ? <div className="mx-auto mb-3 flex justify-center text-brand-primary">{icon}</div> : null}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn-default-light mt-4 inline-flex text-xs">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}