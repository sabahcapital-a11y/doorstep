import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import type { ParsedEmail, InboxRecord } from "~/lib/types";

/**
 * POST /api/webhook/inbound
 *
 * Receives inbound email from the email service webhook.
 * Expects a JSON body with { from, to, subject, bodyText, threadId? }.
 * Looks up the inbox by the "to" address, stores the message,
 * and returns the message ID for downstream pipeline processing.
 */
export const Route = createFileRoute("/api/webhook/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as ParsedEmail;

          if (!body.from || !body.to || !body.bodyText) {
            return Response.json(
              { error: "Missing required fields: from, to, bodyText" },
              { status: 400 },
            );
          }

          // Find the inbox by the recipient address
          const inboxes = await sql()`SELECT id, client_id, email_address, inbox_type, connection_status, created_at
            FROM inboxes
            WHERE email_address = ${body.to}
              AND connection_status = 'connected'
            LIMIT 1`;

          if (inboxes.length === 0) {
            return Response.json(
              { error: `No connected inbox found for ${body.to}` },
              { status: 404 },
            );
          }

          const inbox = inboxes[0] as InboxRecord;

          // Insert the message
          const inserted = await sql()`INSERT INTO messages (inbox_id, direction, from_address, to_address, subject, body_text, thread_id, status)
            VALUES (${inbox.id}, 'inbound', ${body.from}, ${body.to}, ${body.subject ?? null}, ${body.bodyText}, ${body.threadId ?? null}, 'pending')
            RETURNING id`;

          const messageId = inserted[0].id as string;

          return Response.json(
            {
              message_id: messageId,
              status: "pending",
              inbox_type: inbox.inbox_type,
              client_id: inbox.client_id,
            },
            { status: 201 },
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
