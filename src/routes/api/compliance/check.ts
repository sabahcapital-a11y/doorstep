import { createFileRoute } from "@tanstack/react-router";
import { screenResponse } from "~/lib/compliance";

/**
 * POST /api/compliance/check
 *
 * Standalone compliance screening endpoint.
 * Takes raw message text and returns pass/fail with reasoning.
 * Useful for manual testing, self-tests, and admin review.
 *
 * Body: { text: string }
 */
export const Route = createFileRoute("/api/compliance/check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { text: string };

          if (!body.text || typeof body.text !== "string") {
            return Response.json(
              { error: "Missing required field: text (string)" },
              { status: 400 },
            );
          }

          const result = await screenResponse(body.text);

          return Response.json({
            passed: result.passed,
            flags: result.flags,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
