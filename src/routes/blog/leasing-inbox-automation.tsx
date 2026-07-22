import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/leasing-inbox-automation")({
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
          <p className="text-sm text-gray-400">July 5, 2026</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            I Replaced My Leasing Inbox with AI — Here&rsquo;s What Changed
          </h1>

          <div className="mt-10 space-y-6 leading-relaxed text-gray-700">
            <p>
              <em>
                A property manager&rsquo;s story of going from inbox overload to
                inbox peace of mind.
              </em>
            </p>

            <p>
              I manage 42 units across four properties — nothing massive, but
              enough that my inbox was a second full-time job. Between leasing
              inquiries, resident maintenance requests, and the never-ending
              &ldquo;did my payment go through?&rdquo; emails, I was spending
              2&ndash;3 hours every day just answering messages. Weekends
              included.
            </p>

            <p>
              I tried templates. I tried auto-replies. I briefly considered
              hiring a part-time VA but the math didn&rsquo;t work — $1,500/mo
              minimum for someone who might ghost me in a month. Then I found
              Doorstep AI and decided to take the leap.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              The Setup Took 15 Minutes
            </h2>

            <p>
              I forwarded my three inboxes — leasing@, info@, and
              residents@ — to Doorstep. That was it. No software to install,
              no dashboard to learn, no API keys to copy-paste. Just three email
              forwards and a quick onboarding call where they confirmed my
              property details and tone preferences.
            </p>

            <p>
              By the next morning, leasing inquiries were getting answered with
              availability, pricing, and tour scheduling links — all in a
              professional, friendly tone that actually sounded like someone who
              knew the properties.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              What Changed Immediately
            </h2>

            <p>
              The first thing I noticed was the silence. My phone stopped
              buzzing at 9 PM with &ldquo;Is unit 3B still available?&rdquo;
              emails. I wasn&rsquo;t forwarding maintenance requests at
              breakfast. I checked my inbox and there was just... nothing
              urgent.
            </p>

            <p>
              The second thing: zero missed emails. Before Doorstep,
              I&rsquo;d occasionally lose a prospect because I didn&rsquo;t
              reply fast enough. Now every inquiry gets a response within
              minutes. Tour bookings are up, and I&rsquo;m not the one doing the
              work.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              The Weekly Digest: 30 Minutes, Done
            </h2>

            <p>
              Every Monday morning, I get a digest email. It lists any
              escalations that need my attention — usually one or two items
              like a maintenance emergency or a billing question that went
              beyond the AI&rsquo;s scope. I also get a fair-housing audit
              sample showing that the week&rsquo;s leasing responses passed
              compliance checks.
            </p>

            <p>
              The whole review takes 30 minutes. Compare that to 15+ hours a
              week of hands-on email management, and I&rsquo;m getting back over
              60 hours a month. That&rsquo;s time I now spend on property
              improvements, tenant relationships, and — honestly — not
              working.
            </p>

            <h2 className="text-xl font-semibold text-[#1a3355]">
              What I Didn&rsquo;t Expect: Compliance Peace of Mind
            </h2>

            <p>
              I never worried about fair housing in my emails before because I
              figured &ldquo;I&rsquo;m not biased.&rdquo; But Doorstep
              screens every response before it goes out — and seeing that
              audit sample every week gave me a kind of confidence I
              didn&rsquo;t know I was missing. If a fair housing tester ever
              emails my leasing@ address, I have a complete trail showing
              every response was independently screened.
            </p>

            <p>
              For $497/mo base + $8/unit, I&rsquo;m paying $833/mo to get my
              evenings and weekends back, never miss a lead, and sleep better
              about compliance. That&rsquo;s less than I used to spend on coffee
              and takeout during the late nights I spent catching up on email.
            </p>

            <p>
              <a
                href="/#pricing"
                className="font-medium text-[#c8842c] hover:underline"
              >
                See if Doorstep AI makes sense for your portfolio &rarr;
              </a>
            </p>
          </div>
        </div>
      </article>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h3 className="text-lg font-semibold text-[#1a3355]">
            Ready to get your inbox back?
          </h3>
          <p className="mt-2 text-gray-600">
            Forward your inboxes and start your week with a 30-minute digest
            instead of a 15-hour grind.
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
