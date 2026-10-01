import { redirect } from "next/navigation"

export default function CourseDetailIndexRedirect({
  params,
}: {
  params: { slug: string }
}) {
  // Redirect to the public marketing page.
  // The actual lesson player is at `/learn/courses/[slug]/learn`.
  redirect(`/learning-hub/${params.slug}`)
}
