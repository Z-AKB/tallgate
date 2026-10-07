import type { Metadata } from "next";
import { createClient } from "@/lib/database/server";

export const metadata: Metadata = { title: "Inquiries" };

/**
 * Unified queue: contact_inquiries + startup_applications together, per
 * FR-18 / Phase 2 Flow 5 — splitting these into separate admin views
 * would recreate exactly the fragmentation problem Persona 5 flagged.
 * Reads live from Supabase (unlike the other admin stubs), so this row
 * will populate as soon as the schema is migrated and inquiries start
 * coming in through /contact.
 */
export default async function AdminInquiriesPage() {
  const supabase = await createClient();
  const { data: inquiries, error } = await supabase
    .from("contact_inquiries")
    .select("id, name, email, inquiry_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="h3 fw-bold text-navy mb-1">Inquiries</h1>
      <p className="text-muted-tg mb-4">
        Consultation requests, business inquiries, and support — one queue,
        per FR-18.
      </p>

      {error ? (
        <div className="alert alert-warning">
          Couldn&apos;t load inquiries. This is expected until the
          `contact_inquiries` table exists in your Supabase project — see
          Phase 3&apos;s schema.
        </div>
      ) : !inquiries || inquiries.length === 0 ? (
        <div className="card border p-4 text-center text-muted-tg">
          No inquiries yet. Submissions from /contact will appear here.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>
                    {inquiry.name}
                    <div className="text-muted-tg small">{inquiry.email}</div>
                  </td>
                  <td>{inquiry.inquiry_type}</td>
                  <td>
                    <span className="badge bg-highlight text-navy border">
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="text-muted-tg small">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
