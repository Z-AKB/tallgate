"use client"

import { useState } from "react"
import Link from "next/link"
import { coursesData, CourseOffering } from "@/lib/data/courses"
import { portfolioData } from "@/lib/data/portfolio"
import { formatNaira } from "@/lib/utils"
import SectionHeader from "@/components/ui/SectionHeader"
import CourseEnrollModal from "@/features/learning/CourseEnrollModal"
import ConsultationForm from "@/features/consultation/ConsultationForm"

// Modular Landing Page Components
import HeroSection from "@/components/landing/HeroSection"
import TechTicker from "@/components/landing/TechTicker"
import WhyChooseUs from "@/components/landing/WhyChooseUs"
import ProcessSection from "@/components/landing/ProcessSection"
import ServicesDirectory from "@/components/landing/ServicesDirectory"
import FaqSection from "@/components/landing/FaqSection"

import {
  HiOutlineArrowRight,
  HiCheckCircle,
} from "react-icons/hi"

export default function HomePage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseOffering | null>(null)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)

  const handleOpenEnroll = (course: CourseOffering) => {
    setSelectedCourse(course)
    setIsEnrollModalOpen(true)
  }

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      {/* 1. HERO SECTION (Split Visual Card + Metrics + CTAs) */}
      <HeroSection />

      {/* 2. TECH STACK & INDUSTRY MARQUEE TICKER */}
      <TechTicker />

      {/* 3. VALUE PROPOSITION: WHY CHOOSE TALLGATE */}
      <WhyChooseUs />

      {/* 4. 4-STAGE ENGINEERING DELIVERY PROCESS */}
      <ProcessSection />

      {/* 5. INTERACTIVE FILTERABLE SERVICES DIRECTORY */}
      <ServicesDirectory />

      {/* 6. REAL-WORLD CASE STUDIES & VERIFIED IMPACT */}
      <section className="bg-slate-900 text-white py-20 border-y border-slate-800" id="case-studies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Proven Track Record
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Real-World Engineering Case Studies
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
              Explore how we design, secure, and deploy scalable digital solutions for African enterprises across healthcare, logistics, fintech, and education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolioData.map((project) => (
              <div
                key={project.slug}
                className="bg-slate-850 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 inline-block mb-3">
                    {project.clientIndustry}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight mb-2.5">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {project.summary}
                  </p>

                  <div className="space-y-2 mb-6 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
                      Verified Business Impact:
                    </p>
                    <ul className="space-y-1.5">
                      {project.impact.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-1.5">
                  {project.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] border border-slate-700 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/portfolio"
              className="btn-secondary text-sm px-6 py-3 inline-flex items-center gap-2 font-medium"
            >
              <span>Explore All Verified Case Studies</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SUPPORTING PILLAR 1: LEARNING HUB ACADEMY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="learning">
        <SectionHeader
          badge="TallGate Academy"
          title="Industry-Standard Tech Training & Accredited Certifications"
          description="We run an intensive physical and hybrid engineering academy in Abuja. Learn from senior developers with real production experience."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {coursesData.slice(0, 3).map((course) => (
            <div
              key={course.slug}
              className="card-base flex flex-col justify-between hover:border-white/20 transition-all duration-200 border-white/10"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{course.level}</span>
                  <span className="text-xs text-slate-400 font-medium">{course.format}</span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {course.shortDescription}
                </p>

                <div className="flex items-baseline gap-2 mb-4 bg-white/[0.03] p-3 rounded-xl border border-white/10">
                  <span className="text-xl font-bold text-white">
                    {formatNaira(course.priceNgn)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {course.duration}</span>
                </div>

                <div className="space-y-1.5 mb-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What you will master:</p>
                  <ul className="space-y-1.5">
                    {course.learningOutcomes.slice(0, 3).map((outcome, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <HiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <Link
                  href={`/learning-hub/${course.slug}`}
                  prefetch={true}
                  className="text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
                >
                  View Full Syllabus
                </Link>

                <button
                  onClick={() => handleOpenEnroll(course)}
                  className="btn-primary text-xs py-2 px-4 shadow-sm"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/learning-hub"
            prefetch={true}
            className="btn-secondary text-sm px-6 py-2.5 inline-flex items-center gap-2"
          >
            <span>Explore Academy Courses &amp; Syllabi</span>
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 8. SUPPORTING PILLAR 2: STARTUP HUB */}
      <section className="site-panel border-y border-white/10 py-20" id="startup-hub">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                TallGate Venture Studio
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                We Help African Founders Build, Validate &amp; Launch Resilient MVPs
              </h2>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                Building a tech startup in Africa requires more than just code. TallGate provides early-stage entrepreneurs with technical due diligence, architectural roadmaps, MVP rapid prototyping, and venture mentorship.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
                  <h4 className="font-bold text-sm text-white mb-1">MVP Architecture</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Avoid expensive rewrites by building on scalable, production-ready foundations.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
                  <h4 className="font-bold text-sm text-white mb-1">Fractional CTO</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Senior technical leadership and developer vetting for non-technical founders.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
                  <h4 className="font-bold text-sm text-white mb-1">Product Validation</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    User journey mapping, unit economics scoping, and pitch deck technical reviews.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
                  <h4 className="font-bold text-sm text-white mb-1">Ecosystem Network</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Connect with fellow founders, angel syndicates, and corporate pilot partners.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link href="/startup-hub/apply" prefetch={true} className="btn-primary w-full sm:w-auto px-6 py-3 font-semibold shadow-sm">
                  Apply for Startup Support
                </Link>
                <Link href="/startup-hub" prefetch={true} className="btn-secondary w-full sm:w-auto px-5 py-3 font-semibold">
                  Learn About the Program
                </Link>
              </div>
            </div>

            {/* Visual Fast-Track Box */}
            <div className="lg:col-span-5 site-panel rounded-2xl p-8 text-white border border-white/10 shadow-xl space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-1">Founder Program</p>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  The TallGate Founder Fast-Track
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Designed specifically for Nigerian founders solving high-value problems in Fintech, Logistics, Agritech, Healthtech, and B2B Commerce.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    01
                  </span>
                  <div>
                    <p className="font-bold text-white">Technical Scoping &amp; Architecture</p>
                    <p className="text-slate-300 text-xs mt-0.5">
                      Define database schemas, cloud infrastructure, and core feature sets.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    02
                  </span>
                  <div>
                    <p className="font-bold text-white">Rapid 6-Week MVP Build</p>
                    <p className="text-slate-300 text-xs mt-0.5">
                      Ship a functional, tested application directly into the hands of real users.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    03
                  </span>
                  <div>
                    <p className="font-bold text-white">Go-to-Market &amp; Investor Readiness</p>
                    <p className="text-slate-300 text-xs mt-0.5">
                      Telemetry instrumentation, pitch deck polish, and angel syndicate intros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center border-t border-white/10">
                <p className="text-xs text-slate-400">
                  Applications reviewed weekly on a rolling cohort basis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 10. EMBEDDED CONSULTATION FORM (Lead Generation) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="consultation">
        <SectionHeader
          badge="Get In Touch"
          title="Ready to Build or Scale Your Technology?"
          description="Submit your project requirements below. Our lead software architect will review your scope and provide a structured technical proposal."
        />

        <ConsultationForm />
      </section>

      {/* Course Enroll Modal Dialog */}
      <CourseEnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  )
}
