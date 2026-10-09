import { toCategoryInitials } from "@/lib/utils"

type CourseThumbnailProps = {
  category: string
  className?: string
}

export function CourseThumbnail({ category, className = "" }: CourseThumbnailProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-brand-light text-brand-primary font-bold select-none ${className}`}
    >
      <span className="text-2xl sm:text-3xl">{toCategoryInitials(category)}</span>
    </div>
  )
}