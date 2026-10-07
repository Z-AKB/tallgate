import Link from "next/link"
import { servicesData } from "@/lib/data/services"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiOutlineCode,
  HiOutlineDeviceMobile,
  HiOutlineCloud,
  HiOutlineShieldCheck,
  HiOutlineChip,
  HiOutlineBriefcase,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from "react-icons/hi"

export const metadata = {
  title: "Enterprise Technology Services | TallGate",
  description: "Bespoke custom software, mobile engineering, cloud infrastructure, cybersecurity audits, and AI business automation in Nigeria.",
}

export default function ServicesPage() {
  const getServiceIcon = (slug: string) => {
    switch (slug) {
      case "custom-software-development":
        return <HiOutlineCode className="w-7 h-7 text-brand-primary" />
      case "web-mobile-engineering":
        return <HiOutlineDeviceMobile className="w-7 h-7 text-brand-primary" />
      case "cloud-devops-infrastructure":
        return <HiOutlineCloud className="w-7 h-7 text-brand-primary" />
      case "cybersecurity-compliance":
        return <HiOutlineShieldCheck className="w-7 h-7 text-brand-primary" />
      case "ai-business-automation":
        return <HiOutlineChip className="w-7 h-7 text-brand-primary" />
      default:
        return <HiOutlineBriefcase className="w-7 h-7 text-brand-primary" />
    }
  }

  return (
    <div className="py-12 sm:py-20 space-y-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Technology Solutions Built for Scale, Security & Performance"
          description="From architecting high-throughput custom software to conducting rigorous cybersecurity penetration tests, we help businesses build technology that drives measurable growth."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {servicesData.map((service) => (
            <div
              key={service.slug}
              className="card-base flex flex-col justify-between hover:border-white/20 transition-all border-white/10"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {getServiceIcon(service.slug)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                      {service.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {service.fullDescription}
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Core Deliverables:
                    </h4>
                    <ul className="space-y-1.5">
                      {service.deliverables.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <HiOutlineCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Technologies Utilized:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {service.technologies.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-md text-xs font-medium border border-white/10"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  href={`/services/${service.slug}`}
                  prefetch={true}
                  className="text-xs font-semibold text-indigo-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Detailed breakdown & scope</span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/consultation?service=${encodeURIComponent(service.title)}`}
                  prefetch={true}
                  className="btn-primary text-xs py-2 px-4 w-full sm:w-auto text-center"
                >
                  Request Technical Proposal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoping CTA banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="site-panel rounded-2xl p-8 sm:p-12 text-white border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Have a Custom Engineering or Consulting Requirement?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Schedule a confidential scoping call with our lead technical architect. We provide clear deliverables, transparent milestone schedules, and production guarantees.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link href="/consultation" prefetch={true} className="btn-primary text-sm px-6 py-3 text-center justify-center">
              Schedule Scoping Call
            </Link>
            <Link href="/contact" prefetch={true} className="btn-secondary text-sm px-6 py-3 text-center justify-center">
              Contact Campus Office
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
