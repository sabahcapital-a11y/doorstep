import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/fair-housing-ai")({
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
          <p className="text-sm text-gray-400">July 10, 2026</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            Fair Housing Compliance for AI Leasing: What Property Managers Need
            to Know
          </h1>

          <div className="mt-10 space-y-6 leading-relaxed text-gray-700">
            <p>
              If you&rsquo;re using AI to respond to leasing inquiries —
              or thinking about it — there&rsquo;s something you need to
              know: fair housing organizations are already running automated
              tests against leasing chatbots and email responders. And
              they&rsquo;re finding violations.
            </p>

            <p>
              The method is straightforward. Testers send paired inquiries: one
              from a &ldquo;protected class&rdquo; profile and one from a
              control. They compare the responses. If the AI treats the
              protected-class inquiry differently — different tone,
              different availability, different follow-up — that&rsquo;s
              evidence of disparate treatment under the Fair Housing Act.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              You&rsquo;re Liable, Not the Vendor
            </h2>

            <p>
              HUD guidance is clear on this point: the property manager is
              responsible for the behavior of their AI tools, not the vendor who
              built them. If your leasing bot tells a tester with a Spanish
              surname that &ldquo;units go fast, apply now&rdquo; but tells a
              control tester &ldquo;happy to schedule a tour at your
              convenience,&rdquo; you&rsquo;re on the hook — even if you
              didn&rsquo;t write a single line of code.
            </p>

            <p>
              The same applies to human assistants, by the way. The difference
              is that AI responses are auditable — every word is logged.
              And that audit trail cuts both ways: it can protect you if your
              responses are consistently fair, or bury you if they&rsquo;re not.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              The Stakes Are High
            </h2>

            <p>
              Fair housing fines are not abstract. For repeat violations, the
              Department of Justice can seek penalties exceeding <strong>$100,000</strong>.
              Private lawsuits add legal fees, settlements, and reputational
              damage on top of that. And once you&rsquo;re on the radar of a
              fair housing testing organization, every interaction gets
              scrutinized — for years.
            </p>

            <p>
              This isn&rsquo;t theoretical. Several high-profile cases in
              2024&ndash;2025 involved AI chatbots that steered prospects toward
              or away from certain neighborhoods based on inferred demographic
              signals. The property managers were held responsible, not the AI
              vendors.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              How Doorstep AI Approaches Compliance
            </h2>

            <p>
              We built Doorstep AI with compliance as the core feature, not an
              afterthought. Here&rsquo;s how it works:
            </p>

            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong>Pre-send screening.</strong> Every outbound leasing
                response passes through a fair housing compliance check before
                delivery. If the response contains problematic language —
                steering, discouraging, disparate tone — it&rsquo;s flagged
                and held for human review. Nothing goes out that
                doesn&rsquo;t pass.
              </li>
              <li>
                <strong>Weekly self-testing.</strong> We run protected-class
                audit pairs against our own agents every week. Think of it as
                running the same tests the fair housing orgs run — but we do
                it ourselves, catch issues internally, and fix them before they
                reach a real prospect.
              </li>
              <li>
                <strong>Full transparency.</strong> Every week, you get a digest
                with a compliance audit sample. You see what was flagged, what
                was approved, and why. No black-box AI making decisions
                you can&rsquo;t review.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              What You Can Do Right Now
            </h2>

            <p>
              If you&rsquo;re already using AI for leasing — or a VA, or
              even just email templates — audit your outbound responses. Send
              test inquiries from different profiles and compare what comes
              back. Look for differences in tone, urgency, availability, and
              property recommendations. The patterns that emerge might surprise
              you.
            </p>

            <p>
              Or, use a tool that does this automatically. Doorstep AI starts at
              $497/mo, handles leasing@, info@, and residents@, and screens
              every response before it reaches a prospect. If compliance keeps
              you up at night, we built this to help you sleep.
            </p>

            <p>
              <a
                href="/#pricing"
                className="font-medium text-[#c8842c] hover:underline"
              >
                Learn more about our compliance-first approach &rarr;
              </a>
            </p>
          </div>
        </div>
      </article>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="text-lg font-semibold text-[#1a3355]">
            Don&rsquo;t wait for a fair housing tester to find you.
          </h3>
          <p className="mt-2 text-gray-600">
            Every Doorstep AI response is screened before it&rsquo;s sent.
            Weekly self-tests keep you ahead of the curve.
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
