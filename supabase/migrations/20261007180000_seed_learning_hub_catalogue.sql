-- Seed the Learning Hub catalogue.
--
-- The public catalogue in lib/data/courses.ts is the authored source of truth,
-- and 20261007140000_course_categories.sql already mirrors its domains into
-- course_categories. The admin content tools
-- (app/(admin)/admin/course-content) additionally read courses, course_modules,
-- and lessons straight from the database: with those tables empty, every
-- course/lesson picker and every upload control is disabled and the page shows
-- no explanation. Seed the same six packages, their module, and one lesson per
-- syllabus topic so the content tools have targets.
--
-- Idempotent: courses conflict on their unique slug, and modules/lessons are
-- only inserted when an equivalent row does not already exist.

insert into public.courses (
  slug,
  title,
  category,
  level,
  price_ngn,
  duration,
  short_description,
  overview,
  learning_outcomes,
  prerequisites,
  is_popular,
  is_published,
  display_order
)
values
  (
    'appreciation-package',
    'Appreciation Package',
    'Foundation',
    'Beginner',
    15000,
    '4 Weeks',
    'A practical introduction to essential computer use, digital literacy, communication, and desktop tools.',
    'Build confidence with everyday computer use and the digital skills needed for study, work, and communication.',
    '["Computer Basic", "Digital Literacy", "Data Communication", "Desktop Applications", "Desktop Publishing"]'::jsonb,
    'No prior computer experience required.',
    false,
    true,
    0
  ),
  (
    'advanced-package',
    'Advanced Package',
    'Professional',
    'Intermediate',
    35000,
    '8 Weeks',
    'Advance from core computing into desktop publishing, software security, networking, and graphic design.',
    'Develop a broader, practical technology foundation across software, security, networking, and visual design.',
    '["Computer Basic", "Digital Literacy", "Desktop Publishing", "Software & Security", "Computer Networking", "Graphic Design"]'::jsonb,
    'Basic computer familiarity is helpful.',
    true,
    true,
    1
  ),
  (
    'digital-package',
    'Digital Package',
    'Digital Skills',
    'All Levels',
    35000,
    '6 Weeks',
    'Build digital, creative, and online communication skills for a modern workplace or business.',
    'Learn the essential digital skills used to create, communicate, market, and manage an online presence.',
    '["Computer Basic", "Digital Literacy", "Graphic Design", "Digital Marketing", "Social Media Management"]'::jsonb,
    'No prior experience required.',
    false,
    true,
    2
  ),
  (
    'security-package',
    'Security Package',
    'Security',
    'Intermediate',
    35000,
    '2 Months',
    'Develop foundational security knowledge alongside computer networking, network management, and data analytics.',
    'Build a practical foundation for secure computing and network-focused technology work.',
    '["Computer Basic", "Digital Literacy", "Software & Security", "Cyber Security", "Computer Networking", "Networks Management", "Data Analytics"]'::jsonb,
    'Basic computer familiarity is helpful.',
    false,
    true,
    3
  ),
  (
    'developer-package',
    'Developer Package',
    'Development',
    'Intermediate',
    55000,
    '3 Months',
    'Start your developer journey with web development, hosting, programming, and a project portfolio.',
    'Build a solid foundation in web development and programming, then present your work in a project portfolio.',
    '["Computer Basic", "Digital Literacy", "Web Development", "Domain & Hosting", "Programming / Coding", "Project Portfolio Setup"]'::jsonb,
    'No programming experience required.',
    true,
    true,
    4
  ),
  (
    'digital-health-package',
    'Digital Health Package',
    'Health Technology',
    'All Levels',
    35000,
    '6 Weeks',
    'Explore the digital tools, operations, and records systems shaping modern healthcare delivery.',
    'Learn the foundations of digital healthcare, telehealth, telemedicine operations, and electronic health records.',
    '["Digital Literacy", "Intro to Telehealth", "Telemedicine Operations", "Digital Healthcare Systems", "EMR/EHR Fundamentals"]'::jsonb,
    'No prior health-technology experience required.',
    false,
    true,
    5
  )
on conflict (slug) do nothing;

insert into public.course_modules (course_id, title, order_index)
select courses.id, 'Package Curriculum', 0
from public.courses
where courses.slug in (
  'appreciation-package',
  'advanced-package',
  'digital-package',
  'security-package',
  'developer-package',
  'digital-health-package'
)
and not exists (
  select 1
  from public.course_modules
  where course_modules.course_id = courses.id
    and course_modules.title = 'Package Curriculum'
);

with seed(slug, title, order_index) as (
  values
    ('appreciation-package', 'Computer Basic', 0),
    ('appreciation-package', 'Digital Literacy', 1),
    ('appreciation-package', 'Data Communication', 2),
    ('appreciation-package', 'Desktop Applications', 3),
    ('appreciation-package', 'Desktop Publishing', 4),
    ('advanced-package', 'Computer Basic', 0),
    ('advanced-package', 'Digital Literacy', 1),
    ('advanced-package', 'Desktop Publishing', 2),
    ('advanced-package', 'Software & Security', 3),
    ('advanced-package', 'Computer Networking', 4),
    ('advanced-package', 'Graphic Design', 5),
    ('digital-package', 'Computer Basic', 0),
    ('digital-package', 'Digital Literacy', 1),
    ('digital-package', 'Graphic Design', 2),
    ('digital-package', 'Digital Marketing', 3),
    ('digital-package', 'Social Media Management', 4),
    ('security-package', 'Computer Basic', 0),
    ('security-package', 'Digital Literacy', 1),
    ('security-package', 'Software & Security', 2),
    ('security-package', 'Cyber Security', 3),
    ('security-package', 'Computer Networking', 4),
    ('security-package', 'Networks Management', 5),
    ('security-package', 'Data Analytics', 6),
    ('developer-package', 'Computer Basic', 0),
    ('developer-package', 'Digital Literacy', 1),
    ('developer-package', 'Web Development', 2),
    ('developer-package', 'Domain & Hosting', 3),
    ('developer-package', 'Programming / Coding', 4),
    ('developer-package', 'Project Portfolio Setup', 5),
    ('digital-health-package', 'Digital Literacy', 0),
    ('digital-health-package', 'Intro to Telehealth', 1),
    ('digital-health-package', 'Telemedicine Operations', 2),
    ('digital-health-package', 'Digital Healthcare Systems', 3),
    ('digital-health-package', 'EMR/EHR Fundamentals', 4)
)
insert into public.lessons (module_id, title, content_type, order_index, is_preview)
select modules.id, seed.title, 'text', seed.order_index, false
from seed
join public.courses on courses.slug = seed.slug
join public.course_modules as modules
  on modules.course_id = courses.id
  and modules.title = 'Package Curriculum'
where not exists (
  select 1
  from public.lessons
  where lessons.module_id = modules.id
    and lessons.title = seed.title
);
