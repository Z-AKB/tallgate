import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockCourses, MockCourse } from "@/lib/data/adminMockData"
import CoursesClient from "@/components/admin/CoursesClient"

export const metadata = {
  title: "Academy Course Catalog | TallGate Admin",
  description: "Manage learning hub curricula, course pricing in NGN, and publishing status.",
}

export default async function AdminCoursesPage() {
  const supabase = createClient()
  let courses: MockCourse[] = mockCourses

  if (isSupabaseConfigured()) try {
    const { data, error } = await (supabase.from("courses") as any)
      .select("*")
      .order("display_order", { ascending: true })

    if (data && data.length > 0) {
      courses = data.map((item: any) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        category: item.category,
        level: item.level,
        price_ngn: Number(item.price_ngn) || 0,
        duration: item.duration,
        short_description: item.short_description,
        is_popular: Boolean(item.is_popular),
        is_published: Boolean(item.is_published),
        enrollment_count: item.enrollment_count || 45,
        created_at: item.created_at,
      }))
    }
  } catch (err) {
    console.warn("Supabase courses query fallback:", err)
  }

  return <CoursesClient initialCourses={courses} />
}
