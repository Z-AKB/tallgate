export interface CourseOffering {
  slug: string
  title: string
  category: 'Foundation' | 'Professional' | 'Digital Skills' | 'Security' | 'Development' | 'Health Technology'
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
  priceNgn: number
  duration: string
  format: 'Online Training'
  shortDescription: string
  overview: string
  learningOutcomes: string[]
  prerequisites: string
  syllabus: {
    moduleTitle: string
    topics: string[]
  }[]
  isPopular?: boolean
}

const onlineFormat = 'Online Training' as const

export const coursesData: CourseOffering[] = [
  {
    slug: 'appreciation-package',
    title: 'Appreciation Package',
    category: 'Foundation',
    level: 'Beginner',
    priceNgn: 15000,
    duration: '4 Weeks',
    format: onlineFormat,
    shortDescription: 'A practical introduction to essential computer use, digital literacy, communication, and desktop tools.',
    overview: 'Build confidence with everyday computer use and the digital skills needed for study, work, and communication.',
    learningOutcomes: ['Computer Basic', 'Digital Literacy', 'Data Communication', 'Desktop Applications', 'Desktop Publishing'],
    prerequisites: 'No prior computer experience required.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Computer Basic', 'Digital Literacy', 'Data Communication', 'Desktop Applications', 'Desktop Publishing'] }],
  },
  {
    slug: 'advanced-package',
    title: 'Advanced Package',
    category: 'Professional',
    level: 'Intermediate',
    priceNgn: 35000,
    duration: '8 Weeks',
    format: onlineFormat,
    isPopular: true,
    shortDescription: 'Advance from core computing into desktop publishing, software security, networking, and graphic design.',
    overview: 'Develop a broader, practical technology foundation across software, security, networking, and visual design.',
    learningOutcomes: ['Computer Basic', 'Digital Literacy', 'Desktop Publishing', 'Software & Security', 'Computer Networking', 'Graphic Design'],
    prerequisites: 'Basic computer familiarity is helpful.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Computer Basic', 'Digital Literacy', 'Desktop Publishing', 'Software & Security', 'Computer Networking', 'Graphic Design'] }],
  },
  {
    slug: 'digital-package',
    title: 'Digital Package',
    category: 'Digital Skills',
    level: 'All Levels',
    priceNgn: 35000,
    duration: '6 Weeks',
    format: onlineFormat,
    shortDescription: 'Build digital, creative, and online communication skills for a modern workplace or business.',
    overview: 'Learn the essential digital skills used to create, communicate, market, and manage an online presence.',
    learningOutcomes: ['Computer Basic', 'Digital Literacy', 'Graphic Design', 'Digital Marketing', 'Social Media Management'],
    prerequisites: 'No prior experience required.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Computer Basic', 'Digital Literacy', 'Graphic Design', 'Digital Marketing', 'Social Media Management'] }],
  },
  {
    slug: 'security-package',
    title: 'Security Package',
    category: 'Security',
    level: 'Intermediate',
    priceNgn: 35000,
    duration: '2 Months',
    format: onlineFormat,
    shortDescription: 'Develop foundational security knowledge alongside computer networking, network management, and data analytics.',
    overview: 'Build a practical foundation for secure computing and network-focused technology work.',
    learningOutcomes: ['Computer Basic', 'Digital Literacy', 'Software & Security', 'Cyber Security', 'Computer Networking', 'Networks Management', 'Data Analytics'],
    prerequisites: 'Basic computer familiarity is helpful.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Computer Basic', 'Digital Literacy', 'Software & Security', 'Cyber Security', 'Computer Networking', 'Networks Management', 'Data Analytics'] }],
  },
  {
    slug: 'developer-package',
    title: 'Developer Package',
    category: 'Development',
    level: 'Intermediate',
    priceNgn: 55000,
    duration: '3 Months',
    format: onlineFormat,
    isPopular: true,
    shortDescription: 'Start your developer journey with web development, hosting, programming, and a project portfolio.',
    overview: 'Build a solid foundation in web development and programming, then present your work in a project portfolio.',
    learningOutcomes: ['Computer Basic', 'Digital Literacy', 'Web Development', 'Domain & Hosting', 'Programming / Coding', 'Project Portfolio Setup'],
    prerequisites: 'No programming experience required.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Computer Basic', 'Digital Literacy', 'Web Development', 'Domain & Hosting', 'Programming / Coding', 'Project Portfolio Setup'] }],
  },
  {
    slug: 'digital-health-package',
    title: 'Digital Health Package',
    category: 'Health Technology',
    level: 'All Levels',
    priceNgn: 35000,
    duration: '6 Weeks',
    format: onlineFormat,
    shortDescription: 'Explore the digital tools, operations, and records systems shaping modern healthcare delivery.',
    overview: 'Learn the foundations of digital healthcare, telehealth, telemedicine operations, and electronic health records.',
    learningOutcomes: ['Digital Literacy', 'Intro to Telehealth', 'Telemedicine Operations', 'Digital Healthcare Systems', 'EMR/EHR Fundamentals'],
    prerequisites: 'No prior health-technology experience required.',
    syllabus: [{ moduleTitle: 'Package Curriculum', topics: ['Digital Literacy', 'Intro to Telehealth', 'Telemedicine Operations', 'Digital Healthcare Systems', 'EMR/EHR Fundamentals'] }],
  },
]
