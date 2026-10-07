import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/auth/guards"

export const runtime = "nodejs"

const CERTIFICATE_BUCKET = "certificates"
const SIGNED_URL_TTL_SECONDS = 300

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await requireAdminApi()
    if (admin.error) return admin.error

    const supabase = createAdminClient()

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Unable to read certificate record:", error)
      return NextResponse.json(
        { error: "Certificate could not be loaded." },
        { status: 503 }
      )
    }

    if (!certificate?.storage_path) {
      return NextResponse.json(
        { error: "No certificate document is stored for this record." },
        { status: 404 }
      )
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(CERTIFICATE_BUCKET)
      .createSignedUrl(certificate.storage_path, SIGNED_URL_TTL_SECONDS)

    if (signError || !signed?.signedUrl) {
      console.error("Unable to sign certificate download URL:", signError)
      return NextResponse.json(
        { error: "Certificate document could not be prepared." },
        { status: 503 }
      )
    }

    return NextResponse.redirect(signed.signedUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error: unknown) {
    console.error("Certificate download error:", error)
    return NextResponse.json(
      { error: "Certificate document could not be prepared." },
      { status: 500 }
    )
  }
}