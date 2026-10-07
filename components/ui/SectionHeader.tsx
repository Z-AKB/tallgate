import { ReactNode } from "react"

interface SectionHeaderProps {
  badge?: string
  title: string
  description?: string
  centered?: boolean
  children?: ReactNode
  className?: string
}

export default function SectionHeader({
  badge,
  title,
  description,
  centered = true,
  children,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`max-w-3xl ${centered ? "mx-auto text-center" : "text-left"} mb-12 sm:mb-16 ${className}`}
    >
      {badge && (
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-indigo-300 mb-3">
          {badge}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
