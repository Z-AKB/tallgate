import type { Database } from "@/types/supabase"
import type {
  MockConsultation,
  MockStartup,
  MockCourse,
  MockEnrollment,
  MockCertificate,
  MockMessage,
} from "@/lib/data/adminMockData"

type Tables = Database["public"]["Tables"]
type ConsultationRow = Tables["consultation_requests"]["Row"]
type StartupRow = Tables["startup_applications"]["Row"]
type CourseRow = Tables["courses"]["Row"]
type CertificateRow = Tables["certificates"]["Row"]
type MessageRow = Tables["contact_messages"]["Row"]

export type EnrollmentWithCourse = Tables["course_enrollments"]["Row"] & {
  profiles: Pick<Tables["profiles"]["Row"], "full_name" | "email"> | null
  courses: Pick<Tables["courses"]["Row"], "title"> | null
}

export function toConsultation(row: ConsultationRow): MockConsultation {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company_name: row.company_name,
    service_interest: row.service_interest,
    project_scope: row.project_scope,
    budget_range: row.budget_range,
    timeline: row.timeline,
    status: row.status,
    admin_notes: row.admin_notes ?? undefined,
    created_at: row.created_at,
  }
}

export function toStartup(row: StartupRow): MockStartup {
  return {
    id: row.id,
    company_name: row.company_name,
    founder_name: row.founder_name,
    email: row.email,
    phone: row.phone,
    industry: row.industry,
    stage: row.stage,
    problem_statement: row.problem_statement,
    solution_description: row.solution_description,
    pitch_deck_url: row.pitch_deck_url ?? undefined,
    support_needed: Array.isArray(row.support_needed)
      ? row.support_needed.filter((entry): entry is string => typeof entry === "string")
      : [],
    status: row.status,
    created_at: row.created_at,
  }
}

export function toCourse(row: CourseRow): MockCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    level: row.level,
    price_ngn: row.price_ngn,
    duration: row.duration,
    short_description: row.short_description,
    is_popular: row.is_popular,
    is_published: row.is_published,
    enrollment_count: 0,
    created_at: row.created_at,
  }
}

export function toCertificate(row: CertificateRow): MockCertificate {
  return {
    id: row.id,
    verification_code: row.verification_code,
    recipient_name: row.recipient_name,
    course_title: row.course_title,
    issue_date: row.issue_date,
    grade: row.grade ?? "N/A",
    is_valid: row.is_valid,
    created_at: row.created_at,
  }
}

export function toMessage(row: MessageRow): MockMessage {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    subject: row.subject,
    message: row.message,
    status: row.status,
    created_at: row.created_at,
  }
}

export function toEnrollment(
  item: EnrollmentWithCourse,
  fallbackName: string,
  fallbackTitle: string
): MockEnrollment {
  return {
    id: item.id,
    user_name: item.profiles?.full_name || fallbackName,
    user_email: item.profiles?.email || "student@tallgate.com",
    course_title: item.courses?.title || fallbackTitle,
    status: item.status,
    progress_percent: item.progress_percent || 0,
    enrolled_at: item.enrolled_at,
    completed_at: item.completed_at ?? undefined,
  }
}
