/**
 * Upper bound on rows fetched for any single admin list query. Admin tables are
 * paginated client-side (see components/admin/Pagination.tsx); this cap keeps a
 * runaway table from streaming an unbounded result set into a server render.
 * When a table legitimately exceeds this, the owning page surfaces a notice.
 */
export const ADMIN_QUERY_LIMIT = 500
