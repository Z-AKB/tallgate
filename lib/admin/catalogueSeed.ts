import type { Database } from "@/types/supabase"
import { coursesData, type CourseOffering } from "@/lib/data/courses"

/**
 * Shared, side-effect-free helpers for the admin "Seed/Sync Learning Hub
 * Courses" workflow. Keeping the planning logic pure lets it be unit tested
 * without a database: the API layer only executes the returned plan.
 */

export const CANONICAL_MODULE_TITLE = "Package Curriculum"
export const DEFAULT_COURSE_LEVEL = "Beginner"

type Tables = Database["public"]["Tables"]
export type CourseInsert = Tables["courses"]["Insert"]

export type CatalogueModulePlan = {
  title: string
  orderIndex: number
  /** True when the canonical module is missing and must be inserted. */
  create: boolean
  /** Canonical lesson titles that are missing from the module. */
  lessonTitlesToCreate: string[]
}

export type CatalogueSeedPlan = {
  course: CourseOffering
  /** True when no course with this slug exists yet. */
  createCourse: boolean
  /** True when a course exists with the same slug but a different title. */
  titleConflict: boolean
  modules: CatalogueModulePlan[]
}

export type ExistingCatalogueModule = {
  title: string
  lessonTitles: string[]
}

export type ExistingCatalogueCourse = {
  slug: string
  title: string
  modules: ExistingCatalogueModule[]
}

/**
 * Builds a URL/id-safe slug from arbitrary text: lowercased, non-alphanumeric
 * runs collapsed to a single hyphen, trimmed of leading/trailing hyphens, and
 * capped at the column's 80 character budget.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
}

/**
 * Maps an authored catalogue definition to the `courses` insert shape. Prices
 * and descriptions come straight from lib/data/courses.ts so the seed and the
 * public Learning Hub stay identical.
 */
export function toCourseInsert(course: CourseOffering, displayOrder: number): CourseInsert {
  return {
    slug: course.slug,
    title: course.title,
    category: course.category,
    level: course.level,
    price_ngn: course.priceNgn,
    duration: course.duration,
    short_description: course.shortDescription,
    overview: course.overview,
    learning_outcomes: course.learningOutcomes,
    prerequisites: course.prerequisites,
    is_popular: Boolean(course.isPopular),
    is_published: true,
    display_order: displayOrder,
  }
}

/**
 * Diff the canonical catalogue against the rows already in the database.
 * Idempotent: existing courses and lessons are never scheduled for rewrite;
 * only missing course/module/lesson rows are proposed, and stale titles are
 * reported as conflicts rather than silently overwritten.
 */
export function planCatalogueSeed(
  existing: ExistingCatalogueCourse[],
  canonical: CourseOffering[] = coursesData
): CatalogueSeedPlan[] {
  const existingBySlug = new Map(existing.map((course) => [course.slug, course]))

  return canonical.map((course) => {
    const match = existingBySlug.get(course.slug)

    const modules = course.syllabus.map((mod, index) => {
      const existingModule = match?.modules.find(
        (candidate) => candidate.title.trim() === mod.moduleTitle.trim()
      )
      if (!existingModule) {
        return {
          title: mod.moduleTitle,
          orderIndex: index,
          create: true,
          lessonTitlesToCreate: [...mod.topics],
        }
      }
      const present = new Set(existingModule.lessonTitles.map((title) => title.trim()))
      return {
        title: mod.moduleTitle,
        orderIndex: index,
        create: false,
        lessonTitlesToCreate: mod.topics.filter((topic) => !present.has(topic.trim())),
      }
    })

    return {
      course,
      createCourse: !match,
      titleConflict: Boolean(match) && match!.title.trim() !== course.title.trim(),
      modules,
    }
  })
}
