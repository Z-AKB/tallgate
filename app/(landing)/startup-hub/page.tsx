import Link from "next/link"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiOutlineRocketLaunch,
  HiOutlineCpuChip,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineCheck,
  HiOutlineArrowRight,
} from "react-icons/hi2"

export const metadata = {
  title: "Startup Hub | TallGate",
  description: "Technical incubation, MVP architecture, fractional CTO advisory, and venture support for early-stage Nigerian founders.",
}

export default function StartupHubPage() {
  const pillars = [
    {
      title: "Technical Architecture & MVP Build",
      description: "We help you specify, architect, and build your production MVP in 6 to 8 weeks with clean database schemas and scalable cloud infrastructure.",
      deliverables: ["Full Architecture Spec", "Rapid MVP Development", "CI/CD & Cloud Deployment", "Quality Assurance & Security Review"]
    },
    {
      title: "Fractional CTO Leadership",
      description: "Get senior technical leadership to direct engineering velocity, evaluate tech stack choices, interview developers, and represent tech on your board.",
      deliverables: ["Tech Due Diligence", "Developer Interview Panels", "Sprint & Agile Governance", "Security & Data Compliance"]
    },
    {
      title: "Venture & Investor Readiness",
      description: "Refine your technical narrative, demonstrate solid unit economics, and prepare investor-grade data rooms for angel and institutional rounds.",
      deliverables: ["Pitch Deck Tech Audit", "Investor Q&A Prep", "Angel Syndicate Introductions", "Pilot Partner Sourcing"]
    }
  ]

  return (
    <div className="py-12 sm:py-20 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="The Technical Engine for Early-Stage African Founders"
          description="We bridge the gap between brilliant business ideas and robust software execution. Avoid common founder pitfalls by partnering with senior software architects."
        />

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="card-base flex flex-col justify-between hover:border-white/20 transition-all border-white/10"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-sm flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                    0{idx + 1}
                  </span>

                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {pillar.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  {pillar.description}
                </p>

                <div className="space-y-2 mb-6">
                  <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Includes:</p>
                  <ul className="space-y-1.5">
                    {pillar.deliverables.map((d, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/startup-hub/apply"
                  prefetch={true}
                  className="btn-secondary w-full justify-center text-xs py-2"
                >
                  Apply for this Track
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 site-panel rounded-2xl p-8 sm:p-12 text-white border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Ready to Accelerate Your Startup?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We review applications on a rolling basis. Founders accepted into the incubation track receive direct access to our engineering team and weekly technical sprints.
            </p>
          </div>
          <Link
            href="/startup-hub/apply"
            prefetch={true}
            className="btn-primary text-sm px-8 py-3 w-full md:w-auto text-center"
          >
            Submit Startup Application
          </Link>
        </div>
      </div>
    </div>
  )
}
