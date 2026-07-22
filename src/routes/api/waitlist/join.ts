import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

/**
 * POST /api/waitlist/join
 *
 * Accepts an email address and adds it to the waitlist.
 * Returns 409 if the email is already registered.
 */
export const Route = createFileRoute("/api/waitlist/join")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { email?: string };
          const email = body.email?.trim().toLowerCase();

          if (!email) {
            return Response.json(
              { error: "Email is required" },
              { status: 400 },
            );
          }

          // Basic email validation
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(email)) {
            return Response.json(
              { error: "Please enter a valid email address" },
              { status: 400 },
            );
          }

          // Check for duplicates
          const existing =
            await sql()`SELECT id FROM waitlist WHERE email = ${email} LIMIT 1`;
          if (existing.length > 0) {
            return Response.json(
              { error: "This email is already on the waitlist" },
              { status: 409 },
            );
          }

          await sql()`INSERT INTO waitlist (email, source) VALUES (${email}, 'website')`;

          return Response.json({ success: true });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
