import { notFound } from "next/navigation"
import Link from "next/link"
import { servicesData } from "@/lib/data/services"
import ConsultationForm from "@/features/consultation/ConsultationForm"
import {
  HiOutlineCheck,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
} from "react-icons/hi"

export function generateStaticParams() {
  return servicesData.map((service) => ({
    slug: service.slug,
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const service = servicesData.find((s) => s.slug === params.slug)
  if (!service) return { title: "Service Not Found" }

  return {
    title: `${service.title} | TallGate Services`,
    description: service.shortDescription,
  }
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = servicesData.find((s) => s.slug === params.slug)

  if (!service) {
    notFound()
  }

  return (
    <div className="py-12 sm:py-20 space-y-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/services"
          prefetch={true}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        {/* Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {service.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            {service.fullDescription}
          </p>
        </div>

        {/* Content Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-4">
                What We Deliver
              </h2>
              <ul className="space-y-3">
                {service.deliverables.map((item, idx) => (
                  <li key={idx} className="card-flat p-4 flex items-start gap-3 bg-white/[0.03] border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                      <HiOutlineCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-200 leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-4">
                Strategic Business Value
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {service.keyBenefits.map((benefit, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <HiOutlineLightningBolt className="w-5 h-5 text-indigo-400 mb-2" />
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Specs */}
          <div className="space-y-6">
            <div className="card-flat p-6 space-y-4 bg-white/[0.03] border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Engagement Overview
              </h3>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Audience</p>
                <p className="text-xs text-slate-300 mt-1">{service.targetAudience}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Technologies Utilized</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {service.technologies.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white/5 text-slate-300 rounded text-xs border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <a
                  href="#inquiry"
                  className="btn-primary w-full justify-center text-xs py-2.5"
                >
                  Request Scoping Proposal
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Consultation Form */}
        <div id="inquiry" className="pt-10 border-t border-white/10">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Request a Technical Proposal for {service.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide your high-level requirements and our engineering team will follow up with scope and architecture options.
            </p>
          </div>

          <ConsultationForm preselectedService={service.title} />
        </div>
      </div>
    </div>
  )
}
