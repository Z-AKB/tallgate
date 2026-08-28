/**
 * User roles — backed by a `user_roles` JOIN TABLE in Postgres, not a single
 * enum column on `profiles`. This supports multi-role users (e.g. a Learner
 * who is also a Startup Founder) without a schema migration later.
 *
 * MVP ships a single `admin` role with full access (see
 * tallgate-open-items-resolution.md, Section 1) — sub-role scoping is
 * deferred until admin headcount grows past a handful of people.
 */
export type UserRole =
  | "visitor"
  | "learner"
  | "instructor"
  | "founder"
  | "admin";

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  created_at: string;
}
