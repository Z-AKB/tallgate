import { requireUser } from "@/lib/auth/guards"
import ServicesInquiryForm from "@/app/(dashboard)/dashboard/services/ServicesInquiryForm"

export const metadata = {
  title: "Enterprise Services | TallGate Portal",
  description: "Request information about TallGate enterprise software, cloud, and cybersecurity services.",
}

export default async function UserServicesPage() {
  const user = await requireUser()

  const contact = {
    fullName: user.profile?.full_name || user.email || "Portal User",
    email: user.email || user.profile?.email || "",
    phone: user.profile?.phone || "",
  }

  return <ServicesInquiryForm contact={contact} />
}
