/**
 * Static seed data for the Services catalogue. Matches Phase 3's `services`
 * table shape (title, slug, description, category) so this can be swapped
 * for a Supabase query with no component changes once the table is
 * populated in the admin panel.
 */
export interface Service {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
}

export const services: Service[] = [
  {
    slug: "software-development",
    title: "Software Development",
    category: "Development",
    summary: "Custom software built around how your business actually operates.",
    description:
      "We design and build custom software — internal tools, customer-facing platforms, and systems that connect to what you already use. Every engagement starts with a scoping conversation, not a generic package.",
  },
  {
    slug: "web-development",
    title: "Web Development",
    category: "Development",
    summary: "Fast, accessible websites and web applications.",
    description:
      "From marketing sites to full web applications, we build on modern frameworks with performance and accessibility as defaults, not afterthoughts — important on the mid-tier Android, 4G connections common across the region.",
  },
  {
    slug: "mobile-development",
    title: "Mobile Development",
    category: "Development",
    summary: "iOS and Android apps for customers and internal teams.",
    description:
      "Native and cross-platform mobile apps, built to match how your users actually use their phones — offline-tolerant, data-conscious, and tested on the devices your market runs.",
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    category: "Design",
    summary: "Interfaces designed for clarity, not decoration.",
    description:
      "Research-informed interface design for web and mobile products — wireframes, prototypes, and design systems that hold up as your product grows past its first release.",
  },
  {
    slug: "cloud-solutions",
    title: "Cloud Solutions",
    category: "Infrastructure",
    summary: "Cloud infrastructure sized to your business, not oversized.",
    description:
      "Architecture, migration, and ongoing management of cloud infrastructure — right-sized for where your business is today, with a clear path to scale rather than premature complexity.",
  },
  {
    slug: "networking",
    title: "Networking",
    category: "Infrastructure",
    summary: "Reliable network infrastructure for offices and facilities.",
    description:
      "Design, setup, and support for business networking — wired and wireless infrastructure, VPNs, and the unglamorous reliability work that keeps a business connected.",
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    category: "Security",
    summary: "Practical security for businesses that aren't security companies.",
    description:
      "Security assessments, hardening, and incident response scoped to how a small-to-mid-size business actually operates — not enterprise theatre you'll never use.",
  },
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    category: "Emerging Tech",
    summary: "Applied AI features, not AI for its own sake.",
    description:
      "Integrating AI capabilities — automation, search, classification, generation — into real products and workflows, evaluated on whether they solve an actual business problem.",
  },
  {
    slug: "blockchain",
    title: "Blockchain",
    category: "Emerging Tech",
    summary: "Blockchain development where it's genuinely the right tool.",
    description:
      "Smart contract and blockchain-backed application development for the specific cases where decentralization or verifiability is the actual requirement, not the pitch.",
  },
  {
    slug: "business-automation",
    title: "Business Automation",
    category: "Operations",
    summary: "Removing manual, repetitive work from your operations.",
    description:
      "Workflow automation across the tools you already run — reducing manual data entry, repetitive approvals, and the operational drag that caps how much a small team can handle.",
  },
  {
    slug: "digital-transformation",
    title: "Digital Transformation",
    category: "Operations",
    summary: "Moving paper-and-spreadsheet processes onto real systems.",
    description:
      "A structured path from manual, disconnected processes to integrated digital systems — sequenced so the business keeps running while the transition happens.",
  },
  {
    slug: "technical-consulting",
    title: "Technical Consulting",
    category: "Advisory",
    summary: "An outside technical opinion before you commit budget.",
    description:
      "Architecture reviews, technology selection, and technical due diligence — useful before a large build, a hire, or a vendor decision you don't want to get wrong.",
  },
  {
    slug: "training",
    title: "Training",
    category: "Advisory",
    summary: "Practical technical training for teams, not just individuals.",
    description:
      "Structured training engagements for teams adopting a new tool, platform, or practice — distinct from Learning Hub's self-paced courses, this is delivered directly to your organization.",
  },
];

export function getServiceBySlug(slug: string) {
  return services.find((s) => s.slug === slug);
}
