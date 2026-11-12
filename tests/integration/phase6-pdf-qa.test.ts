import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
  renderCertificatePdf,
  type CertificateData,
} from "@/lib/certificates/generateCertificatePdf"
import { getDocument, GlobalWorkerOptions, OPS } from "pdfjs-dist/legacy/build/pdf.mjs"
import type { TextItem } from "pdfjs-dist/types/src/display/api"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import jsQR from "jsqr"
import QRCode from "qrcode"
import { pathToFileURL } from "url"
import path from "path"
import { readFile } from "fs/promises"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
const SITE_URL = requireEnv("NEXT_PUBLIC_SITE_URL")
const SITE_ORIGIN = new URL(SITE_URL).origin

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).href

function createServiceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type DbClient = ReturnType<typeof createServiceClient>

const A4_LANDSCAPE_WIDTH = 841.89
const A4_LANDSCAPE_HEIGHT = 595.28

function certificateFixture(overrides: Partial<CertificateData> = {}): CertificateData {
  return {
    recipient_name: "PDF QA Learner",
    course_title: "PDF QA Test Course",
    course_description: "A course for testing PDF certificate generation and visual QA.",
    issue_date: "2026-11-12",
    grade: "Distinction",
    certificate_number: "TG-PDF-QA-001",
    verification_code: "TG-PDF-QA-001",
    verification_url: "https://tallgate.example.com/verify?code=TG-PDF-QA-001",
    qr_data_url:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    ...overrides,
  }
}

async function loadPdf(pdfBuffer: Buffer) {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer), disableFontFace: true })
  return loadingTask.promise
}

async function renderPageToRgba(pdfBuffer: Buffer) {
  const pdf = await loadPdf(pdfBuffer)
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2 })
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
  const context = canvas.getContext("2d")
  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
  }).promise
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
    pdf,
    page,
    viewport,
  }
}

async function extractPageText(pdfBuffer: Buffer) {
  const pdf = await loadPdf(pdfBuffer)
  const page = await pdf.getPage(1)
  const textContent = await page.getTextContent()
  const items = textContent.items.filter((item) => "str" in item) as TextItem[]
  return {
    page,
    pdf,
    items,
    viewport: page.getViewport({ scale: 1 }),
    text: items.map((item) => item.str).join(" "),
  }
}

type ExtractedImage = {
  width: number
  height: number
  data: Uint8ClampedArray
}

async function extractEmbeddedImages(pdfBuffer: Buffer): Promise<ExtractedImage[]> {
  const pdf = await loadPdf(pdfBuffer)
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1 })

  // Rendering decodes every image XObject, which makes it available through
  // page.objs without relying on private PDF internals.
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
  await page.render({
    canvasContext: canvas.getContext("2d") as unknown as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
  }).promise

  const operators = await page.getOperatorList()
  const images: ExtractedImage[] = []
  for (let index = 0; index < operators.fnArray.length; index++) {
    if (operators.fnArray[index] !== OPS.paintImageXObject) continue
    const objectId = operators.argsArray[index][0] as string
    images.push(
      await new Promise<ExtractedImage>((resolve) => page.objs.get(objectId, resolve))
    )
  }
  return images
}

async function loadAssetPixels(filename: string): Promise<ExtractedImage> {
  const buffer = await readFile(path.join(process.cwd(), "public", "assets", filename))
  const image = await loadImage(buffer)
  const canvas = createCanvas(image.width, image.height)
  const context = canvas.getContext("2d")
  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  return {
    width: imageData.width,
    height: imageData.height,
    data: new Uint8ClampedArray(imageData.data),
  }
}

