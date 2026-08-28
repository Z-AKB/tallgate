import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="h3 fw-bold text-navy mb-1">Admin dashboard</h1>
      <p className="text-muted-tg mb-4">
        Unified counts across users, content, and the inquiry queue (FR-18,
        FR-19) render here once real data exists.
      </p>
      <div className="row g-3">
        {["Learners", "Enrollments", "Completions", "Open inquiries"].map(
          (label) => (
            <div key={label} className="col-6 col-lg-3">
              <div className="card border p-3">
                <p className="text-muted-tg small mb-1">{label}</p>
                <p className="h4 fw-bold text-navy mb-0">—</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
