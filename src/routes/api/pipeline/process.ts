import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { draftResponse } from "~/lib/ai";
import { screenResponse } from "~/lib/compliance";
import { logAuditEntry } from "~/lib/audit";
import type {
  MessageRecord,
  InboxRecord,
  ClientRecord,
  PropertyRecord,
  DraftContext,
} from "~/lib/types";

/**
 * POST /api/pipeline/process
 *
 * Runs the full email processing pipeline for a given message:
 * 1. Loads the message and its associated inbox/client/property context.
 * 2. Drafts an AI response using property context for grounding.
 * 3. Screens the draft for fair housing compliance.
 * 4. If passed: marks compliance_approved, returns the draft.
 * 5. If failed: escalates to human review, returns the flags.
 *
 * Body: { message_id: string }
 */
export const Route = createFileRoute("/api/pipeline/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { message_id: string };

          if (!body.message_id) {
            return Response.json(
              { error: "Missing required field: message_id" },
              { status: 400 },
            );
          }

          // 1. Load message
          const messages = await sql()`SELECT id, inbox_id, direction, from_address, to_address, subject, body_text, thread_id, status, created_at
            FROM messages
            WHERE id = ${body.message_id}
              AND direction = 'inbound'
              AND status = 'pending'
            LIMIT 1`;

          if (messages.length === 0) {
            return Response.json(
              {
                error:
                  "Message not found or not in pending inbound state. Only pending inbound messages can be processed.",
              },
              { status: 404 },
            );
          }

          const message = messages[0] as MessageRecord;

          // 2. Load inbox
          const inboxes = await sql()`SELECT id, client_id, email_address, inbox_type, connection_status, created_at
            FROM inboxes
            WHERE id = ${message.inbox_id}
            LIMIT 1`;

          if (inboxes.length === 0) {
            return Response.json(
              { error: "Associated inbox not found." },
              { status: 404 },
            );
          }

          const inbox = inboxes[0] as InboxRecord;

          // 3. Load client
          const clients = await sql()`SELECT id, name, contact_email, tier, onboarding_status, created_at
            FROM clients
            WHERE id = ${inbox.client_id}
            LIMIT 1`;

          if (clients.length === 0) {
            return Response.json(
              { error: "Associated client not found." },
              { status: 404 },
            );
          }

          const client = clients[0] as ClientRecord;

          // 4. Load properties for context
          const properties = await sql()`SELECT id, client_id, name, address, unit_count, created_at
            FROM properties
            WHERE client_id = ${client.id}
            ORDER BY created_at ASC`;

          const primaryProperty = properties[0] as
            | PropertyRecord
            | undefined;

          // 5. Build draft context
          const draftContext: DraftContext = {
            clientName: client.name,
            propertyName: primaryProperty?.name,
            propertyAddress: primaryProperty?.address,
            inboxType: inbox.inbox_type,
          };

          // 6. Draft AI response
          const draftText = await draftResponse(
            message.body_text,
            draftContext,
          );

          // Update message status to ai_drafted
          await sql()`UPDATE messages SET status = 'ai_drafted' WHERE id = ${message.id}`;

          // 7. Run compliance screening
          const compliance = await screenResponse(draftText);

          // 8. Log audit entry
          await logAuditEntry(
            message.id,
            "fair_housing",
            compliance.passed,
            compliance.passed
              ? null
              : compliance.flags.join("; "),
            "ai",
          );

          if (compliance.passed) {
            // Mark as compliance approved
            await sql()`UPDATE messages SET status = 'compliance_approved' WHERE id = ${message.id}`;

            return Response.json({
              message_id: message.id,
              status: "compliance_approved",
              draft_response: draftText,
              compliance: {
                passed: true,
                flags: [],
              },
            });
          }

          // 9. Escalate — create escalation record
          await sql()`INSERT INTO escalations (message_id, client_id, reason, status)
            VALUES (${message.id}, ${client.id}, 'other', 'pending')`;

          await sql()`UPDATE messages SET status = 'escalated' WHERE id = ${message.id}`;

          return Response.json({
            message_id: message.id,
            status: "escalated",
            draft_response: draftText,
            compliance: {
              passed: false,
              flags: compliance.flags,
            },
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
