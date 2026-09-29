export function uniqueRoles(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((role): role is string => Boolean(role))))
}

export async function fetchCurrentRoleNames(supabase: {
  from: (table: string) => any
}): Promise<string[]> {
  const selects = ["role, role_id, roles(name)", "role_id, roles(name)", "role"]

  for (const select of selects) {
    const { data, error } = await supabase.from("user_roles").select(select)
    if (!error && data) {
      return uniqueRoles(data.flatMap((row: any) => [row.role, row.roles?.name]))
    }
  }

  return []
}
