import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardOverviewPage() {
  return (
    <div>
      <h1 className="h3 fw-bold text-navy mb-1">Overview</h1>
      <p className="text-muted-tg mb-4">
        Widgets here vary by your role(s) — Learner progress, Founder
        application status, or Business inquiry history.
      </p>
      <div className="card border p-4">
        <p className="text-muted-tg mb-0">
          Role-specific widgets are built out as each milestone ships
          (Learning Hub, then Startup Hub, per the roadmap).
        </p>
      </div>
    </div>
  );
}
