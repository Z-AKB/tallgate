export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-100" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-video bg-slate-200" />
          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-6 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="flex gap-3">
              <div className="h-10 w-36 rounded-lg bg-slate-200" />
              <div className="h-10 w-32 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
                <div className="h-9 w-full rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3 py-3">
              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
              <div className="h-9 w-16 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}