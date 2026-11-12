import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { checkCourseCompletion } from "@/lib/assessments/completion"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

function createServiceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type DbClient = ReturnType<typeof createServiceClient>
type IdRow = { id: string }

let serviceClient: DbClient
let testUserId: string
let testUserEmail: string
let courseId: string
let moduleId: string
let lessonId: string
let quizId: string

function requireId(data: IdRow | null, label: string): string {
  if (!data?.id) throw new Error(`${label} insert returned no id`)
  return data.id
}

describe("Phase 3: Automatic certificate issuance (disposable project)", () => {
  beforeAll(async () => {
    serviceClient = createServiceClient()
    testUserEmail = `issuance-test-${randomUUID()}@example.com`
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testUserEmail,
      password: "test-password-123",
      email_confirm: true,
    })
    expect(authError).toBeNull()
    if (!authData.user?.id) throw new Error("Auth user creation returned no user")
    testUserId = authData.user.id

    const { error: profileError } = await serviceClient.from("profiles").upsert({
      id: testUserId,
      full_name: "Issuance Test User",
      email: testUserEmail,
    })
    expect(profileError).toBeNull()
  }, 30000)

  afterAll(async () => {
    await serviceClient.from("profiles").delete().eq("id", testUserId)
    await serviceClient.auth.admin.deleteUser(testUserId)
  }, 30000)

  beforeEach(async () => {
    const uniqueSuffix = `test-${randomUUID()}`
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        title: "Test Auto-Issue Course",
        slug: `${uniqueSuffix}-course`,
        category: "test",
        duration: "4",
        short_description: "A test course for automatic certificate issuance",
        overview: "A comprehensive test course for verifying automatic certificate issuance functionality.",
        auto_issue_certificate: true,
      })
      .select("id")
      .single()
    expect(courseError).toBeNull()
    courseId = requireId(course, "course")

    const { data: module, error: moduleError } = await serviceClient
      .from("course_modules")
      .insert({ course_id: courseId, title: "Test Module", order_index: 1 })
      .select("id")
      .single()
    expect(moduleError).toBeNull()
    moduleId = requireId(module, "module")

    const { data: lesson, error: lessonError } = await serviceClient
      .from("lessons")
      .insert({
        module_id: moduleId,
        title: "Test Lesson",
        content_type: "text",
        duration_minutes: 30,
        order_index: 1,
        is_preview: false,
      })
      .select("id")
      .single()
    expect(lessonError).toBeNull()
    lessonId = requireId(lesson, "lesson")

    const { data: quiz, error: quizError } = await serviceClient
      .from("quizzes")
      .insert({
        course_id: courseId,
        title: "Test Quiz",
        is_required: true,
        is_published: true,
        kind: "quiz",
        pass_mark_percent: 70,
      })
      .select("id")
      .single()
    expect(quizError).toBeNull()
    quizId = requireId(quiz, "quiz")

    const { error: enrollmentError } = await serviceClient.from("course_enrollments").insert({
      user_id: testUserId,
      course_id: courseId,
      status: "active",
      progress_percent: 0,
    })
    expect(enrollmentError).toBeNull()
  }, 30000)

  afterEach(async () => {
    await serviceClient.from("certificates").delete().eq("user_id", testUserId).eq("course_id", courseId)
    await serviceClient.from("quiz_attempts").delete().eq("user_id", testUserId).eq("quiz_id", quizId)
    await serviceClient.from("lesson_progress").delete().eq("user_id", testUserId).eq("lesson_id", lessonId)
    await serviceClient.from("course_enrollments").delete().eq("user_id", testUserId).eq("course_id", courseId)
    await serviceClient.from("quizzes").delete().eq("id", quizId)
    await serviceClient.from("lessons").delete().eq("id", lessonId)
    await serviceClient.from("course_modules").delete().eq("id", moduleId)
    await serviceClient.from("courses").delete().eq("id", courseId)
  }, 30000)

  describe("Lesson completion path", () => {
    it("issues a certificate when all lessons and quizzes are completed", async () => {
      await serviceClient.from("lesson_progress").upsert({
        user_id: testUserId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      await serviceClient.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: testUserId,
        status: "graded",
        passed: true,
        percent: 90,
      })

      const result = await checkCourseCompletion(testUserId, courseId)

      expect(result.isComplete).toBe(true)
      expect(result.certificateIssued).toBe(true)
      expect(result.certificateStatus).toBe("created")

      const { data: cert, error } = await serviceClient
        .from("certificates")
        .select("id, user_id, course_id, storage_path, certificate_number")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
        .maybeSingle()

      expect(error).toBeNull()
      expect(cert).not.toBeNull()
      expect(cert?.storage_path).not.toBeNull()
      expect(cert?.certificate_number).not.toBeNull()
    })

    it("does not issue a certificate when course is incomplete", async () => {
      const result = await checkCourseCompletion(testUserId, courseId)

      expect(result.isComplete).toBe(false)
      expect(result.certificateIssued).toBe(false)
      expect(result.certificateStatus).toBe("none")

      const { data: cert, error } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
        .maybeSingle()

      expect(error).toBeNull()
      expect(cert).toBeNull()
    })

    it("is idempotent - repeated completion returns existing certificate", async () => {
      await serviceClient.from("lesson_progress").upsert({
        user_id: testUserId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      await serviceClient.from("quiz_attempts").insert({
        quiz_id: quizId,
        user_id: testUserId,
        status: "graded",
        passed: true,
        percent: 90,
      })

      const result1 = await checkCourseCompletion(testUserId, courseId)
      expect(result1.certificateIssued).toBe(true)
      expect(result1.certificateStatus).toBe("created")

      const { data: cert1 } = await serviceClient
        .from("certificates")
        .select("id, certificate_number")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
        .maybeSingle()
      expect(cert1).not.toBeNull()
      if (!cert1) throw new Error("expected certificate")

      const result2 = await checkCourseCompletion(testUserId, courseId)
      expect(result2.certificateIssued).toBe(true)
      expect(result2.certificateStatus).toBe("existing")

      const { data: cert2 } = await serviceClient
        .from("certificates")
        .select("id, certificate_number")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
        .maybeSingle()
      expect(cert2?.id).toBe(cert1.id)
      expect(cert2?.certificate_number).toBe(cert1.certificate_number)

      const { data: allCerts } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
      expect(allCerts?.length).toBe(1)
    })
  })

  describe("auto_issue_certificate = false", () => {
    it("does not issue a certificate when auto_issue is disabled", async () => {
      const uniqueSuffix = `test-${randomUUID()}`
      const { data: course, error: courseError } = await serviceClient
        .from("courses")
        .insert({
          title: "Test No-Auto-Issue Course",
          slug: `${uniqueSuffix}-course`,
          category: "test",
          duration: "4",
          short_description: "A test course without auto-issuance",
          overview: "A comprehensive test course without automatic certificate issuance.",
          auto_issue_certificate: false,
        })
        .select("id")
        .single()
      expect(courseError).toBeNull()
      const noAutoCourseId = requireId(course, "no-auto course")

      let localModuleId: string | null = null
      let localLessonId: string | null = null
      let localQuizId: string | null = null
      try {
        const { data: module } = await serviceClient
          .from("course_modules")
          .insert({ course_id: noAutoCourseId, title: "Module", order_index: 1 })
          .select("id")
          .single()
        localModuleId = requireId(module, "module")

        const { data: lesson } = await serviceClient
          .from("lessons")
          .insert({
            module_id: localModuleId,
            title: "Lesson",
            content_type: "text",
            duration_minutes: 30,
            order_index: 1,
            is_preview: false,
          })
          .select("id")
          .single()
        localLessonId = requireId(lesson, "lesson")

        const { data: quiz } = await serviceClient
          .from("quizzes")
          .insert({
            course_id: noAutoCourseId,
            title: "Quiz",
            is_required: true,
            is_published: true,
            kind: "quiz",
            pass_mark_percent: 70,
          })
          .select("id")
          .single()
        localQuizId = requireId(quiz, "quiz")

        await serviceClient.from("lesson_progress").upsert({
          user_id: testUserId,
          lesson_id: localLessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        await serviceClient.from("quiz_attempts").insert({
          quiz_id: localQuizId,
          user_id: testUserId,
          status: "graded",
          passed: true,
          percent: 90,
        })

        const result = await checkCourseCompletion(testUserId, noAutoCourseId)
        expect(result.isComplete).toBe(true)
        expect(result.certificateIssued).toBe(false)
        expect(result.certificateStatus).toBe("none")

        const { data: cert, error } = await serviceClient
          .from("certificates")
          .select("id")
          .eq("user_id", testUserId)
          .eq("course_id", noAutoCourseId)
          .maybeSingle()
        expect(error).toBeNull()
        expect(cert).toBeNull()
      } finally {
        await serviceClient.from("certificates").delete().eq("user_id", testUserId).eq("course_id", noAutoCourseId)
        if (localQuizId) await serviceClient.from("quiz_attempts").delete().eq("user_id", testUserId).eq("quiz_id", localQuizId)
        if (localLessonId) await serviceClient.from("lesson_progress").delete().eq("user_id", testUserId).eq("lesson_id", localLessonId)
        if (localQuizId) await serviceClient.from("quizzes").delete().eq("id", localQuizId)
        if (localLessonId) await serviceClient.from("lessons").delete().eq("id", localLessonId)
        if (localModuleId) await serviceClient.from("course_modules").delete().eq("id", localModuleId)
        await serviceClient.from("courses").delete().eq("id", noAutoCourseId)
      }
    })
  })
})
