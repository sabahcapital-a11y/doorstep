import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/outreach")({
  component: OutreachPage,
});

const SITE_URL = "https://site-xi-neon.vercel.app";
const STARTER_LINK = "https://buy.stripe.com/cNi4gBfDB7W6aUX3wh67S00";
const PRO_LINK = "https://buy.stripe.com/eVq8wR1ML90aaUXd6R67S01";

const templates = [
  {
    label: "Template A — The Inbox Pain",
    subject: "Quick question about your leasing inbox",
    body: `Hi [Name],

Quick question — are you still handling your leasing emails manually?

I know how it goes: leasing@ fills up with the same questions over and over, residents@ gets maintenance requests at all hours, and info@ piles up with stuff that should have been answered yesterday.

We built Doorstep AI to handle all three inboxes — leasing@, info@, residents@ — fully managed, email-only, no software to learn. You forward or connect your addresses, our AI agents take over, and you get a weekly digest of escalations plus a fair-housing audit sample. Under an hour of your time per week.

It starts at $497/mo. If you're curious, happy to walk through how it works for your portfolio.

Best,
[Your name]`,
  },
  {
    label: "Template B — The VA Comparison",
    subject: "Cheaper than a VA, more reliable than an intern",
    body: `Hi [Name],

If you've looked into hiring a virtual assistant to handle your leasing and resident emails, you've probably seen the numbers:

• Offshore VA: $1,200–2,500/mo
• US-based VA: $2,500–4,500/mo  
• Doorstep AI: $497–897/mo (for a typical 50-unit portfolio)

And it's not just price. VAs get sick, quit, or ghost you at the worst possible moment. Interns need training and turnover is constant.

Doorstep AI runs 24/7. Every leasing response is screened for fair housing compliance before it goes out. You get a weekly audit trail showing exactly what was sent and whether it passed review. No surprises, no sick days, no turnover.

We handle leasing@, info@, and residents@ — you get back 10-15 hours a week.

Check it out: ${SITE_URL}
Starter plans: ${STARTER_LINK}

Best,
[Your name]`,
  },
  {
    label: "Template C — The Compliance Angle",
    subject: "Fair housing compliance for your leasing email",
    body: `Hi [Name],

Here's something most property managers don't realize: fair housing organizations now run automated tests against leasing bots and email responses. They send paired inquiries — one with a "protected class" signal, one without — and compare the responses.

If your replies show disparate treatment, the fines can exceed $100,000 for repeat violations. And here's the kicker — under HUD guidance, you're liable for what your AI (or your VA, or your leasing agent) says in those emails, not the vendor who built the tool.

That's why we built Doorstep AI with compliance as the core feature, not an afterthought:

• Every outbound leasing response is screened for fair housing compliance before it's sent
• We run weekly protected-class self-tests against our own agents
• You get the full audit trail in your weekly digest — nothing is hidden

It's fully managed, email-only, starts at $497/mo. If compliance keeps you up at night, let's talk.

${SITE_URL}

Best,
[Your name]`,
  },
];

function OutreachPage() {
  return (
    <div className="min-h-dvh bg-white text-gray-800">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-bold tracking-tight text-[#1a3355]">
            Doorstep AI
          </a>
          <span className="text-sm text-gray-400">Outreach Templates</span>
        </div>
      </nav>

      {/* ── Header ── */}
      <section className="bg-[#1a3355] py-16 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cold Outreach Templates
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Copy, personalize, and send to property managers in your pipeline.
          </p>
        </div>
      </section>

      {/* ── Templates ── */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl space-y-12 px-6">
          {templates.map((t) => (
            <div
              key={t.label}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-[#1a3355]">
                {t.label}
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Subject
                  </p>
                  <p className="mt-1 rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-700">
                    {t.subject}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(t.subject)}
                    className="mt-2 text-xs text-[#c8842c] hover:underline"
                  >
                    Copy subject
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Body
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-700">
                    {t.body}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(t.body)}
                    className="mt-2 text-xs text-[#c8842c] hover:underline"
                  >
                    Copy body
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="text-lg font-semibold text-[#1a3355]">Quick Links</h3>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a
              href={SITE_URL}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#1a3355] hover:text-[#1a3355]"
            >
              Doorstep AI Website
            </a>
            <a
              href={STARTER_LINK}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#1a3355] hover:text-[#1a3355]"
            >
              Starter Checkout ($497/mo)
            </a>
            <a
              href={PRO_LINK}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:border-[#1a3355] hover:text-[#1a3355]"
            >
              Professional Checkout ($1,497/mo)
            </a>
          </div>
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
