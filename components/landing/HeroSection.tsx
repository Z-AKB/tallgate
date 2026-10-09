"use client"

import Link from "next/link"
import Image from "next/image"
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
} from "react-icons/hi"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
      <div className="absolute -top-52 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="site-panel relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Clean Normal Overline (No Pill) */}
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-indigo-300">
              Enterprise Engineering &amp; Venture Studio • Abuja, Nigeria
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[4.35rem] font-semibold tracking-[-0.045em] text-white leading-[1.04]">
              Technology by Strategy.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-300">
                Innovation by Design.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal max-w-2xl">
              TallGate partners with high-growth businesses and ambitious founders across West Africa to engineer resilient custom software, automate enterprise operations, modernize cloud infrastructure, and develop top-tier tech talent.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href="/consultation"
                prefetch={true}
                className="btn-primary px-7 py-3.5 text-base shadow-md shadow-white/10 flex items-center justify-center gap-2 group"
              >
                <span>Book Technical Consultation</span>
                <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/services"
                prefetch={true}
                className="btn-secondary px-6 py-3.5 text-base font-semibold flex items-center justify-center"
              >
                Explore Solutions
              </Link>
              <Link
                href="/learning-hub"
                prefetch={true}
                className="btn-ghost px-5 py-3.5 text-base font-medium flex items-center justify-center gap-1.5"
              >
                <span>Academy</span>
                <HiOutlineSparkles className="w-4 h-4 text-indigo-300" />
              </Link>
            </div>

            {/* Trust Proof Badges */}
            <div className="pt-5 border-t border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Production-Ready Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>Security-Conscious Engineering</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineLightningBolt className="w-4 h-4 text-amber-300" />
                <span>Maintainable Architecture</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentic Engineering & Strategy Team Photo */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-square bg-slate-900">
                <Image
                  src="/assets/images/hero-team-2026.jpg"
                  alt="TallGate Engineering and Technology Strategy Team in Abuja"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-300">TallGate Engineering &amp; Strategy Hub</span>
                <span>Abuja, Nigeria</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
