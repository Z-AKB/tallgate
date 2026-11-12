import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { toCertificate, type AdminCertificate } from "@/lib/data/adminRowMappers"
import { ADMIN_QUERY_LIMIT } from "@/lib/admin/queryLimits"
import CertificatesClient from "@/components/admin/CertificatesClient"
import { logError } from "@/lib/logging/logger"

export const metadata = {
  title: "Certificate Registry & Credential Issuance | TallGate Admin",
  description: "Generate and verify cryptographically verifiable graduation certificates.",
}

export type AdminCertificateCourseOption = { id: string; title: string }

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ recipient?: string; course?: string; courseId?: string }>
}) {
  const { recipient, course, courseId } = await searchParams
  const initialIssueDate = new Date().toISOString().slice(0, 10)
  let certificates: AdminCertificate[] = []
  let learners: Array<{ id: string; full_name: string; email: string }> = []
  let courses: AdminCertificateCourseOption[] = []
  let dataWarning = ""
  let loadFailed = false

  if (!isSupabaseConfigured()) {
    loadFailed = true
    dataWarning =
      "Certificate records are unavailable because Supabase is not configured."
  } else {
    try {
      const supabase = await createClient()
      const [certificatesResult, learnerRoleResult, coursesResult] = await Promise.all([
        supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(ADMIN_QUERY_LIMIT),
        supabase.from("roles").select("id").eq("name", "learner").maybeSingle(),
        supabase.from("courses").select("id, title").order("title", { ascending: true }).limit(ADMIN_QUERY_LIMIT),
      ])

      if (certificatesResult.error) {
        loadFailed = true
        logError("admin.certificate_registry_load_failed", certificatesResult.error)
        dataWarning =
          "Certificate records could not be loaded from Supabase. The list below may be incomplete."
      } else {
        certificates = (certificatesResult.data ?? []).map(toCertificate)
        if (certificates.length === ADMIN_QUERY_LIMIT) {
          dataWarning = `Showing the ${ADMIN_QUERY_LIMIT} most recent certificates. Older records are not displayed.`
        }
      }

      if (learnerRoleResult.error) {
        logError("admin.learner_role_lookup_failed", learnerRoleResult.error)
        dataWarning = `${dataWarning ? `${dataWarning} ` : ""}Learner accounts could not be loaded.`
      } else if (learnerRoleResult.data) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role_id", learnerRoleResult.data.id)

        if (assignmentsError) {
          logError("admin.learner_role_assignments_load_failed", assignmentsError)
          dataWarning = `${dataWarning ? `${dataWarning} ` : ""}Learner accounts could not be loaded.`
        } else if (assignments?.length) {
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", assignments.map((assignment) => assignment.user_id))
            .order("full_name")

          if (profilesError) {
            logError("admin.learner_profiles_load_failed", profilesError)
            dataWarning = `${dataWarning ? `${dataWarning} ` : ""}Learner accounts could not be loaded.`
          } else {
            learners = profiles ?? []
          }
        }
      }

      if (coursesResult.error) {
        logError("admin.certificate_courses_load_failed", coursesResult.error)
        dataWarning = `${dataWarning ? `${dataWarning} ` : ""}Courses could not be loaded for issuance.`
      } else {
        courses = (coursesResult.data ?? []).map((c) => ({ id: c.id, title: c.title }))
      }
    } catch (error) {
      loadFailed = true
      logError("admin.certificate_registry_load_failed", error)
      dataWarning =
        "Certificate records could not be loaded from Supabase. The list below may be incomplete."
    }
  }

  return (
    <CertificatesClient
      initialCertificates={certificates}
      learners={learners}
      courses={courses}
      dataWarning={dataWarning}
      loadFailed={loadFailed}
      prefilledRecipient={recipient}
      prefilledCourse={course}
      prefilledCourseId={courseId}
      initialIssueDate={initialIssueDate}
    />
  )
}
