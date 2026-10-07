import { redirect } from "next/navigation";
import { createClient } from "@/lib/database/server";
import { requireUser } from "./requireUser";

/** Checks the user's single role in the `user_roles` table. */
export async function requireAdmin(nextPath: string) {
  const user = await requireUser(nextPath);
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.roles?.name !== "admin") {
    redirect("/dashboard");
  }

  return user;
}