describe("Phase 6: PDF and QR QA (disposable project)", () => {
  let serviceClient: DbClient
  let testUserId: string
  let testUserEmail: string
  const createdCertificateIds: string[] = []

  beforeAll(async () => {
    serviceClient = createServiceClient()
    testUserEmail = `pdf-qa-${randomUUID()}@example.com`
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testUserEmail,
      password: "test-password-123",
      email_confirm: true,
    })
    expect(authError).toBeNull()
    if (!authData.user?.id) throw new Error("auth user creation returned no user")
    testUserId = authData.user.id

    const { error: profileError } = await serviceClient.from("profiles").upsert({
      id: testUserId,
      full_name: "PDF QA Learner",
      email: testUserEmail,
    })
    expect(profileError).toBeNull()
  }, 30000)

  afterAll(async () => {
    if (createdCertificateIds.length > 0) {
      await serviceClient.from("certificates").delete().in("id", createdCertificateIds)
    }
    await serviceClient.from("profiles").delete().eq("id", testUserId)
    await serviceClient.auth.admin.deleteUser(testUserId)
  }, 30000)

  describe("PDF structure and layout", () => {
    it("generates a structurally valid, single-page PDF", async () => {
      const pdfBuffer = await renderCertificatePdf(certificateFixture())

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(2000)
      expect(pdfBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-")
      const content = pdfBuffer.toString("latin1")
      expect(content).toContain("%%EOF")
      expect(content).toContain("xref")

      const pdf = await loadPdf(pdfBuffer)
      expect(pdf.numPages).toBe(1)
    })

    it("uses A4 landscape page dimensions", async () => {
      const pdfBuffer = await renderCertificatePdf(certificateFixture())
      const pdf = await loadPdf(pdfBuffer)
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.0 })

      expect(viewport.width).toBeCloseTo(A4_LANDSCAPE_WIDTH, 1)
      expect(viewport.height).toBeCloseTo(A4_LANDSCAPE_HEIGHT, 1)
      expect(viewport.width).toBeGreaterThan(viewport.height)
    })

    it("extracts every expected dynamic field", async () => {
      const { text } = await extractPageText(await renderCertificatePdf(certificateFixture()))
      const normalizedText = text.replace(/\s+/g, "")

      expect(normalizedText).toContain("PDFQALearner")
      expect(normalizedText).toContain("PDFQATestCourse")
      expect(normalizedText).toContain("TG-PDF-QA-001")
      expect(normalizedText).toContain("Distinction")
      expect(normalizedText).toContain("TrainingCoordinator")
      expect(normalizedText).toContain("ProgrammeDirector")
    })

    it("renders different recipients and courses without leaking fixture data", async () => {
      const first = await extractPageText(
        await renderCertificatePdf(
          certificateFixture({
            recipient_name: "Ada Lovelace",
            course_title: "Analytical Engines 101",
          })
        )
      )
      const second = await extractPageText(
        await renderCertificatePdf(
          certificateFixture({
            recipient_name: "Grace Hopper",
            course_title: "Compiler Design 201",
          })
        )
      )

      const firstText = first.text.replace(/\s+/g, "")
      const secondText = second.text.replace(/\s+/g, "")

      expect(firstText).toContain("AdaLovelace")
      expect(firstText).toContain("AnalyticalEngines101")
      expect(firstText).not.toContain("GraceHopper")
      expect(secondText).toContain("GraceHopper")
      expect(secondText).toContain("CompilerDesign201")
      expect(secondText).not.toContain("AdaLovelace")
    })

    it("keeps every text item inside the page bounds (no overflow)", async () => {
      const { items, viewport } = await extractPageText(
        await renderCertificatePdf(
          certificateFixture({
            recipient_name: "A Very Long Recipient Name That Exercises Dynamic Font Sizing",
            course_title:
              "An Extremely Long Course Title That Exercises The Certificate Layout Responsiveness",
            course_description:
              "A deliberately long course description that exercises dynamic description font sizing and wrapping across the certificate body without allowing content to spill outside the printable area. ".repeat(
                2
              ),
          })
        )
      )

      expect(items.length).toBeGreaterThan(0)
      for (const item of items) {
        const [, , , , x, y] = item.transform
        expect(x).toBeGreaterThanOrEqual(-1)
        expect(y).toBeGreaterThanOrEqual(-1)
        expect(x + item.width).toBeLessThanOrEqual(viewport.width + 1)
        expect(y + item.height).toBeLessThanOrEqual(viewport.height + 1)
      }
    })

    it("embeds the logo, both signatures, and the QR image", async () => {
      const pdfBuffer = await renderCertificatePdf(certificateFixture())
      const content = pdfBuffer.toString("latin1")
      const imageCount = (content.match(/\/Subtype\s*\/Image/g) || []).length
      expect(imageCount).toBeGreaterThanOrEqual(4)

      const images = await extractEmbeddedImages(pdfBuffer)
      const qrImage = images.find((image) => image.width === 1 && image.height === 1)
      expect(qrImage).toBeTruthy()
    })

    it("embeds the approved logo and signature assets byte-for-byte", async () => {
      const pdfBuffer = await renderCertificatePdf(certificateFixture())
      const images = await extractEmbeddedImages(pdfBuffer)

      const assetFiles = [
        "tallgate-logo.png",
        "signature-training-coordinator.png",
        "signature-programme-director.png",
      ]

      for (const filename of assetFiles) {
        const asset = await loadAssetPixels(filename)
        const embedded = images.find(
          (image) =>
            image.width === asset.width &&
            image.height === asset.height &&
            image.data.length === asset.data.length
        )
        expect(embedded, `Expected ${filename} to be embedded at its source dimensions`).toBeTruthy()
        if (!embedded) continue
        expect(
          Buffer.from(embedded.data).equals(Buffer.from(asset.data)),
          `Expected embedded ${filename} pixels to match the approved repository asset`
        ).toBe(true)
      }
    })
  })

  describe("QR code contents and placement", () => {
    it("decodes the QR to the trusted verification URL and expected code", async () => {
      const verificationCode = `TG-QA-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
      const verificationUrl = new URL("/verify", SITE_URL)
      verificationUrl.searchParams.set("code", verificationCode)
      const qrDataUrl = await QRCode.toDataURL(verificationUrl.toString(), {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
      })

      const pdfBuffer = await renderCertificatePdf(
        certificateFixture({
          certificate_number: verificationCode,
          verification_code: verificationCode,
          verification_url: verificationUrl.toString(),
          qr_data_url: qrDataUrl,
        })
      )

      const rendered = await renderPageToRgba(pdfBuffer)
      const decoded = jsQR(rendered.data, rendered.width, rendered.height)
      expect(decoded).not.toBeNull()
      if (!decoded) return

      const decodedUrl = new URL(decoded.data)
      expect(decodedUrl.origin).toBe(SITE_ORIGIN)
      expect(decodedUrl.pathname).toBe("/verify")
      expect(decodedUrl.searchParams.get("code")).toBe(verificationCode)

      // QR sits in the footer: horizontally centered and in the lower half.
      const xs = [
        decoded.location.topLeftCorner.x,
        decoded.location.topRightCorner.x,
        decoded.location.bottomLeftCorner.x,
        decoded.location.bottomRightCorner.x,
      ]
      const ys = [
        decoded.location.topLeftCorner.y,
        decoded.location.topRightCorner.y,
        decoded.location.bottomLeftCorner.y,
        decoded.location.bottomRightCorner.y,
      ]
      const centerX = xs.reduce((sum, value) => sum + value, 0) / xs.length
      const centerY = ys.reduce((sum, value) => sum + value, 0) / ys.length
      expect(centerX).toBeGreaterThan(rendered.width * 0.3)
      expect(centerX).toBeLessThan(rendered.width * 0.7)
      expect(centerY).toBeGreaterThan(rendered.height * 0.6)
    })

    it("verifies a decoded code through the public verification RPC", async () => {
      const verificationCode = `TG-QA-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
      const verificationUrl = new URL("/verify", SITE_URL)
      verificationUrl.searchParams.set("code", verificationCode)
      const qrDataUrl = await QRCode.toDataURL(verificationUrl.toString(), {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
      })

      const { data: inserted, error: insertError } = await serviceClient
        .from("certificates")
        .insert({
          certificate_number: `QA-${verificationCode}`,
          certificate_type: "independent",
          issuance_reason: "Automated Phase 6 QR verification test",
          verification_code: verificationCode,
          recipient_name: "QR Verification Learner",
          user_id: testUserId,
          course_id: null,
          course_title: "QR Verification Course",
          issue_date: "2026-11-12",
          grade: "Distinction",
          is_valid: true,
        })
        .select("id")
        .single()
      expect(insertError).toBeNull()
      if (!inserted?.id) throw new Error("certificate insert returned no id")
      createdCertificateIds.push(inserted.id)

      const pdfBuffer = await renderCertificatePdf(
        certificateFixture({
          certificate_number: `QA-${verificationCode}`,
          verification_code: verificationCode,
          verification_url: verificationUrl.toString(),
          qr_data_url: qrDataUrl,
        })
      )
      const rendered = await renderPageToRgba(pdfBuffer)
      const decoded = jsQR(rendered.data, rendered.width, rendered.height)
      expect(decoded).not.toBeNull()
      if (!decoded) return
      const decodedCode = new URL(decoded.data).searchParams.get("code")
      expect(decodedCode).toBe(verificationCode)

      const { data: verified, error: verifyError } = await serviceClient.rpc(
        "verify_certificate",
        { p_verification_code: decodedCode as string }
      )
      expect(verifyError).toBeNull()
      expect(verified).toHaveLength(1)
      expect(verified?.[0]?.is_valid).toBe(true)
      expect(verified?.[0]?.course_title).toBe("QR Verification Course")

      const { error: revokeError } = await serviceClient
        .from("certificates")
        .update({ is_valid: false })
        .eq("id", inserted.id)
      expect(revokeError).toBeNull()

      const { data: revoked, error: revokedError } = await serviceClient.rpc(
        "verify_certificate",
        { p_verification_code: decodedCode as string }
      )
      expect(revokedError).toBeNull()
      expect(revoked?.[0]?.is_valid).toBe(false)
    })
  })

  describe("visual inspection limitation", () => {
    it("documents that pixel-level comparison with the approved archive remains BLOCKED", () => {
      // The approved design archive is available and its assets are byte-identical
      // to the repository assets. A pixel-diff against the original approved PDF
      // still requires the original PDF rasterizer/toolchain, which is not present.
      expect(true).toBe(true)
    })
  })
})
