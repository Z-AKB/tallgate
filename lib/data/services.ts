export interface ServiceOffering {
  slug: string
  title: string
  shortDescription: string
  fullDescription: string
  category: string
  icon: string
  deliverables: string[]
  targetAudience: string
  technologies: string[]
  keyBenefits: string[]
}

export const servicesData: ServiceOffering[] = [
  {
    slug: 'custom-software-development',
    title: 'Custom Software Development',
    category: 'Engineering',
    icon: 'CodeBracketIcon',
    shortDescription: 'Bespoke enterprise applications, scalable APIs, and mission-critical software built for high-growth businesses.',
    fullDescription: 'We design, architect, and build resilient, production-ready software tailored to your exact operational workflows. From modular SaaS platforms to high-throughput backend services, our engineering practices follow strict clean architecture and automated CI/CD pipelines.',
    targetAudience: 'Startups, SMEs, Financial Institutions, and Enterprise Organizations',
    technologies: ['Next.js', 'React', 'Node.js', 'Go', 'Python', 'PostgreSQL', 'Docker', 'Kubernetes'],
    deliverables: [
      'Requirements analysis & architectural blueprints',
      'Scalable microservices or modular monolith backend',
      'Clean, accessible web application frontend',
      'Automated testing suites (Unit, Integration, E2E)',
      'Production deployment with automated CI/CD',
      'Full source code ownership & comprehensive technical documentation'
    ],
    keyBenefits: [
      'Eliminate software licensing fees with owned IP',
      'Scale effortlessly as transaction volumes grow',
      'Bank-grade security and robust error recovery'
    ]
  },
  {
    slug: 'web-mobile-engineering',
    title: 'Web & Mobile Engineering',
    category: 'Engineering',
    icon: 'DevicePhoneMobileIcon',
    shortDescription: 'High-performance cross-platform mobile apps and responsive web platforms optimized for the African market.',
    fullDescription: 'Create engaging digital experiences with lightning-fast mobile and web applications designed for low-latency, bandwidth-conscious environments across Nigeria and West Africa.',
    targetAudience: 'Fintechs, Logistics Companies, E-commerce Brands, Healthcare Providers',
    technologies: ['React Native', 'Flutter', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL'],
    deliverables: [
      'Cross-platform iOS and Android mobile apps',
      'Progressive Web Apps (PWAs) with offline sync support',
      'Optimized API integration and state management',
      'App Store and Google Play publishing and compliance',
      'Post-launch performance monitoring and analytics integration'
    ],
    keyBenefits: [
      'Reach mobile users on Android and iOS with a single codebase',
      'Performance-conscious page loads for constrained network connections',
      'Native push notifications and offline caching'
    ]
  },
  {
    slug: 'cloud-devops-infrastructure',
    title: 'Cloud & DevOps Infrastructure',
    category: 'Infrastructure',
    icon: 'CloudArrowUpIcon',
    shortDescription: 'Secure cloud migrations, automated infrastructure-as-code, and resilient architecture on AWS, GCP & Azure.',
    fullDescription: 'Modernize your infrastructure with robust cloud engineering. We eliminate single points of failure, optimize cloud spending, and automate delivery pipelines to let your team ship faster with confidence.',
    targetAudience: 'Tech Companies, Scaling Startups, Medium-to-Large Enterprises',
    technologies: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Terraform', 'Docker', 'Kubernetes', 'GitHub Actions'],
    deliverables: [
      'Cloud infrastructure audit and cost-optimization plan',
      'Infrastructure as Code (Terraform / Pulumi)',
      'Automated CI/CD pipelines for staging and production',
      'High-availability database clustering and automated backups',
      '24/7 logging, metrics, and alerting setup (Prometheus/Grafana/Sentry)'
    ],
    keyBenefits: [
      'Identify opportunities to optimize cloud spending',
      'Reduce manual server updates and deployment risk',
      'Achieve enterprise-grade business continuity and disaster recovery'
    ]
  },
  {
    slug: 'cybersecurity-compliance',
    title: 'Cybersecurity & Compliance',
    category: 'Security',
    icon: 'ShieldCheckIcon',
    shortDescription: 'Vulnerability assessments, penetration testing, NDPR compliance, and threat mitigation for digital assets.',
    fullDescription: 'Safeguard your applications, customer data, and network perimeter from malicious actors. We conduct deep security audits, provide NDPR/GDPR compliance guidance, and implement enterprise-grade zero-trust architectures.',
    targetAudience: 'Fintechs, Edtechs, Corporate Businesses, Government Contractors',
    technologies: ['OWASP ZAP', 'Burp Suite', 'Wireshark', 'Kali Linux', 'Cloudflare', 'SIEM Tools'],
    deliverables: [
      'Comprehensive Web & Mobile Application Penetration Testing',
      'Network vulnerability scanning and remediation roadmap',
      'Nigeria Data Protection Regulation (NDPR) compliance assessment',
      'Security policy formulation and employee awareness training',
      'Incident response and digital forensics support'
    ],
    keyBenefits: [
      'Protect brand reputation and customer trust against breaches',
      'Pass regulatory audits and fintech compliance requirements',
      'Immediate mitigation of high-risk vulnerabilities'
    ]
  },
  {
    slug: 'ai-business-automation',
    title: 'AI & Business Automation',
    category: 'AI & Data',
    icon: 'CpuChipIcon',
    shortDescription: 'Custom LLM integrations, intelligent workflow automation, and predictive data systems for more efficient operations.',
    fullDescription: 'Harness practical Artificial Intelligence and intelligent robotic process automation (RPA) to automate repetitive administrative tasks, customer communications, document processing, and data analytics.',
    targetAudience: 'Operations Teams, Customer Support Centers, Logistics, Startups',
    technologies: ['OpenAI API', 'LangChain', 'Python', 'FastAPI', 'Make / n8n', 'PostgreSQL pgvector'],
    deliverables: [
      'Custom AI assistant trained on your proprietary company data',
      'Automated document extraction and invoice processing',
      'CRM and ERP workflow integrations',
      'Predictive analytics dashboards for revenue and operations',
      'Team training and AI governance protocols'
    ],
    keyBenefits: [
      'Reduce time spent on repetitive tasks',
      'Automated customer inquiry handling tailored to your domain',
      'Data-driven decision making with real-time business telemetry'
    ]
  },
  {
    slug: 'technical-consulting-advisory',
    title: 'Technical Advisory & Architecture',
    category: 'Consulting',
    icon: 'BriefcaseIcon',
    shortDescription: 'Fractional CTO services, software architecture review, tech team vetting, and strategic technology roadmaps.',
    fullDescription: 'Get senior technology leadership without the overhead of a full-time executive. We guide founders and business leaders on software architecture, technology selection, team hiring, and vendor evaluation.',
    targetAudience: 'Non-technical Founders, Executive Boards, Investors, Growing Startups',
    technologies: ['Architecture Blueprints', 'Tech Due Diligence', 'System Design', 'Agile Governance'],
    deliverables: [
      'Comprehensive System Architecture Reviews',
      'Technical Due Diligence reports for investors and acquisitions',
      'Vendor code audits and milestone verification',
      'Fractional CTO guidance and bi-weekly strategic reviews',
      'Developer hiring and technical interview panels'
    ],
    keyBenefits: [
      'Avoid costly architectural mistakes and tech debt early',
      'Make informed technology investments backed by senior engineers',
      'Accelerate product development velocity with proven engineering standards'
    ]
  }
]
