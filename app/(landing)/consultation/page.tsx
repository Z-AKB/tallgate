import ConsultationForm from "@/features/consultation/ConsultationForm"
import { siteConfig } from "@/lib/config/site"
import SectionHeader from "@/components/ui/SectionHeader"
import { HiOutlineShieldCheck, HiOutlineClock, HiOutlineDocumentText } from "react-icons/hi"
import { FaWhatsapp } from "react-icons/fa"

export const metadata = {
  title: "Book a Technical Consultation | TallGate",
  description: "Schedule a confidential technical scoping session with our lead software architects.",
}

export default function ConsultationPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Schedule a Technical Consultation"
          description="Discuss your software architecture, web/mobile app build, cybersecurity assessment, or business automation requirements directly with our senior engineering team."
        />

        {/* Expectation Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
          <div className="card-flat p-4 flex items-center gap-3 bg-white/[0.03] border border-white/10">
            <HiOutlineClock className="w-6 h-6 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">24-Hour Response</p>
              <p className="text-xs text-slate-400">Fast review of requirements</p>
            </div>
          </div>
          <div className="card-flat p-4 flex items-center gap-3 bg-white/[0.03] border border-white/10">
            <HiOutlineShieldCheck className="w-6 h-6 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Strict Mutual NDA</p>
              <p className="text-xs text-slate-400">Your ideas & data remain safe</p>
            </div>
          </div>
          <div className="card-flat p-4 flex items-center gap-3 bg-white/[0.03] border border-white/10">
            <HiOutlineDocumentText className="w-6 h-6 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Clear Architecture Plan</p>
              <p className="text-xs text-slate-400">Actionable technical roadmap</p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <ConsultationForm />
        </div>

        <div className="mt-12 text-center text-xs text-slate-400">
          <p>Prefer direct chat? Reach us on WhatsApp at <a href={siteConfig.whatsappLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-300 hover:text-white underline">{siteConfig.phone.display}</a></p>
        </div>
      </div>
    </div>
  )
}
