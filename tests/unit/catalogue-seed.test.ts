import { describe, expect, it } from "vitest"
import {
  CANONICAL_MODULE_TITLE,
  planCatalogueSeed,
  slugify,
  toCourseInsert,
  type ExistingCatalogueCourse,
} from "@/lib/admin/catalogueSeed"
import { coursesData } from "@/lib/data/courses"

const CANONICAL_TITLES = [
  "Appreciation Package",
  "Advanced Package",
  "Digital Package",
  "Security Package",
  "Developer Package",
  "Digital Health Package",
]

function buildFullySeededExisting(): ExistingCatalogueCourse[] {
  return coursesData.map((course) => ({
    slug: course.slug,
    title: course.title,
    modules: course.syllabus.map((module) => ({
      title: module.moduleTitle,
      lessonTitles: [...module.topics],
    })),
  }))
}

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Appreciation Package")).toBe("appreciation-package")
  })

  it("strips punctuation and trims hyphens", () => {
    expect(slugify("  Domain & Hosting!  ")).toBe("domain-hosting")
  })

  it("caps the result at 80 characters", () => {
    expect(slugify("a".repeat(120)).length).toBeLessThanOrEqual(80)
  })

  it("returns an empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("")
  })
})

describe("planCatalogueSeed", () => {
  it("uses the six canonical Learning Hub titles", () => {
    expect(coursesData.map((course) => course.title)).toEqual(CANONICAL_TITLES)
  })

  it("plans a full create on a fresh database", () => {
    const plan = planCatalogueSeed([])
    expect(plan).toHaveLength(6)
    for (const item of plan) {
      expect(item.createCourse).toBe(true)
      expect(item.titleConflict).toBe(false)
      expect(item.modules).toHaveLength(1)
      expect(item.modules[0].create).toBe(true)
      expect(item.modules[0].lessonTitlesToCreate).toEqual(item.course.syllabus[0].topics)
    }
  })

  it("is idempotent once every canonical course and lesson exists", () => {
    const plan = planCatalogueSeed(buildFullySeededExisting())
    for (const item of plan) {
      expect(item.createCourse).toBe(false)
      expect(item.titleConflict).toBe(false)
      expect(item.modules[0].create).toBe(false)
      expect(item.modules[0].lessonTitlesToCreate).toEqual([])
    }
  })

  it("reports a conflict without overwriting a different title", () => {
    const existing = buildFullySeededExisting()
    existing[0] = { ...existing[0], title: "Renamed Appreciation" }
    const plan = planCatalogueSeed(existing)
    const first = plan.find((item) => item.course.slug === existing[0].slug)
    expect(first?.createCourse).toBe(false)
    expect(first?.titleConflict).toBe(true)
  })

  it("only creates the lessons that are missing", () => {
    const existing = buildFullySeededExisting()
    existing[0] = {
      ...existing[0],
      modules: [
        {
          title: CANONICAL_MODULE_TITLE,
          lessonTitles: [coursesData[0].syllabus[0].topics[0]],
        },
      ],
    }
    const plan = planCatalogueSeed(existing)
    expect(plan[0].createCourse).toBe(false)
    expect(plan[0].modules[0].create).toBe(false)
    expect(plan[0].modules[0].lessonTitlesToCreate).toEqual(
      coursesData[0].syllabus[0].topics.slice(1)
    )
  })

  it("recreates a missing module while leaving the course intact", () => {
    const existing = buildFullySeededExisting()
    existing[1] = { ...existing[1], modules: [] }
    const plan = planCatalogueSeed(existing)
    expect(plan[1].createCourse).toBe(false)
    expect(plan[1].modules[0].create).toBe(true)
    expect(plan[1].modules[0].lessonTitlesToCreate).toEqual(coursesData[1].syllabus[0].topics)
  })
})

describe("toCourseInsert", () => {
  it("maps authored fields straight from the catalogue", () => {
    const course = coursesData[1]
    const insert = toCourseInsert(course, 3)
    expect(insert).toMatchObject({
      slug: course.slug,
      title: course.title,
      category: course.category,
      level: course.level,
      price_ngn: course.priceNgn,
      duration: course.duration,
      short_description: course.shortDescription,
      overview: course.overview,
      is_popular: true,
      is_published: true,
      display_order: 3,
    })
    expect(insert.learning_outcomes).toEqual(course.learningOutcomes)
  })
})
