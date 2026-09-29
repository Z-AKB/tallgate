import Link from "next/link"
import Logo from "@/components/layout/Logo"
import { FaWhatsapp, FaLinkedin, FaInstagram } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-brand-navy text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand & Overview */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              TallGate is the technology partner for businesses and entrepreneurs across Nigeria and West Africa. We engineer bespoke software, provide strategic technical consulting, and cultivate high-demand engineering talent.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <p className="flex items-start gap-2">
                <HiOutlineLocationMarker className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <span>No. 2 F.O. Eburuche Close, Gbazango Extension, Kubwa, Abuja, Nigeria</span>
              </p>
              <p className="flex items-center gap-2">
                <HiOutlinePhone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <a href="tel:+2349131898566" className="hover:text-white transition-colors">+234 913 189 8566</a>
              </p>
              <p className="flex items-center gap-2">
                <HiOutlineMail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <a href="mailto:tallgatecomputing@gmail.com" className="hover:text-white transition-colors">tallgatecomputing@gmail.com</a>
              </p>
            </div>
          </div>

          {/* Col 2: Enterprise Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Enterprise Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/services/custom-software-development" prefetch={true} className="hover:text-white transition-colors">
                  Custom Software
                </Link>
              </li>
              <li>
                <Link href="/services/web-mobile-engineering" prefetch={true} className="hover:text-white transition-colors">
                  Web & Mobile Engineering
                </Link>
              </li>
              <li>
                <Link href="/services/cloud-devops-infrastructure" prefetch={true} className="hover:text-white transition-colors">
                  Cloud & DevOps
                </Link>
              </li>
              <li>
                <Link href="/services/cybersecurity-compliance" prefetch={true} className="hover:text-white transition-colors">
                  Cybersecurity & NDPR
                </Link>
              </li>
              <li>
                <Link href="/services/ai-business-automation" prefetch={true} className="hover:text-white transition-colors">
                  AI & Process Automation
                </Link>
              </li>
              <li>
                <Link href="/services/technical-consulting-advisory" prefetch={true} className="hover:text-white transition-colors">
                  Technical Architecture Advisory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Learning & Startup Hub */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Pillars & Programs
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/learning-hub" prefetch={true} className="hover:text-white transition-colors">
                  All Academy Courses
                </Link>
              </li>
              <li>
                <Link href="/learning-hub/full-stack-web-development" prefetch={true} className="hover:text-white transition-colors">
                  Full Stack Engineering
                </Link>
              </li>
              <li>
                <Link href="/learning-hub/cybersecurity-ethical-hacking" prefetch={true} className="hover:text-white transition-colors">
                  Cybersecurity Lab
                </Link>
              </li>
              <li>
                <Link href="/startup-hub" prefetch={true} className="hover:text-white transition-colors">
                  Startup Hub Overview
                </Link>
              </li>
              <li>
                <Link href="/startup-hub/apply" prefetch={true} className="hover:text-white transition-colors">
                  Apply for Incubation
                </Link>
              </li>
              <li>
                <Link href="/verify" prefetch={true} className="hover:text-white transition-colors">
                  Certificate Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company & Action */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Company & Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" prefetch={true} className="hover:text-white transition-colors">
                  About TallGate
                </Link>
              </li>
              <li>
                <Link href="/portfolio" prefetch={true} className="hover:text-white transition-colors">
                  Case Studies & Work
                </Link>
              </li>
              <li>
                <Link href="/consultation" prefetch={true} className="hover:text-white transition-colors">
                  Book a Consultation
                </Link>
              </li>
              <li>
                <Link href="/contact" prefetch={true} className="hover:text-white transition-colors">
                  Abuja Campus Map & Hours
                </Link>
              </li>
              <li>
                <Link href="/login" prefetch={true} className="hover:text-white transition-colors">
                  Student/Client Portal
                </Link>
              </li>
            </ul>

            <div className="pt-6">
              <a
                href="https://wa.me/2349131898566?text=Hello%20TallGate%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {currentYear} TallGate Computing Enterprise. All rights reserved. Registered in Nigeria.</p>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <div className="flex items-center space-x-3 text-slate-400">
              <a href="https://www.instagram.com/tallgate_computing?stkn=bW1iNjMwd2w5aGNw" target="_blank" rel="noopener noreferrer" aria-label="TallGate on Instagram" className="hover:text-white transition-colors">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href="https://x.com/tallgate_ng" target="_blank" rel="noopener noreferrer" aria-label="TallGate on X" className="hover:text-white transition-colors">
                <FaXTwitter className="w-4 h-4" />
              </a>
              <a href="https://wa.me/2349131898566" target="_blank" rel="noopener noreferrer" aria-label="TallGate WhatsApp" className="hover:text-white transition-colors">
                <FaWhatsapp className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
