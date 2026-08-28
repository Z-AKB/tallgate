import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "User management" };

export default function AdminUsersPage() {
  return (
    <ComingSoon
      title="User management"
      description="Management tooling for User management ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
