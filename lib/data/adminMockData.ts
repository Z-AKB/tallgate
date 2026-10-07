export interface MockConsultation {
  id: string
  full_name: string
  email: string
  phone: string
  company_name: string | null
  service_interest: string
  project_scope: string
  budget_range: string
  timeline: string
  status: "pending" | "contacted" | "in_progress" | "closed"
  admin_notes?: string
  created_at: string
}

export interface MockStartup {
  id: string
  company_name: string
  founder_name: string
  email: string
  phone: string
  industry: string
  stage: "idea" | "prototype" | "mvp" | "early_revenue" | "scaling"
  problem_statement: string
  solution_description: string
  pitch_deck_url?: string
  support_needed: string[]
  status: "submitted" | "under_review" | "accepted" | "waitlisted" | "declined"
  created_at: string
}

export interface MockCourse {
  id: string
  slug: string
  title: string
  category: string
  level: string
  price_ngn: number
  duration: string
  short_description: string
  is_popular: boolean
  is_published: boolean
  enrollment_count: number
  created_at: string
}

export interface MockEnrollment {
  id: string
  user_name: string
  user_email: string
  course_title: string
  status: "active" | "completed" | "dropped"
  progress_percent: number
  enrolled_at: string
  completed_at?: string
}

export interface MockMessage {
  id: string
  full_name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "unread" | "read" | "responded" | "archived"
  created_at: string
}

