import Link from "next/link"
import Image from "next/image"
import SectionHeader from "@/components/ui/SectionHeader"
import { siteConfig } from "@/lib/config/site"
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineSparkles,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineDocumentText,
} from "react-icons/hi"
import {
  HiOutlineCodeBracket,
  HiOutlineRocketLaunch,
  HiOutlineMegaphone,
  HiOutlinePaintBrush,
} from "react-icons/hi2"

export const metadata = {
  title: `About Us | ${siteConfig.companyName}`,
  description:
    "Our corporate statement, hybrid business model, executive leadership, and dedicated technology team.",
}

const profileDocumentPages = [
  { file: "corporate-statement.png", title: "Corporate Statement" },
  { file: "business-model.png", title: "Business Model" },
  { file: "ceo-chisom.png", title: "Chief Executive Officer" },
  { file: "meet-our-team.png", title: "Meet Our Team" },
  { file: "team-leaders.png", title: "Team & Leadership" },
]

export default function AboutPage() {
  const revenueStreams = [
    { name: "Website Development", icon: HiOutlineCodeBracket },
    { name: "Digital Business Setup Services", icon: HiOutlineRocketLaunch },
    { name: "Branding and Design Services", icon: HiOutlinePaintBrush },
    { name: "Social Media Management Retainers", icon: HiOutlineMegaphone },
    { name: "Digital Marketing Campaigns", icon: HiOutlineChartBar },
    { name: "Technology Consulting", icon: HiOutlineBriefcase },
    { name: "Subscription-Based Digital Tools (Future)", icon: HiOutlineSparkles },
    { name: "Training and Workforce Development Programs", icon: HiOutlineAcademicCap },
  ]

  const leadershipTeam = [
    {
      name: "Abdullahi Musa",
      role: "Chief Technology Officer [CTO]",
      image: "/assets/team/abdullahi.png",
      bio: "Leading architecture and delivery across core software engineering, infrastructure resilience, and curriculum innovation.",
    },
    {
      name: "Zion Akanbi",
      role: "ICT Officer",
      image: "/assets/team/zion.png",
      bio: "Managing computer workstation facilities, isolated lab environments, enterprise networking, and hardware systems.",
    },
    {
      name: "Ella Akanbi",
      role: "Admin & HR",
      image: "/assets/team/ella.png",
      bio: "Driving talent operations, organizational culture, customer support triage, and seamless corporate administration.",
    },
  ]

  return (
    <div className="py-12 sm:py-20 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* ==================================================================== */}
        {/* 1. CORPORATE STATEMENT & HERO                                        */}
        {/* ==================================================================== */}
        <div className="site-panel rounded-2xl p-6 sm:p-12 border border-white/10 relative overflow-hidden bg-[#061A4F]">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-indigo-300">
              {siteConfig.companyName} • Company Profile
            </p>
<h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              {siteConfig.tagline}
            </h1>
            <div className="pt-4 space-y-4 text-slate-200">
              <p>TALLGATE LIMITED is a forward-thinking hybrid technology and service company dedicated to helping small and medium-sized businesses establish, strengthen, and scale their digital presence. We provide affordable, practical, and results-driven digital solutions that enable businesses to compete effectively in an increasingly digital economy.</p>
              <p>Founded on the belief that every business deserves access to modern digital tools, TALLGATE bridges the gap between traditional business operations and digital transformation. Through a combination of technology, strategic support, and skilled talent, we help businesses improve visibility, attract customers, increase sales, and achieve sustainable growth.</p>
              <p>In addition to supporting businesses, TALLGATE is committed to empowering the next generation of professionals by creating opportunities for university students and young graduates to develop valuable digital skills, gain practical experience, and participate in meaningful employment opportunities.</p>
            </div>


            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-white/10">
              <div className="flex items-start gap-2">
                <HiOutlineLocationMarker className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>{siteConfig.address.line1}, {siteConfig.address.line2}</span>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlinePhone className="w-4 h-4 text-indigo-300 shrink-0" />
                <a href={siteConfig.phone.href} className="hover:text-white transition-colors">{siteConfig.phone.display}</a>
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineMail className="w-4 h-4 text-indigo-300 shrink-0" />
                <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-white transition-colors">{siteConfig.supportEmail}</a>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. BUSINESS MODEL                                                   */}
        {/* ==================================================================== */}
        <div className="space-y-10">
          <SectionHeader
            badge="Operational Framework"
            title="Our Business Model"
            description={`${siteConfig.companyName} operates through a hybrid model that combines service delivery, technology solutions, and talent development.`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {revenueStreams.map((stream, idx) => {
              const Icon = stream.icon
              return (
                <div
                  key={idx}
                  className="card-base bg-white/[0.03] border border-white/10 hover:border-white/20 p-5 flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {stream.name}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. EXECUTIVE LEADERSHIP: ENGR. OGBONNA CHISOM                        */}
        {/* ==================================================================== */}
        <div className="site-panel rounded-2xl p-6 sm:p-12 border border-white/10 bg-[#061A4F]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* CEO Portrait */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900">
                <Image
                  src="/assets/team/chisom.png"
                  alt={`Engr. Ogbonna Chisom - Chief Executive Officer at ${siteConfig.companyName}`}
                  fill
                  className="object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* CEO Bio */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300 mb-1">
                  Executive Leadership
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Engr. OGBONNA CHISOM
                </h2>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mt-1">
                  CHIEF EXECUTIVE OFFICER
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                <p>
                  Chisom is an ambitious builder who sits at the intersection of technology, entrepreneurship, education, and healthcare. He is a computer engineer and a progress-driven IT consultant with an extensive background of over 15 years in the industry. With a long-standing record of initiative and innovation, he has developed and executed strategies that bring enduring value to every client and partner organization.
                </p>
                <p>
                  With a broad background in network administration and software development, along with several years of experience in branding, design, digital management, and marketing, Chisom has developed a strong grasp of data analytics, user behaviour, and the value of a seamless user experience. He is dedicated to creating high-performing organisations, structured training programmes, and digital solutions that generate lasting impact.
                </p>
                <p>
                  His work consistently points toward building {siteConfig.companyName} into a platform that delivers robust management systems, technology-enabled healthcare services, professional training, and mission-critical enterprise solutions.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. MEET OUR TEAM & LEADERSHIP                                        */}
        {/* ==================================================================== */}
        <div className="space-y-10">
          <SectionHeader
            badge="Leadership & Culture"
            title="Our Dedicated Team"
            description="We deliver IT excellence rooted in integrity, transparency, and client satisfaction. Supported by an experienced and engaging leadership team, TallGate is uniquely positioned to build and nurture enduring client partnerships."
          />

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {leadershipTeam.map((member, idx) => (
              <div
                key={idx}
                className="card-base bg-white/[0.03] border border-white/10 hover:border-white/20 p-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      fill
                      className="object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-300 mt-0.5">
                      {member.role}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Team Culture */}
          <div className="site-panel rounded-2xl p-6 sm:p-10 border border-white/10 bg-[#061A4F]">
            <div className="max-w-3xl space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Culture of Dedication &amp; Global Best Practices
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                At TallGate, our team possesses an abiding dedication to IT excellence and global best practices, a sincere commitment to making our clients happy, and a genuine respect for transparency and integrity. In addition to this, TallGate management is made up of engaging and experienced personalities who are easily able to build long-term relationships with both current and prospective clients.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 4. VISION, MISSION & CORE VALUES                                   */}
        {/* ==================================================================== */}
        <div className="space-y-10">
          <SectionHeader
            title="Vision, Mission & Core Values"
            description="Guiding our commitment to empowering businesses and individuals."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Vision</h3>
              <p className="text-sm text-slate-200 leading-relaxed">&quot;To become Africa&apos;s leading digital enablement company, empowering businesses and individuals through technology, innovation, and opportunity.&quot;</p>
            </div>
            <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-3">
              <h3 className="text-lg font-bold text-white">Mission</h3>
              <p className="text-sm text-slate-200 leading-relaxed">&quot;To simplify digital transformation for small businesses by providing accessible, affordable, and innovative solutions that drive growth, efficiency, and long-term success.&quot;</p>
            </div>
          </div>
          <div className="card-base bg-white/[0.03] border border-white/10 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Core Values</h3>
            <ol className="space-y-2 text-sm text-slate-200">
              <li><strong>Innovation</strong> — We continuously explore new technologies and creative approaches to solve business challenges.</li>
              <li><strong>Excellence</strong> — We are committed to delivering high-quality services and measurable results.</li>
              <li><strong>Integrity</strong> — We build trust through transparency, professionalism, and ethical business practices.</li>
              <li><strong>Empowerment</strong> — We create opportunities for businesses, students, and communities to grow and thrive.</li>
              <li><strong>Customer Success</strong> — Our clients&apos; success is the foundation of our success.</li>
              <li><strong>Collaboration</strong> — We believe that strong partnerships drive sustainable growth and innovation.</li>
            </ol>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. COMPANY PROFILE DOCUMENT                                          */}
        {/* ==================================================================== */}
        <div className="space-y-8">
          <SectionHeader
            badge="Source Material"
            title="Company Profile Document"
            description="The full company profile as issued by our leadership, reproduced page by page."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profileDocumentPages.map((page) => (
              <figure
                key={page.file}
                className="card-base bg-white/[0.03] border border-white/10 overflow-hidden flex flex-col"
              >
                <div className="relative w-full aspect-[3/4] bg-slate-900">
                  <Image
                    src={`/assets/company-profile/${page.file}`}
                    alt={`${siteConfig.companyName} company profile - ${page.title}`}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-300 border-t border-white/10">
                  <HiOutlineDocumentText className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span>{page.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 6. CALL TO ACTION                                                   */}
        {/* ==================================================================== */}
        <div className="text-center space-y-6 pt-6 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to Build With TallGate?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Whether you need custom software, cloud engineering, or an accelerated technical training path for your team, we are ready to partner with you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/consultation" className="btn-primary text-xs px-6 py-3">
              Schedule Consultation
            </Link>
            <Link href="/contact" className="btn-secondary text-xs px-6 py-3">
              Contact Our Abuja Office
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
