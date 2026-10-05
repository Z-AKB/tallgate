import { redirect } from "next/navigation"

export default async function CourseDetailIndexRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Redirect to the public marketing page.
  // The actual lesson player is at `/learn/courses/[slug]/learn`.
  redirect(`/learning-hub/${slug}`)
}
