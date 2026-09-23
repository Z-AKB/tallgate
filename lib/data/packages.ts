export interface TrainingPackage {
  id: string
  title: string
  monthlyPriceNgn: number
  totalDuration: string
  popular: boolean
  tagline: string
  targetCareer: string
  features: string[]
}

export const packagesData: TrainingPackage[] = [
  {
    id: 'basic-appreciation-package',
    title: 'Basic Appreciation Package',
    monthlyPriceNgn: 50000,
    totalDuration: '1 Month',
    popular: false,
    tagline: 'Ideal for beginners seeking essential computer confidence.',
    targetCareer: 'Office Administrator, Data Entry Specialist',
    features: [
      'Computer Hardware & OS Navigation',
      'Microsoft Office (Word, Excel, PowerPoint)',
      'Digital Literacy & Cloud Storage',
      'Safe Web Navigation & Email Etiquette',
      'Certificate of Completion upon practical assessment'
    ]
  },
  {
    id: 'advanced-computing-package',
    title: 'Advanced Computing Package',
    monthlyPriceNgn: 100000,
    totalDuration: '3 Months',
    popular: true,
    tagline: 'Comprehensive bridge from fundamentals to professional IT skills.',
    targetCareer: 'IT Support Analyst, Junior Systems Administrator',
    features: [
      'Advanced Operating Systems & Software Security',
      'Computer Networking & LAN Setup',
      'Desktop Publishing & Graphic Fundamentals',
      'Data Communication & Troubleshooting',
      'Hands-on physical lab projects & mentorship'
    ]
  },
  {
    id: 'cyber-security-package',
    title: 'Cybersecurity Analyst Package',
    monthlyPriceNgn: 120000,
    totalDuration: '3 Months',
    popular: false,
    tagline: 'Intensive defensive security and ethical penetration testing.',
    targetCareer: 'Junior SOC Analyst, Security Administrator',
    features: [
      'Network Security & Deep Packet Inspection (Wireshark)',
      'Web Application Vulnerability Assessment (OWASP Top 10)',
      'Kali Linux, Port Scanning & Firewalls',
      'NDPR Compliance & Data Security Policies',
      'Industry Certification Preparation & Capstone Project'
    ]
  },
  {
    id: 'web-engineering-package',
    title: 'Software Engineering Career Track',
    monthlyPriceNgn: 150000,
    totalDuration: '3 Months',
    popular: true,
    tagline: 'Full-stack web application development for high-growth tech careers.',
    targetCareer: 'Full Stack Web Developer, Frontend/Backend Engineer',
    features: [
      'Modern TypeScript, React 18 & Next.js 14 App Router',
      'PostgreSQL Database Architecture & Supabase RLS',
      'REST & GraphQL APIs, Authentication & Payment Gateways',
      'Docker, CI/CD Pipelines & Production Cloud Deployments',
      'Live Capstone SaaS project, Portfolio & Tech Interview Prep'
    ]
  }
]
