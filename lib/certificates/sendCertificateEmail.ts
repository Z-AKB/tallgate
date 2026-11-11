import "server-only"
import { logError } from "@/lib/logging/logger"

/**
 * Escapes a string for safe interpolation into an HTML text context.
 * Prevents HTML injection via user-controlled values such as recipient name,
 * course title, and certificate number.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Resolves and normalizes the trusted site origin from the configured
 * NEXT_PUBLIC_SITE_URL environment variable (or an explicitly provided
 * site URL in testing).
 * Returns null if the configuration is missing, non-https, or malformed.
 */
function getExpectedSiteOrigin(configuredSiteUrl?: string): string | null {
  const siteUrl = configuredSiteUrl ?? process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return null
  try {
    const parsed = new URL(siteUrl)
    if (parsed.protocol !== "https:") return null
    return parsed.origin
  } catch {
    return null
  }
}

/**
 * Validates a verification URL and returns a safe value for use in an HTML
 * href attribute.
 *
 * Requirements enforced:
 * - Requires HTTPS.
 * - Validates the parsed URL origin against the exact configured NEXT_PUBLIC_SITE_URL origin.
 * - Rejects arbitrary external HTTPS domains.
 * - Rejects malformed URLs and unsafe schemes (javascript:, http:, data:, etc.).
 * - Returns "#" for invalid, untrusted, or unconfigured URLs.
 * - Preserves correct HTML attribute escaping via escapeHtml().
 * - Compares normalized origins exactly without substring or suffix matching.
 */
export function safeHref(url: string, configuredSiteUrl?: string): string {
  try {
    const expectedOrigin = getExpectedSiteOrigin(configuredSiteUrl)
    if (!expectedOrigin) return "#"

    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return "#"
    if (parsed.origin !== expectedOrigin) return "#"

    return escapeHtml(url)
  } catch {
    return "#"
  }
}

export type CertificateEmailInput = {
  to: string
  recipientName: string
  courseTitle: string
  certificateNumber: string
  verificationUrl: string
  pdfBuffer: Buffer
  idempotencyKey?: string
}

/**
 * Stable Resend idempotency key for a certificate's delivery email.
 *
 * The same key is used by every send path for the same certificate (initial
 * issuance and admin retries). Lease tokens only prevent concurrent database
 * work; they cannot prevent duplicate external sends on their own. Resend
 * deduplicates requests that carry the same Idempotency-Key and payload for
 * 24 hours, so a retry after a database failure that followed a successful
 * external send returns the original response instead of sending again.
 */
export function certificateEmailIdempotencyKey(certificateId: string): string {
  return `certificate-email-${certificateId}`
}

export async function sendCertificateEmail(input: CertificateEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    throw new Error("Email sending is not configured (RESEND_API_KEY or RESEND_FROM_EMAIL missing).")
  }

  const pdfBase64 = input.pdfBuffer.toString("base64")

  // Compute the safe href once; reuse it for both the button and the visible
  // URL paragraph so that an unsafe input (non-https or malformed) is omitted
  // entirely from the HTML rather than displayed as harmless but confusing text.
  const verificationHref = safeHref(input.verificationUrl)
  // Show the URL as plain text only when it passed the https validation.
  const verificationTextHtml =
    verificationHref !== "#"
      ? `<p style="font-size: 13px; color: #94a3b8; text-align: center;">${escapeHtml(input.verificationUrl)}</p>`
      : ""

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: #061a4f; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
      <h1 style="color: #f4d086; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">TallGate Academy</h1>
      <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Your Certificate of Completion</p>
    </div>
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
      <p style="font-size: 16px; margin-top: 0;">Dear <strong>${escapeHtml(input.recipientName)}</strong>,</p>
      <p style="font-size: 15px; color: #475569;">Congratulations on successfully completing your course! Your official TallGate Academy certificate has been issued and is attached to this email as a PDF.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Certificate Details</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Course:</td>
            <td style="padding: 6px 0; color: #1e293b; font-weight: 600; text-align: right;">${escapeHtml(input.courseTitle)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Certificate No:</td>
            <td style="padding: 6px 0; color: #1e293b; font-family: monospace; font-size: 13px; text-align: right;">${escapeHtml(input.certificateNumber)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 15px; color: #475569;">You can verify your certificate at any time using the link below or by scanning the QR code on the certificate:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${verificationHref}" style="display: inline-block; background: #061a4f; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Verify Certificate</a>
      </p>
      ${verificationTextHtml}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">This certificate was issued by TallGate Academy. If you have any questions, please contact our support team.</p>
    </div>
  </body>
</html>
  `.trim()

  const text = `
Dear ${input.recipientName},

Congratulations on successfully completing your course! Your official TallGate Academy certificate has been issued and is attached to this email as a PDF.

Certificate Details:
- Course: ${input.courseTitle}
- Certificate No: ${input.certificateNumber}

You can verify your certificate at any time using the link below:
${input.verificationUrl}

This certificate was issued by TallGate Academy. If you have any questions, please contact our support team.
  `.trim()

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: `Your TallGate Academy Certificate: ${input.courseTitle}`,
    html,
    text,
    attachments: [
      {
        filename: `certificate-${input.certificateNumber.replace(/\//g, "-")}.pdf`,
        content: pdfBase64,
      },
    ],
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  // Add idempotency key as header if provided (Resend supports Idempotency-Key header)
  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })

  const data = await res.json()

  if (!res.ok) {
    logError("certificate.email_resend_failed", data, { status: res.status })
    throw new Error(`Failed to send certificate email: ${data.message || "Unknown error"}`)
  }
}