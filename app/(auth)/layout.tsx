import Link from "next/link"
import Logo from "@/components/layout/Logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="flex justify-center">
          <Logo variant="dark" />
        </div>
        <p className="mt-2 text-xs text-slate-500 font-medium">
          Technology Partner & Academy Portal
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-xl shadow-card">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-navy transition-colors">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  )
}
