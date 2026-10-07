/**
 * Roles are stored in `user_roles`, with the database enforcing one role per
 * user. Changing a role replaces the existing row.
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
