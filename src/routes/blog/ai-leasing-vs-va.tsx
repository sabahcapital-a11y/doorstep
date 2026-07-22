import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/ai-leasing-vs-va")({
  component: Post,
});

function Post() {
  return (
    <div className="min-h-dvh bg-white text-gray-800">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-bold tracking-tight text-[#1a3355]">
            Doorstep AI
          </a>
          <a href="/blog" className="text-sm text-gray-500 hover:text-[#1a3355]">
            &larr; All posts
          </a>
        </div>
      </nav>

      {/* ── Article ── */}
      <article className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm text-gray-400">July 15, 2026</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            AI Leasing Assistant vs. Hiring a VA: The Real Cost for a 50-Unit
            Portfolio
          </h1>

          <div className="mt-10 space-y-6 leading-relaxed text-gray-700">
            <p>
              If you manage 50 units, your inbox probably looks familiar:
              leasing inquiries asking about availability and pet policies,
              residents forwarding maintenance requests, and the occasional
              &ldquo;did you receive my rent?&rdquo; question. Most property
              managers spend 2&ndash;3 hours a day just triaging email.
            </p>

            <p>
              The natural next step is hiring help. But the market for leasing
              support splits into two very different paths — and the cost
              gap might surprise you. Let&rsquo;s break it down for a
              50-unit portfolio.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              Option 1: Offshore Virtual Assistant — $1,200&ndash;$2,500/mo
            </h2>

            <p>
              Offshore VAs are the cheapest human option. You can find
              English-speaking assistants in the Philippines or India for
              $6&ndash;$12/hour. At 20&ndash;25 hours/week of email coverage,
              that lands somewhere between $1,200 and $2,500 per month.
            </p>

            <p>
              But the hidden costs stack up fast: training on your properties
              and policies takes weeks, turnover is high (many VAs last less
              than six months), and timezone gaps mean overnight emails sit
              unanswered. And here&rsquo;s the big one — no offshore VA is
              trained in US fair housing law. If they say the wrong thing to a
              prospect about &ldquo;great schools&rdquo; or &ldquo;perfect for
              a young couple,&rdquo; you&rsquo;re the one facing a HUD
              complaint.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              Option 2: US-Based VA — $2,500&ndash;$4,500/mo
            </h2>

            <p>
              A US-based leasing assistant runs $15&ndash;$25/hour. For
              part-time inbox coverage (20&ndash;25 hours/week), you&rsquo;re
              looking at $2,500&ndash;$4,500 per month — and that&rsquo;s
              before benefits, payroll taxes, or any management overhead.
            </p>

            <p>
              The upside: better availability during US business hours and
              (hopefully) some baseline familiarity with fair housing. But
              they still get sick, take vacation, and occasionally quit without
              notice. There&rsquo;s no compliance audit trail — you
              don&rsquo;t know what they&rsquo;re saying unless you read every
              email yourself.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              Option 3: Doorstep AI — $897/mo for 50 Units
            </h2>

            <p>
              Doorstep AI costs $497/mo base + $8/unit. For a 50-unit
              portfolio, that&rsquo;s $897/month — no per-email fees, no
              contracts. Less than half the price of an offshore VA and a
              fraction of a US-based hire.
            </p>

            <p>But the cost savings are just the beginning:</p>

            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>24/7 coverage.</strong> Inquiries answered within
                minutes, not hours — even at 2 AM on a Saturday.
              </li>
              <li>
                <strong>Compliance screening.</strong> Every leasing response is
                reviewed for fair housing compliance <em>before</em> it goes
                out. No human VA offers this &mdash; and you can&rsquo;t audit
                what a human said after the fact.
              </li>
              <li>
                <strong>Weekly audit trail.</strong> You get a digest with
                escalations and a compliance sample. Full transparency, under
                one hour/week of your time.
              </li>
              <li>
                <strong>Zero turnover.</strong> No hiring, no training, no
                &ldquo;my VA quit after three weeks.&rdquo;
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              The Bottom Line
            </h2>

            <p>
              At 50 units, hiring a human to manage your leasing inbox costs
              $1,200&ndash;$4,500/mo and leaves compliance entirely to chance.
              Doorstep AI does it for $897/mo with pre-send screening built in,
              a weekly audit trail, and zero management overhead. If compliance
              and cost matter to your operation, the math is hard to ignore.
            </p>

            <p>
              <a
                href="/#pricing"
                className="font-medium text-[#c8842c] hover:underline"
              >
                See our pricing &rarr;
              </a>
            </p>
          </div>
        </div>
      </article>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="text-lg font-semibold text-[#1a3355]">
            Ready to stop paying for turnover?
          </h3>
          <p className="mt-2 text-gray-600">
            Doorstep AI handles leasing@, info@, and residents@ — fully
            managed, starting at $497/mo.
          </p>
          <a
            href="/#pricing"
            className="mt-4 inline-block rounded-xl bg-[#c8842c] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#b07525]"
          >
            View Plans
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Doorstep AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
