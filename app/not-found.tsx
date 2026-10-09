import Link from "next/link"

export const metadata = {
  title: "Page not found | TallGate",
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        The page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary text-sm">
          Back to home
        </Link>
        <Link href="/contact" className="btn-secondary text-sm">
          Contact us
        </Link>
      </div>
    </div>
  )
}
