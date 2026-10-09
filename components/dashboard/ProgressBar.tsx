type ProgressBarProps = {
  value: number
  className?: string
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden"
      >
        <div className="h-full rounded-full bg-[#202DB8]" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-500 tabular-nums whitespace-nowrap">
        {percent}%
      </span>
    </div>
  )
}