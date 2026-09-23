"use client"

import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiOutlineSearch,
  HiOutlineCode,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
} from "react-icons/hi"

export default function ProcessSection() {
  const steps = [
    {
      step: "01",
      icon: <HiOutlineSearch className="w-6 h-6 text-brand-primary" />,
      title: "Discovery & System Architecture",
      description:
        "We dissect your business goals, user journeys, data schemas, and compliance requirements to create an immutable technical blueprint and cost-predictable roadmap.",
    },
    {
      step: "02",
      icon: <HiOutlineCode className="w-6 h-6 text-brand-primary" />,
      title: "Agile Sprint Delivery",
      description:
        "Our engineering teams use continuous integration, clean commits, real-time staging previews, and automated test coverage throughout delivery.",
    },
    {
      step: "03",
      icon: <HiOutlineShieldCheck className="w-6 h-6 text-brand-primary" />,
      title: "Security & NDPR Hardening",
      description:
        "Rigorous automated and manual QA, penetration tests, role authorization verification, and data encryption audits before entering production environments.",
    },
    {
      step: "04",
      icon: <HiOutlineTrendingUp className="w-6 h-6 text-brand-primary" />,
      title: "Deployment & Managed SLA",
      description:
        "Cloud provisioning on AWS/GCP, automated telemetry alerts, developer handoff documentation, and ongoing maintenance options.",
    },
  ]

  return (
    <section className="bg-slate-900 text-white py-20 border-y border-slate-800 relative overflow-hidden">
      {/* Background Tech Mesh */}
      <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
            How We Work
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Our 4-Stage Engineering Delivery Process
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            A structured, battle-tested methodology designed to remove friction, eliminate scope creep, and ship resilient digital products on schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-850/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 relative group transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-mono font-bold text-slate-600 group-hover:text-blue-400 transition-colors">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Phase {item.step}</span>
                <span className="text-emerald-400">Strict Quality Gate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
