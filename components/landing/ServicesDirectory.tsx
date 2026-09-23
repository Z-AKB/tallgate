"use client"

import { useState } from "react"
import Link from "next/link"
import { servicesData, ServiceOffering } from "@/lib/data/services"
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

export default function ServicesDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const categories = [
    "All",
    "Engineering",
    "Infrastructure",
    "Security",
    "AI & Data",
    "Consulting",
  ]

  const filteredServices =
    activeCategory === "All"
      ? servicesData
      : servicesData.filter((s) => s.category === activeCategory)

  const getServiceIcon = (slug: string) => {
    switch (slug) {
      case "custom-software-development":
        return <HiOutlineCode className="w-5 h-5 text-indigo-400" />
      case "web-mobile-engineering":
        return <HiOutlineDeviceMobile className="w-5 h-5 text-indigo-400" />
      case "cloud-devops-infrastructure":
        return <HiOutlineCloud className="w-5 h-5 text-indigo-400" />
      case "cybersecurity-compliance":
        return <HiOutlineShieldCheck className="w-5 h-5 text-indigo-400" />
      case "ai-business-automation":
        return <HiOutlineChip className="w-5 h-5 text-indigo-400" />
      default:
        return <HiOutlineBriefcase className="w-5 h-5 text-indigo-400" />
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="services">
      <SectionHeader
        badge="Enterprise Solutions"
        title="Full-Lifecycle Engineering & Technology Services"
        description="We build, protect, and scale digital systems with rigorous software architecture and high security standards."
      />

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-10 mb-12">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
              activeCategory === cat
                ? "bg-white text-slate-950 shadow-sm"
                : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.1] border border-white/10"
            }`}
          >
            {cat === "All" ? "All Solutions" : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.slug}
            className="card-base flex flex-col justify-between hover:-translate-y-1 hover:shadow-elevated hover:border-indigo-300/40 transition-all duration-200 group"
          >
            <div>
              {/* Linear Header: Icon + Title + Category Pill */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getServiceIcon(service.slug)}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                    {service.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-300 border border-white/10 shrink-0">
                  {service.category}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
                {service.shortDescription}
              </p>

              <div className="space-y-2 border-t border-white/[0.08] pt-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Core Deliverables:
                </p>
                <ul className="space-y-1.5">
                  {service.deliverables.slice(0, 3).map((d, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
              <Link
                href={`/services/${service.slug}`}
                prefetch={true}
                className="text-xs font-semibold text-indigo-300 hover:text-white inline-flex items-center gap-1 group-hover:underline"
              >
                <span>Full scope</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href={`/consultation?service=${encodeURIComponent(service.title)}`}
                prefetch={true}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Request Proposal
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/services"
          prefetch={true}
          className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2 font-medium"
        >
          <span>View Detailed Services Specifications</span>
          <HiOutlineArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
