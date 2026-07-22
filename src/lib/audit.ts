import { sql } from "~/db";
import type { AuditLogRecord } from "./types";

/**
 * Write a compliance check result to the audit_log table.
 *
 * @param messageId - The message being audited.
 * @param checkType - Type of compliance check performed.
 * @param passed - Whether the check passed.
 * @param flaggedReason - Why the check failed (null if passed).
 * @param reviewer - Who performed the review ("ai" or "human").
 */
export async function logAuditEntry(
  messageId: string,
  checkType: AuditLogRecord["check_type"],
  passed: boolean,
  flaggedReason: string | null,
  reviewer: AuditLogRecord["reviewer"] = "ai",
): Promise<void> {
  await sql()`INSERT INTO audit_log (message_id, check_type, passed, flagged_reason, reviewer)
    VALUES (${messageId}, ${checkType}, ${passed}, ${flaggedReason ?? null}, ${reviewer})`;
}

/**
 * Retrieve the audit trail for a specific message.
 */
export async function getAuditTrail(
  messageId: string,
): Promise<AuditLogRecord[]> {
  const rows = await sql()`SELECT id, message_id, check_type, passed, flagged_reason, reviewer, created_at
    FROM audit_log
    WHERE message_id = ${messageId}
    ORDER BY created_at DESC`;

  return rows.map((r) => ({
    ...r,
    created_at: String(r.created_at),
  })) as AuditLogRecord[];
}
