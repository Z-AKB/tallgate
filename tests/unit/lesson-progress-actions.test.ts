import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  requireUserMock,
  createClientMock,
  getLessonContentMock,
  checkCourseCompletionMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  createClientMock: vi.fn(),
  getLessonContentMock: vi.fn(),
  checkCourseCompletionMock: vi.fn(),
}))

vi.mock("@/lib/auth/guards", () => ({ requireUser: requireUserMock }))
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))
vi.mock("@/lib/learning/getLessonContent", () => ({
  getLessonContent: getLessonContentMock,
}))
vi.mock("@/lib/assessments/completion", () => ({
  checkCourseCompletion: checkCourseCompletionMock,
}))

import { completeLesson, saveLessonWatchProgress } from "@/lib/learning/actions"

type QueryResult<T> = { data: T; error: { message: string } | null }

type MockState = {
  lesson: QueryResult<{ module_id: string; course_modules: { course_id: string } | null } | null>
  enrollment: QueryResult<{ id: string } | null>
  progressError: { message: string } | null
  upserts: Array<{ table: string; payload: Record<string, unknown>; options?: unknown }>
}

function createSupabaseMock(state: MockState) {
  return {
    from(table: string) {
      if (table === "lessons") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => state.lesson,
            }),
          }),
        }
      }
      if (table === "course_enrollments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  maybeSingle: async () => state.enrollment,
                }),
              }),
            }),
          }),
        }
      }
      if (table === "lesson_progress") {
        return {
          upsert: async (payload: Record<string, unknown>, options?: unknown) => {
            state.upserts.push({ table, payload, options })
            return { error: state.progressError }
          },
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

function baseState(overrides: Partial<MockState> = {}): MockState {
  return {
    lesson: {
      data: { module_id: "module-1", course_modules: { course_id: "course-1" } },
      error: null,
    },
    enrollment: { data: { id: "enrollment-1" }, error: null },
    progressError: null,
    upserts: [],
    ...overrides,
  }
}

let state: MockState

beforeEach(() => {
  state = baseState()
  requireUserMock.mockReset().mockResolvedValue({
    id: "user-1",
    roles: ["learner"],
    profile: null,
  })
  createClientMock.mockReset().mockResolvedValue(createSupabaseMock(state))
  getLessonContentMock.mockReset().mockResolvedValue({
    access: "granted",
    contentType: "text",
    body: "Lesson body",
  })
  checkCourseCompletionMock.mockReset().mockResolvedValue({
    isComplete: false,
    progressPercent: 50,
    certificateIssued: false,
    certificateStatus: "none",
  })
})

describe("completeLesson", () => {
  it("rejects an unenrolled learner without writing progress", async () => {
    state.enrollment = { data: null, error: null }

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({ ok: false, error: "You are not enrolled in this course." })
    expect(state.upserts).toHaveLength(0)
    expect(checkCourseCompletionMock).not.toHaveBeenCalled()
  })

  it("rejects a lesson the learner cannot access", async () => {
    getLessonContentMock.mockResolvedValue({ access: "denied" })

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({
      ok: false,
      error: "You do not have access to this lesson.",
    })
    expect(state.upserts).toHaveLength(0)
    expect(checkCourseCompletionMock).not.toHaveBeenCalled()
  })

  it("fails when the lesson lookup errors", async () => {
    state.lesson = { data: null, error: { message: "boom" } }

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({ ok: false, error: "The lesson could not be updated." })
    expect(state.upserts).toHaveLength(0)
  })

  it("fails when the lesson does not belong to a course", async () => {
    state.lesson = {
      data: { module_id: "module-1", course_modules: null },
      error: null,
    }

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({ ok: false, error: "The lesson could not be found." })
    expect(state.upserts).toHaveLength(0)
  })

  it("records completion and triggers server-side course completion", async () => {
    checkCourseCompletionMock.mockResolvedValue({
      isComplete: true,
      progressPercent: 100,
      certificateIssued: true,
      certificateStatus: "created",
    })

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({
      ok: true,
      completed: true,
      courseCompleted: true,
      certificateIssued: true,
      certificateStatus: "created",
    })
    expect(state.upserts).toHaveLength(1)
    expect(state.upserts[0]).toMatchObject({
      table: "lesson_progress",
      payload: {
        user_id: "user-1",
        lesson_id: "lesson-1",
        is_completed: true,
      },
      options: { onConflict: "user_id,lesson_id" },
    })
    expect(checkCourseCompletionMock).toHaveBeenCalledWith("user-1", "course-1")
  })

  it("is safe to repeat for an already-completed lesson", async () => {
    checkCourseCompletionMock.mockResolvedValue({
      isComplete: true,
      progressPercent: 100,
      certificateIssued: true,
      certificateStatus: "existing",
    })

    const first = await completeLesson("lesson-1")
    const second = await completeLesson("lesson-1")

    expect(first).toMatchObject({ ok: true, completed: true, certificateStatus: "existing" })
    expect(second).toMatchObject({ ok: true, completed: true, certificateStatus: "existing" })
    expect(state.upserts).toHaveLength(2)
  })

  it("keeps the lesson completion when completion recompute throws", async () => {
    checkCourseCompletionMock.mockRejectedValue(new Error("recompute down"))

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({
      ok: true,
      completed: true,
      courseCompleted: false,
      certificateIssued: false,
      certificateStatus: "none",
    })
  })

  it("reports a failed progress write", async () => {
    state.progressError = { message: "constraint" }

    const result = await completeLesson("lesson-1")

    expect(result).toEqual({ ok: false, error: "Your progress could not be saved." })
    expect(checkCourseCompletionMock).not.toHaveBeenCalled()
  })
})

describe("saveLessonWatchProgress", () => {
  it("rejects invalid watch durations before writing", async () => {
    await expect(saveLessonWatchProgress("lesson-1", -1)).resolves.toEqual({
      ok: false,
      error: "Invalid watch duration.",
    })
    await expect(saveLessonWatchProgress("lesson-1", Number.NaN)).resolves.toEqual({
      ok: false,
      error: "Invalid watch duration.",
    })
    await expect(saveLessonWatchProgress("lesson-1", 86401)).resolves.toEqual({
      ok: false,
      error: "Invalid watch duration.",
    })
    expect(createClientMock).not.toHaveBeenCalled()
    expect(state.upserts).toHaveLength(0)
  })

  it("rejects an unenrolled learner without writing progress", async () => {
    state.enrollment = { data: null, error: null }

    const result = await saveLessonWatchProgress("lesson-1", 30)

    expect(result).toEqual({ ok: false, error: "You are not enrolled in this course." })
    expect(state.upserts).toHaveLength(0)
  })

  it("stores watch time without completing the lesson", async () => {
    const result = await saveLessonWatchProgress("lesson-1", 42.6)

    expect(result).toEqual({
      ok: true,
      completed: false,
      courseCompleted: false,
      certificateIssued: false,
      certificateStatus: "none",
    })
    expect(state.upserts).toHaveLength(1)
    expect(state.upserts[0]).toMatchObject({
      table: "lesson_progress",
      payload: {
        user_id: "user-1",
        lesson_id: "lesson-1",
        watch_time_seconds: 43,
      },
      options: { onConflict: "user_id,lesson_id" },
    })
    expect(state.upserts[0].payload).not.toHaveProperty("is_completed")
    expect(checkCourseCompletionMock).not.toHaveBeenCalled()
  })

  it("fails when the lesson cannot be found", async () => {
    state.lesson = { data: null, error: null }

    const result = await saveLessonWatchProgress("lesson-1", 30)

    expect(result).toEqual({ ok: false, error: "The lesson could not be found." })
    expect(state.upserts).toHaveLength(0)
  })
})
