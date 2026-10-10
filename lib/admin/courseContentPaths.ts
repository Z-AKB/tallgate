const MAX_FILE_NAME_LENGTH = 100
const MAX_FOLDER_SEGMENT_LENGTH = 40

export function sanitizeObjectSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
}

function truncatePreservingExtension(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  const dotIndex = value.lastIndexOf(".")
  const extension = dotIndex > 0 ? value.slice(dotIndex) : ""
  const stem = dotIndex > 0 ? value.slice(0, dotIndex) : value
  return `${stem.slice(0, Math.max(0, maxLength - extension.length))}${extension}`
}

export function buildObjectPath(courseId: string, lessonId: string, relativePath: string) {
  const segments = relativePath.split("/").filter(Boolean)
  const rawLeaf = segments.at(-1) ?? "material"
  const leaf =
    truncatePreservingExtension(sanitizeObjectSegment(rawLeaf), MAX_FILE_NAME_LENGTH) ||
    "material"
  const parents = segments
    .slice(0, -1)
    .slice(-2)
    .map((segment) => truncatePreservingExtension(sanitizeObjectSegment(segment), MAX_FOLDER_SEGMENT_LENGTH))
    .filter(Boolean)
  return `${courseId}/${lessonId}/${crypto.randomUUID()}/${[...parents, leaf].join("/")}`
}
