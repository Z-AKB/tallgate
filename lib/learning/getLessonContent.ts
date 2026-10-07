import { createClient } from "@/lib/database/server";

export type LessonAccessResult =
  | { access: "denied" }
  | { access: "granted"; contentType: "text"; body: string }
  | { access: "granted"; contentType: "video"; signedUrl: string }
  | {
      access: "granted"
      contentType: "document"
      signedUrl: string
      fileName: string
    };

export async function getLessonContent(
  lessonId: string
): Promise<LessonAccessResult> {
  const supabase = await createClient();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, content_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError) {
    console.error("Unable to load lesson metadata:", lessonError)
    throw new Error("Unable to load lesson access.")
  }

  if (!lesson) {
    return { access: "denied" };
  }

  const { data: content, error: contentError } = await supabase
    .from("lesson_content")
    .select("content_url, content_body")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (contentError) {
    console.error("Unable to load lesson content:", contentError)
    throw new Error("Unable to load lesson content.")
  }

  if (!content) {
    return { access: "denied" };
  }

  if (lesson.content_type === "text") {
    return {
      access: "granted",
      contentType: "text",
      body: content.content_body ?? "",
    };
  }

  if (!content.content_url) {
    return { access: "denied" };
  }

  const isDocument = lesson.content_type === "document";
  const { data: signed, error } = await supabase.storage
    .from("course-content")
    .createSignedUrl(
      content.content_url,
      60 * 60,
      isDocument ? { download: true } : undefined
    )

  if (error || !signed) {
    console.error("Unable to sign lesson content URL:", error)
    throw new Error("Unable to load lesson content.")
  }

  if (isDocument) {
    return {
      access: "granted",
      contentType: "document",
      signedUrl: signed.signedUrl,
      fileName: content.content_url.split("/").at(-1) || "course-material",
    };
  }

  return {
    access: "granted",
    contentType: "video",
    signedUrl: signed.signedUrl,
  };
}
