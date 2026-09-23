"use client"

import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineCubeTransparent,
  HiOutlineAcademicCap,
  HiOutlineCheck,
} from "react-icons/hi"
import SectionHeader from "@/components/ui/SectionHeader"

export default function WhyChooseUs() {
  const features = [
    {
      icon: <HiOutlineCubeTransparent className="w-6 h-6 text-brand-primary" />,
      title: "Product Strategy & Architecture",
      subtitle: "Maintainable Architecture from Day One",
      description:
        "We don't just write code; we design modular, event-driven architectures with clear domain boundaries that make future changes easier to manage.",
      bullets: [
        "Comprehensive architectural blueprints",
        "Database normalization & query optimization",
        "Microservices & modular monolith designs",
      ],
    },
    {
      icon: <HiOutlineLightningBolt className="w-6 h-6 text-amber-500" />,
      title: "High-Velocity Agile Engineering",
      subtitle: "Transparent Bi-Weekly Milestones",
      description:
        "Ship fast with high confidence. Our automated CI/CD pipelines, strict code reviews, and test-driven development guarantee dependable production software delivered on schedule.",
      bullets: [
        "Automated unit & integration test suites",
        "Bi-weekly interactive staging demonstrations",
        "Git-backed transparent sprint tracking",
      ],
    },
    {
      icon: <HiOutlineShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: "Enterprise Security & NDPR Compliance",
      subtitle: "Hardened Against African Threat Landscapes",
      description:
        "We implement bank-grade encryption at rest and in transit, role-based access control (RBAC), and automated compliance checks tailored specifically for Nigerian data privacy laws.",
      bullets: [
        "NDPR data privacy audit readiness",
        "Automated vulnerability scanning & penetration testing",
        "Zero-trust API authentication & authorization",
      ],
    },
    {
      icon: <HiOutlineAcademicCap className="w-6 h-6 text-indigo-600" />,
      title: "Venture Studio & Talent Ecosystem",
      subtitle: "Long-Term Technical Continuity",
      description:
        "Beyond agency contracts, we operate an active physical engineering academy in Abuja, providing our clients and portfolio startups with a steady stream of pre-vetted developer talent.",
      bullets: [
        "Direct access to top academy engineering graduates",
        "Fractional CTO advisory for non-technical founders",
        "Post-launch SLA maintenance & dedicated dev teams",
      ],
    },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <SectionHeader
        badge="The TallGate Advantage"
        title="Why Growing Enterprises & Founders Partner with TallGate"
        description="We bridge the gap between world-class software engineering standards and the pragmatic, fast-evolving dynamics of the African commercial landscape."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="card-base relative group hover:-translate-y-1 hover:shadow-elevated transition-all duration-200 hover:border-indigo-300/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-300">
                    {feature.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {feature.description}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <ul className="space-y-2">
                {feature.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="text-xs text-slate-300 flex items-start gap-2 font-medium">
                    <HiOutlineCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
