import { NextRequest, NextResponse } from "next/server"
import { isRecord } from "@/lib/utils"

const DEFAULT_MAX_BODY_BYTES = 32 * 1024

export async function readJsonObject(
  request: NextRequest,
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES
): Promise<
  | { data: Record<string, unknown>; response?: never }
  | { data?: never; response: NextResponse }
> {
  if (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .split(";", 1)[0]
      .trim() !== "application/json"
  ) {
    return {
      response: NextResponse.json(
        { error: "Content-Type must be application/json." },
        { status: 415 }
      ),
    }
  }

  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return {
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      ),
    }
  }

  const reader = request.body?.getReader()
  if (!reader) {
    return {
      response: NextResponse.json(
        { error: "A JSON object is required." },
        { status: 400 }
      ),
    }
  }

  const chunks: Uint8Array[] = []
  let bodyBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bodyBytes += value.byteLength
    if (bodyBytes > maxBodyBytes) {
      await reader.cancel()
      return {
        response: NextResponse.json(
          { error: "Request body is too large." },
          { status: 413 }
        ),
      }
    }
    chunks.push(value)
  }

  const body = new Uint8Array(bodyBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(body))
  } catch {
    return {
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      ),
    }
  }

  if (!isRecord(parsed)) {
    return {
      response: NextResponse.json(
        { error: "A JSON object is required." },
        { status: 400 }
      ),
    }
  }

  return { data: parsed }
}

export function isValidEmailAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
}

export function isNonEmptyText(
  value: unknown,
  maxLength: number
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  )
}

export function isOptionalText(
  value: unknown,
  maxLength: number
): value is string | null | undefined {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    isNonEmptyText(value, maxLength)
  )
}

export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}