export const mockConsultations: MockConsultation[] = [
  {
    id: "c-101",
    full_name: "Chukwudi Nwachukwu",
    email: "c.nwachukwu@zenithfintech.ng",
    phone: "+234 803 456 7890",
    company_name: "Zenith Core Financial",
    service_interest: "Cloud Infrastructure Modernization",
    project_scope: "Migrating legacy core banking ledger onto sovereign hybrid multi-cloud AWS/Local DC infrastructure with zero downtime and strict NDPR compliance.",
    budget_range: "₦15,000,000 - ₦35,000,000",
    timeline: "3 - 6 Months",
    status: "pending",
    admin_notes: "Initial discovery call scheduled with Solutions Architect team.",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "c-102",
    full_name: "Folake Adeyemi",
    email: "folake@apexhealth.africa",
    phone: "+234 812 998 3321",
    company_name: "Apex Telehealth Africa",
    service_interest: "Custom Enterprise Software & Mobile",
    project_scope: "Building an offline-first patient medical record telemetry synchronization engine for regional clinics across West Africa.",
    budget_range: "₦8,000,000 - ₦15,000,000",
    timeline: "2 - 4 Months",
    status: "in_progress",
    admin_notes: "Architecture proposal sent. Awaiting CTO sign-off.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "c-103",
    full_name: "Ibrahim Danjuma",
    email: "i.danjuma@kandologistics.com",
    phone: "+234 802 111 4455",
    company_name: "Kando Freightways",
    service_interest: "AI & Automated Logistics Dispatch",
    project_scope: "Real-time dispatch optimization and fuel telemetry dashboard utilizing IoT trackers and predictive route forecasting.",
    budget_range: "₦20,000,000+",
    timeline: "6+ Months",
    status: "contacted",
    admin_notes: "Introductory email sent by lead consultant.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "c-104",
    full_name: "Amara Okonkwo",
    email: "amara@agrishare.co",
    phone: "+234 701 888 2211",
    company_name: "AgriShare Cooperative",
    service_interest: "Fintech & Payment Gateway Integration",
    project_scope: "Custom USSD + Web automated payment split settlement system for smallholder farming clusters.",
    budget_range: "₦5,000,000 - ₦8,000,000",
    timeline: "1 - 2 Months",
    status: "closed",
    admin_notes: "Project initiated. Handed over to delivery squad.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

export const mockStartups: MockStartup[] = [
  {
    id: "s-201",
    company_name: "PayOrbit Africa",
    founder_name: "Tariq Bello",
    email: "tariq@payorbit.co",
    phone: "+234 816 777 0012",
    industry: "Fintech / Cross-Border Remittance",
    stage: "mvp",
    problem_statement: "Exorbitant 12%+ FX fees and 48-hour delays on SME cross-border payments across the ECOWAS trade corridor.",
    solution_description: "Stablecoin liquidity aggregation engine providing sub-second settlement at 0.5% flat FX transaction fee.",
    pitch_deck_url: "https://pitchdeck.tallgate.com/payorbit-deck-2026.pdf",
    support_needed: ["Technical Architecture", "Fundraising Mentorship", "Regulatory Scoping"],
    status: "under_review",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "s-202",
    company_name: "FarmPulse AI",
    founder_name: "Blessing Eze",
    email: "blessing@farmpulse.io",
    phone: "+234 809 333 4455",
    industry: "AgriTech / Satellite Remote Sensing",
    stage: "early_revenue",
    problem_statement: "Crop failure risk due to unmonitored pest outbreaks and lack of micro-weather data for cassava farms.",
    solution_description: "Drone + Sentinel satellite imagery analysis detecting blight 14 days before visible eye detection with localized SMS advice.",
    pitch_deck_url: "https://pitchdeck.tallgate.com/farmpulse-deck.pdf",
    support_needed: ["Enterprise Pilots", "Growth Strategy", "Cloud Credits"],
    status: "accepted",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "s-203",
    company_name: "QuickMed Logistics",
    founder_name: "Samuel Adeleke",
    email: "samuel@quickmed.ng",
    phone: "+234 805 444 8899",
    industry: "HealthTech / On-Demand Supply Chain",
    stage: "prototype",
    problem_statement: "Critical blood and anti-venom shortages in tier-2 hospital networks.",
    solution_description: "Cold-chain last-mile dispatch network with automated inventory monitoring.",
    support_needed: ["Go-to-Market", "Product Engineering"],
    status: "submitted",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
]

export const mockCourses: MockCourse[] = [
  {
    id: "crs-01",
    slug: "fullstack-cloud-engineering",
    title: "Full-Stack Enterprise Cloud Engineering",
    category: "Software Engineering",
    level: "Intermediate - Advanced",
    price_ngn: 250000,
    duration: "12 Weeks",
    short_description: "Master modern TypeScript, Next.js, Go microservices, Docker, Kubernetes, and AWS architecture.",
    is_popular: true,
    is_published: true,
    enrollment_count: 142,
    created_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "crs-02",
    slug: "ai-applied-machine-learning",
    title: "Applied AI & Large Language Models in Production",
    category: "Artificial Intelligence",
    level: "Intermediate",
    price_ngn: 320000,
    duration: "10 Weeks",
    short_description: "Build production RAG pipelines, fine-tune models, and deploy high-throughput AI microservices.",
    is_popular: true,
    is_published: true,
    enrollment_count: 98,
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "crs-03",
    slug: "cybersecurity-soc-analyst",
    title: "Cybersecurity Defense & Threat Intelligence",
    category: "Cybersecurity",
    level: "Beginner - Intermediate",
    price_ngn: 180000,
    duration: "8 Weeks",
    short_description: "Hands-on SIEM monitoring, threat hunting, network packet analysis, and zero-trust principles.",
    is_popular: false,
    is_published: true,
    enrollment_count: 67,
    created_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "crs-04",
    slug: "fintech-engineering-standards",
    title: "Fintech Systems & Payment Infrastructure Design",
    category: "Fintech Architecture",
    level: "Advanced",
    price_ngn: 280000,
    duration: "6 Weeks",
    short_description: "Double-entry bookkeeping engines, ISO 8583 message protocols, high-frequency settlement, and PCI-DSS.",
    is_popular: false,
    is_published: true,
    enrollment_count: 54,
    created_at: "2026-03-01T00:00:00Z",
  },
]

export const mockEnrollments: MockEnrollment[] = [
  {
    id: "enr-01",
    user_name: "Kelechi Onyema",
    user_email: "kelechi.o@gmail.com",
    course_title: "Full-Stack Enterprise Cloud Engineering",
    status: "active",
    progress_percent: 78,
    enrolled_at: "2026-08-01T10:00:00Z",
  },
  {
    id: "enr-02",
    user_name: "Amina Yusuf",
    user_email: "amina.yusuf@yahoo.com",
    course_title: "Applied AI & Large Language Models in Production",
    status: "completed",
    progress_percent: 100,
    enrolled_at: "2026-07-15T09:30:00Z",
    completed_at: "2026-09-10T16:00:00Z",
  },
  {
    id: "enr-03",
    user_name: "David Adeleke",
    user_email: "david.ad@outlook.com",
    course_title: "Cybersecurity Defense & Threat Intelligence",
    status: "active",
    progress_percent: 45,
    enrolled_at: "2026-08-20T14:15:00Z",
  },
  {
    id: "enr-04",
    user_name: "Zainab Mohammed",
    user_email: "zainab.m@gmail.com",
    course_title: "Fintech Systems & Payment Infrastructure Design",
    status: "completed",
    progress_percent: 100,
    enrolled_at: "2026-07-28T11:00:00Z",
    completed_at: "2026-09-12T14:20:00Z",
  },
]

export const mockMessages: MockMessage[] = [
  {
    id: "msg-01",
    full_name: "Dr. Raymond Okafor",
    email: "r.okafor@unilag.edu.ng",
    phone: "+234 802 888 1122",
    subject: "Academic Partnership & Student Cohort Training",
    message: "We would like to explore enrolling our final-year computer science students into TallGate's Cloud Engineering bootcamp program.",
    status: "unread",
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "msg-02",
    full_name: "Halima Garba",
    email: "halima@northbridge.com",
    phone: "+234 813 555 7788",
    subject: "Enterprise Architecture Audit Scoping",
    message: "Requesting a preliminary audit of our existing AWS Kubernetes infrastructure for security posture and cost optimization.",
    status: "read",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
]
