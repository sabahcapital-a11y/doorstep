-- Doorstep AI: Initial Schema
-- Run manually against your Neon database after connecting DATABASE_URL:
--   psql "$DATABASE_URL" -f src/db/migrations/001_initial.sql
-- Or pipe via the Neon SQL editor.

-- ── Clients ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'enterprise')),
  onboarding_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending', 'in_progress', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Properties ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  unit_count INTEGER NOT NULL DEFAULT 0
    CHECK (unit_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Inboxes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  inbox_type TEXT NOT NULL
    CHECK (inbox_type IN ('leasing', 'info', 'residents', 'billing')),
  connection_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (connection_status IN ('pending', 'connected', 'error', 'disconnected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT,
  body_text TEXT NOT NULL,
  thread_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'ai_drafted', 'compliance_approved',
      'sent', 'escalated', 'rejected'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Audit Log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL
    CHECK (check_type IN ('fair_housing', 'fdpa', 'can_spam')),
  passed BOOLEAN NOT NULL,
  flagged_reason TEXT,
  reviewer TEXT NOT NULL CHECK (reviewer IN ('ai', 'human')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Escalations ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reason TEXT NOT NULL
    CHECK (reason IN (
      'legal_notice', 'payment_dispute', 'eviction',
      'elder_welfare', 'other'
    )),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ── Compliance Self-Tests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compliance_self_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  protected_class TEXT NOT NULL,
  inquiry_pair JSONB NOT NULL DEFAULT '{}',
  response_pair JSONB NOT NULL DEFAULT '{}',
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_client ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_inboxes_client ON inboxes(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_inbox ON messages(inbox_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_message ON audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_escalations_client ON escalations(client_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_tests_date ON compliance_self_tests(test_date);
