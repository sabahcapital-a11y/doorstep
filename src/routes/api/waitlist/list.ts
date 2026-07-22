import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

/**
 * GET /api/waitlist/list
 *
 * Returns all waitlist signups ordered by most recent first.
 * No auth for now — internal tool only.
 */
export const Route = createFileRoute("/api/waitlist/list")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await sql()`SELECT email, source, created_at
            FROM waitlist
            ORDER BY created_at DESC`;

          const entries = rows.map((r) => ({
            email: r.email as string,
            source: r.source as string,
            created_at: String(r.created_at),
          }));

          return Response.json({ entries });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
