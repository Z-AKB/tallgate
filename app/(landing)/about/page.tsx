import Link from "next/link"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineLightBulb,
} from "react-icons/hi"

export const metadata = {
  title: "About TallGate | Technology Partner & Academy",
  description: "Learn about TallGate's mission, engineering standards, and physical lab facilities in Abuja, Nigeria.",
}

export default function AboutPage() {
  const principles = [
    {
      title: "Clean, Maintainable Architecture",
      description: "We don't cut corners. Every line of code, database schema, and cloud deployment is engineered for longevity, maintainability, and security.",
    },
    {
      title: "Lab-First, Practical Tech Education",
      description: "Our students learn by building production-grade software in our dedicated computer workstation lab in Kubwa, Abuja.",
    },
    {
      title: "Honest Scoping & Transparent Delivery",
      description: "We give clear technical timelines, realistic cost projections, and continuous milestone visibility to our business clients and founders.",
    },
    {
      title: "West African Ecosystem Empowerment",
      description: "We are committed to building the technology infrastructure that powers African commerce, fintech, healthcare, and digital employment.",
    },
  ]

  return (
    <div className="py-12 sm:py-20 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Building the Operating System for West African Technology"
          description="TallGate is an integrated technology business providing enterprise software engineering, cloud infrastructure, cybersecurity audits, and high-impact digital skills training."
        />

        {/* Mission & Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bridging the African Tech Execution Gap
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Founded in Abuja, Nigeria, TallGate was established to solve a critical market challenge: African businesses and startups often struggle to find reliable, senior software engineering partners who understand local operating conditions, while aspiring engineers lack access to rigorous, practical, lab-based technical training.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              We operate across three unified pillars:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="font-bold text-sm text-indigo-300 block">1. Enterprise Services (Core Identity)</span>
                <span className="text-xs text-slate-300">Bespoke software development, mobile engineering, cloud infrastructure, and security assessments.</span>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="font-bold text-sm text-indigo-300 block">2. The Learning Hub</span>
                <span className="text-xs text-slate-300">Comprehensive, lab-first tech education in Web Development, Cybersecurity, Python AI, and Networking.</span>
              </div>
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="font-bold text-sm text-indigo-300 block">3. The Startup Hub</span>
                <span className="text-xs text-slate-300">MVP rapid prototyping, fractional CTO advisory, and technical due diligence for African founders.</span>
              </div>
            </div>
          </div>

          {/* Physical Campus Card */}
          <div className="site-panel rounded-2xl p-8 sm:p-10 text-white border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <HiOutlineOfficeBuilding className="w-8 h-8 text-indigo-400" />
              <div>
                <h3 className="text-xl font-bold text-white">The Abuja Campus & Labs</h3>
                <p className="text-xs text-slate-400">Physical Training & Engineering Center</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Our campus in Kubwa, Abuja features dedicated computer workstations, high-speed fiber internet, and isolated cybersecurity and networking lab environments.
            </p>

            <div className="space-y-3 border-t border-white/10 pt-4 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <HiOutlineLocationMarker className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>No. 2 F.O. Eburuche Close, Gbazango Extension, Kubwa, Abuja, Nigeria</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-semibold text-white">Opening Hours:</span>
                <span>Mon – Fri: 8:00 AM – 6:00 PM | Sat: 9:00 AM – 4:00 PM</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/contact" prefetch={true} className="btn-primary w-full justify-center text-xs py-2.5">
                Visit Campus or Schedule Meeting
              </Link>
            </div>
          </div>
        </div>

        {/* Principles Grid */}
        <div className="pt-16 border-t border-white/10">
          <SectionHeader
            title="Our Core Operating Principles"
            description="The values and standards that guide every software build, consulting engagement, and student cohort."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {principles.map((item, idx) => (
              <div key={idx} className="card-base border-white/10 hover:border-white/20">
                <HiOutlineCheckCircle className="w-6 h-6 text-indigo-400 mb-3" />
                <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
