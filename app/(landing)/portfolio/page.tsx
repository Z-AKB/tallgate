import Link from "next/link"
import { portfolioData } from "@/lib/data/portfolio"
import SectionHeader from "@/components/ui/SectionHeader"
import { HiOutlineCheckCircle, HiOutlineArrowRight } from "react-icons/hi"

export const metadata = {
  title: "Case Studies & Client Work | TallGate",
  description: "Verified case studies and real-world technology projects delivered by TallGate.",
}

export default function PortfolioPage() {
  return (
    <div className="py-12 sm:py-20 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Engineering Systems That Drive Real Business Growth"
          description="Explore our track record of designing, building, and maintaining production systems for West African businesses across healthcare, logistics, and education."
        />

        <div className="space-y-12">
          {portfolioData.map((project, idx) => (
            <div
              key={project.slug}
              className="card-base p-8 sm:p-10 border-white/10 hover:border-white/20 transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Challenge & Solution */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-indigo-300 font-semibold">{project.clientIndustry} • Delivered {project.completionYear}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {project.title}
                    </h2>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {project.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                        The Challenge:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {project.challenge}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                        The Technical Solution:
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {project.solution}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Verified Impact & Tech */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                      Measurable Business Impact:
                    </h4>
                    <ul className="space-y-2.5">
                      {project.impact.map((item, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Technologies Utilized:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((t, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-16 text-center site-panel rounded-2xl p-10 border border-white/10">
          <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
            Ready to Build Your Custom Software?
          </h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto mb-6">
            Partner with TallGate for engineering leadership and scalable system architecture.
          </p>
          <Link href="/consultation" prefetch={true} className="btn-primary px-8 py-3 text-sm">
            Book a Technical Consultation
          </Link>
        </div>
      </div>
    </div>
  )
}
