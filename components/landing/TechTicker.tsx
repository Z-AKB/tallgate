"use client"

export default function TechTicker() {
  const industries = [
    "Fintech & Payments",
    "Healthcare & Telemedicine",
    "B2B Logistics & Supply Chain",
    "Agritech & Commodity Trade",
    "EdTech & Academy Platforms",
    "Public Sector & GovTech",
    "E-Commerce & Retail Automation",
    "Real Estate & Facility Tech",
  ]

  const technologies = [
    "AWS Cloud",
    "Google Cloud",
    "Next.js / React",
    "Python & FastAPI",
    "Node.js & TypeScript",
    "Docker & Kubernetes",
    "PostgreSQL & Redis",
    "Supabase",
    "Flutter / React Native",
    "TailwindCSS",
  ]

  return (
    <section className="py-8 bg-slate-900 text-white border-y border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <p className="text-center text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Trusted Technologies &amp; Industry Domain Expertise
        </p>
      </div>

      {/* Marquee Track 1: Technologies */}
      <div className="flex overflow-hidden relative select-none [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
        <div className="flex shrink-0 gap-6 py-2 animate-marquee items-center justify-around whitespace-nowrap">
          {technologies.concat(technologies).map((tech, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white hover:border-brand-primary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
              <span>{tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Track 2: Industry Domains */}
      <div className="flex overflow-hidden relative select-none mt-3 [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
        <div className="flex shrink-0 gap-6 py-2 animate-marquee items-center justify-around whitespace-nowrap" style={{ animationDirection: "reverse" }}>
          {industries.concat(industries).map((domain, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span className="text-emerald-400">✦</span>
              <span>{domain}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
