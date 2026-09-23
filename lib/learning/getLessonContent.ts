import { createClient } from "@/lib/database/server";

export type LessonAccessResult =
  | { access: "denied" }
  | { access: "granted"; contentType: "text"; body: string }
  | { access: "granted"; contentType: "video"; signedUrl: string };

/**
 * The actual access-gate for lesson content, mirroring Udemy's model:
 * public catalogue browsing is free, but the content itself is checked
 * server-side against enrollment before anything playable is returned.
 *
 * No custom REST/Edge Function needed for this — per the locked
 * "RLS-first, no custom API layer" decision, this just queries through
 * the signed-in user's own Supabase session. Postgres RLS on
 * `lesson_content` (migration 0002) does the actual enrollment check;
 * this function doesn't re-implement that logic, it just surfaces the
 * result. If the RLS policy denies the row, the query below simply
 * returns no rows — that IS the "access denied" case, not an error.
 *
 * For video lessons, Storage RLS (also migration 0002) independently
 * re-validates the same access rule before a signed URL can even be
 * created — so this function has no way to leak video content to an
 * unauthorized caller even if it had a bug, since Storage enforces it
 * again on its own.
 */
export async function getLessonContent(
  lessonId: string
): Promise<LessonAccessResult> {
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, content_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) {
    // Either the lesson doesn't exist, or its parent course isn't
    // published — either way, nothing to show.
    return { access: "denied" };
  }

  const { data: content } = await supabase
    .from("lesson_content")
    .select("content_url, content_body")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (!content) {
    // RLS denied the row — not enrolled, not a preview, not staff.
    return { access: "denied" };
  }

  if (lesson.content_type === "text") {
    return {
      access: "granted",
      contentType: "text",
      body: content.content_body ?? "",
    };
  }

  // Video: exchange the Storage path for a short-lived signed URL, using
  // the same user-session client — Storage RLS re-checks access
  // independently here (defense in depth, see migration 0002 §4).
  if (!content.content_url) {
    return { access: "denied" };
  }

  const { data: signed, error } = await supabase.storage
    .from("course-content")
    .createSignedUrl(content.content_url, 60 * 60); // 1 hour

  if (error || !signed) {
    return { access: "denied" };
  }

  return {
    access: "granted",
    contentType: "video",
    signedUrl: signed.signedUrl,
  };
}
