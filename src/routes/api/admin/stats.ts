import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

interface DashboardStats {
  total_messages: number;
  pending_messages: number;
  drafted_messages: number;
  approved_messages: number;
  escalated_messages: number;
  escalation_count: number;
  compliance_pass_rate: number | null;
  latest_self_test: {
    test_date: string | null;
    total: number;
    passed: number;
    failed: number;
  } | null;
}

/**
 * GET /api/admin/stats
 *
 * Returns aggregate dashboard statistics for the Doorstep AI pipeline:
 * - Message counts by status
 * - Pending escalation count
 * - Compliance pass rate (last 30 days)
 */
export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Message counts by status
          const statusCounts = await sql()`SELECT status, COUNT(*)::int as count
            FROM messages
            GROUP BY status`;

          const counts: Record<string, number> = {};
          for (const row of statusCounts) {
            counts[row.status as string] = row.count as number;
          }

          // Pending escalations
          const escalationResult = await sql()`SELECT COUNT(*)::int as count
            FROM escalations
            WHERE status = 'pending'`;

          const escalationCount = escalationResult[0].count as number;

          // Compliance pass rate (last 30 days)
          const complianceResult = await sql()`SELECT
            COUNT(*) FILTER (WHERE passed = true)::int as passed_count,
            COUNT(*)::int as total_count
            FROM audit_log
            WHERE check_type = 'fair_housing'
              AND created_at > now() - INTERVAL '30 days'`;

          const passedCount = complianceResult[0].passed_count as number;
          const totalCount = complianceResult[0].total_count as number;
          const compliancePassRate =
            totalCount > 0
              ? Math.round((passedCount / totalCount) * 10000) / 100
              : null;

          // Latest self-test summary
          const latestTest =
            await sql()`SELECT test_date, passed
              FROM compliance_self_tests
              WHERE test_date = (
                SELECT MAX(test_date) FROM compliance_self_tests
              )
              ORDER BY created_at DESC`;

          let latestSelfTest: DashboardStats["latest_self_test"] = null;
          if (latestTest.length > 0) {
            const total = latestTest.length;
            const passed = latestTest.filter(
              (r: Record<string, unknown>) => r.passed,
            ).length;
            const testDate = String(latestTest[0].test_date);
            latestSelfTest = {
              test_date: testDate,
              total,
              passed,
              failed: total - passed,
            };
          }

          const stats: DashboardStats = {
            total_messages:
              Object.values(counts).reduce((a, b) => a + b, 0) || 0,
            pending_messages: counts.pending || 0,
            drafted_messages: counts.ai_drafted || 0,
            approved_messages: counts.compliance_approved || 0,
            escalated_messages: counts.escalated || 0,
            escalation_count: escalationCount,
            compliance_pass_rate: compliancePassRate,
            latest_self_test: latestSelfTest,
          };

          return Response.json(stats);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal server error";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
