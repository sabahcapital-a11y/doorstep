/** Shared types for the Doorstep AI email pipeline. */

export interface ClientRecord {
  id: string;
  name: string;
  contact_email: string;
  tier: "starter" | "professional" | "enterprise";
  onboarding_status: "pending" | "in_progress" | "active" | "suspended";
  created_at: string;
}

export interface PropertyRecord {
  id: string;
  client_id: string;
  name: string;
  address: string;
  unit_count: number;
  created_at: string;
}

export interface InboxRecord {
  id: string;
  client_id: string;
  email_address: string;
  inbox_type: "leasing" | "info" | "residents" | "billing";
  connection_status: "pending" | "connected" | "error" | "disconnected";
  created_at: string;
}

export type MessageStatus =
  | "pending"
  | "ai_drafted"
  | "compliance_approved"
  | "sent"
  | "escalated"
  | "rejected";

export interface MessageRecord {
  id: string;
  inbox_id: string;
  direction: "inbound" | "outbound";
  from_address: string;
  to_address: string;
  subject: string | null;
  body_text: string;
  thread_id: string | null;
  status: MessageStatus;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  message_id: string;
  check_type: "fair_housing" | "fdpa" | "can_spam";
  passed: boolean;
  flagged_reason: string | null;
  reviewer: "ai" | "human";
  created_at: string;
}

export type EscalationReason =
  | "legal_notice"
  | "payment_dispute"
  | "eviction"
  | "elder_welfare"
  | "other";

export interface EscalationRecord {
  id: string;
  message_id: string;
  client_id: string;
  reason: EscalationReason;
  status: "pending" | "resolved";
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ComplianceSelfTestRecord {
  id: string;
  test_date: string;
  protected_class: string;
  inquiry_pair: Record<string, unknown>;
  response_pair: Record<string, unknown>;
  passed: boolean;
  created_at: string;
}

/** Context passed into AI drafting for grounding. */
export interface DraftContext {
  clientName: string;
  propertyName?: string;
  propertyAddress?: string;
  inboxType: InboxRecord["inbox_type"];
}

/** Result from compliance screening. */
export interface ComplianceResult {
  passed: boolean;
  flags: string[];
}

/** Parsed inbound email from webhook. */
export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  threadId?: string;
}
