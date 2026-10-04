"use client"

import { useState } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import { siteConfig } from "@/lib/config/site"
import { HiPlus, HiMinus } from "react-icons/hi"

interface FaqItem {
  question: string
  answer: string
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: FaqItem[] = [
    {
      question: "Who owns the Intellectual Property (IP) and source code?",
      answer:
        "IP ownership and source-code handover are defined in the project agreement. We document repositories, architectural designs, database schemas, and assets so your organization has clear access at handover.",
    },
    {
      question: "How long does a typical custom software project take to deliver?",
      answer:
        "Delivery timelines depend on the scope, technical requirements, and team availability. We provide a project-specific timeline after discovery and planning.",
    },
    {
      question: "Are TallGate's solutions compliant with Nigerian NDPR & international privacy laws?",
      answer:
        "We can design systems with NDPR requirements and applicable privacy practices in mind. Specific compliance obligations are assessed for each project.",
    },
    {
      question: "Where is TallGate located, and can we meet physically?",
      answer:
        `Our headquarters and physical engineering lab are located at ${siteConfig.address.line1}, ${siteConfig.address.line2}. Clients are welcome to visit our physical facility or schedule remote consultation sessions anywhere in West Africa and globally.`,
    },
    {
      question: "Do you offer post-launch maintenance and dedicated engineering support?",
      answer:
        "Yes. We offer maintenance packages that can cover monitoring, security patching, database optimization, and feature work based on an agreed support plan.",
    },
    {
      question: "How do your Academy courses and training cohorts work?",
      answer:
        "Our Academy provides intensive, hands-on software engineering, cybersecurity, and cloud cohorts in Abuja with hybrid options. Students build production-grade projects and receive accredited certificate credentials upon completion.",
    },
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="faq">
      <SectionHeader
        badge="Got Questions?"
        title="Frequently Asked Questions"
        description="Everything you need to know about our engineering standards, delivery timelines, pricing models, and IP security."
      />

      <div className="mt-12 space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "card-base border-indigo-400/40 bg-white/[0.05] shadow-card"
                  : "card-base border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-semibold text-base sm:text-lg text-white">
                  {faq.question}
                </span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isOpen
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                >
                  {isOpen ? <HiMinus className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/10">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
