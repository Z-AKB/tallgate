export interface ProjectCaseStudy {
  slug: string
  title: string
  clientIndustry: string
  summary: string
  challenge: string
  solution: string
  impact: string[]
  technologies: string[]
  completionYear: string
}

export const portfolioData: ProjectCaseStudy[] = [
  {
    slug: 'apex-logistics-fleet-engine',
    title: 'Real-time Fleet Telemetry & Dispatch System',
    clientIndustry: 'Logistics & Supply Chain (Lagos & Abuja)',
    summary: 'Architected an automated dispatch, driver tracking, and route-optimization system for urban deliveries.',
    challenge: 'The client struggled with manual WhatsApp dispatching, delayed trip updates, fuel leakage, and limited real-time visibility across its delivery fleet.',
    solution: 'Designed and deployed a resilient Next.js web operations portal paired with a lightweight React Native driver mobile app featuring offline sync, geolocation tracking, and automated customer SMS alerts.',
    impact: [
      'Improved visibility into delivery turnaround times',
      'Reduced reliance on manual dispatch paperwork',
      'Real-time automated proof-of-delivery with digital signature and photo upload'
    ],
    technologies: ['Next.js', 'React Native', 'Node.js', 'PostgreSQL', 'Redis', 'WebSockets', 'AWS'],
    completionYear: '2024'
  },
  {
    slug: 'medivault-clinic-management',
    title: 'Cloud Clinic EMR & Patient Booking Portal',
    clientIndustry: 'Healthcare & Private Clinics',
    summary: 'Engineered a secure, NDPR-compliant Electronic Medical Record (EMR) and appointment booking platform for multi-specialist clinics.',
    challenge: 'Paper-based patient folders caused long waiting room queues, lost consultation histories, and uncoordinated billing across laboratory and pharmacy desks.',
    solution: 'Built an encrypted, role-based web application with strict audit logging, automated appointment reminders, prescription management, and integrated POS/card payments.',
    impact: [
      'Streamlined patient check-in workflows',
      'Centralized patient records and audit trails',
      'Designed with NDPR requirements in mind'
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'Paystack'],
    completionYear: '2024'
  },
  {
    slug: 'edutrack-school-portal',
    title: 'Integrated Student Information & Results Portal',
    clientIndustry: 'Education (Primary & Secondary Institutions)',
    summary: 'Developed an automated grade computation, report sheet generator, and tuition payment portal for educational institutions.',
    challenge: 'Teachers spent substantial time each term manually calculating grades, rankings, and paper report cards prone to arithmetic errors.',
    solution: 'Engineered an intuitive portal allowing teachers to input scores with automated GPA calculation, broadsheet generation, PDF report card dispatch to parents, and online school fees payment.',
    impact: [
      'Streamlined term-end report processing',
      'Automated parent fee payment verification and digital receipting',
      'Supported multi-campus student record management'
    ],
    technologies: ['Next.js', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'PDFKit'],
    completionYear: '2023'
  }
]
