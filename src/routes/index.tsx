import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { readFile } from "node:fs/promises";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (res.ok && data.success) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="bg-[#1a3355] py-24 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Not Ready Yet?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-300">
            Join our waitlist and we&rsquo;ll keep you in the loop — no spam,
            just updates on when we launch new features.
          </p>

          {status === "success" ? (
            <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4">
              <p className="text-lg font-semibold text-green-300">
                You&rsquo;re on the list! We&rsquo;ll be in touch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="mx-auto flex max-w-md gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 rounded-xl border border-gray-600 bg-white/10 px-4 py-3 text-white placeholder-gray-400 backdrop-blur transition-colors focus:border-[#c8842c] focus:outline-none focus:ring-1 focus:ring-[#c8842c]"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-xl bg-[#c8842c] px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-[#b07525] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Joining…" : "Join the Waitlist"}
                </button>
              </div>
              {status === "error" && (
                <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const businessName = Route.useLoaderData() || "Doorstep AI";

  return (
    <div className="min-h-dvh bg-white text-gray-800">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-[#1a3355]">
            {businessName}
          </span>
          <a
            href="#pricing"
            className="rounded-lg bg-[#1a3355] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#142b47]"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-[#1a3355] sm:text-5xl lg:text-6xl">
          The AI Front Office for Your Properties.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          We handle leasing@, info@, and residents@ &mdash; so you don&rsquo;t
          have to. Fully managed, email-only, no software to learn.
        </p>
        <div className="mt-10">
          <a
            href="#pricing"
            className="inline-block rounded-xl bg-[#c8842c] px-8 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#b07525]"
          >
            View Pricing
          </a>
          <p className="mt-3 text-sm text-gray-400">
            Email us. We&rsquo;ll respond within one business day.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
            Three steps. Under one hour of your time per week.
          </p>

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Forward Your Inbox",
                body: "Connect or forward your leasing@, info@, and residents@ addresses. No new software, no dashboards — just email.",
              },
              {
                step: "2",
                title: "Our AI Agents Handle It",
                body: "Every message gets a professional, context-aware response — leasing inquiries, maintenance requests, billing questions, all of it.",
              },
              {
                step: "3",
                title: "You Review the Digest",
                body: "Once a week, get a concise digest of escalations and a fair-housing audit sample for your approval. That's it.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3355] text-xl font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#1a3355]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-gray-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Handle ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            What We Handle
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
            Workflows launch in risk order — lowest liability first, then we
            expand as trust is earned.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Leasing & Inquiry Response",
                items: [
                  "Answer questions about units",
                  "Share availability & pricing",
                  "Schedule tours & follow up",
                  "Fair-housing screened every time",
                ],
              },
              {
                title: "Resident Support",
                items: [
                  "Route maintenance requests",
                  "Answer general questions",
                  "Handle complaints professionally",
                  "Escalate urgent issues to you",
                ],
              },
              {
                title: "Billing & Renewals",
                items: [
                  "Payment reminders",
                  "Past-due notices",
                  "Lease renewal outreach",
                  "Enabled last, after track record",
                ],
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-8"
              >
                <h3 className="text-lg font-semibold text-[#1a3355]">
                  {card.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {card.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c8842c]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
            Simple, predictable pricing. No per-email fees. No hidden costs.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {/* Starter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-[#1a3355]">Starter</h3>
              <p className="mt-1 text-sm text-gray-500">1&ndash;50 units</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-[#1a3355]">$497</span>
                <span className="text-gray-500">/mo base</span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-semibold text-[#1a3355]">+ $8</span>
                <span className="text-gray-500">/unit/mo</span>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Leasing & inquiry response",
                  "Resident support",
                  "Weekly digest & audit sample",
                  "Email-based, no software",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c8842c]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/cNi4gBfDB7W6aUX3wh67S00"
                className="mt-8 inline-block w-full rounded-xl bg-[#c8842c] px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#b07525]"
              >
                Get Started
              </a>
            </div>

            {/* Professional */}
            <div className="rounded-2xl border-2 border-[#1a3355] bg-white p-8 shadow-lg">
              <span className="inline-block rounded-full bg-[#1a3355] px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
              <h3 className="mt-3 text-xl font-semibold text-[#1a3355]">
                Professional
              </h3>
              <p className="mt-1 text-sm text-gray-500">51&ndash;250 units</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-[#1a3355]">
                  $1,497
                </span>
                <span className="text-gray-500">/mo base</span>
              </div>
              <div className="mt-1">
                <span className="text-xl font-semibold text-[#1a3355]">+ $6</span>
                <span className="text-gray-500">/unit/mo</span>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Everything in Starter",
                  "Billing & renewal workflows",
                  "Priority escalation handling",
                  "Dedicated compliance SLA",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c8842c]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/eVq8wR1ML90aaUXd6R67S01"
                className="mt-8 inline-block w-full rounded-xl bg-[#c8842c] px-5 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#b07525]"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-[#1a3355]">Enterprise</h3>
              <p className="mt-1 text-sm text-gray-500">250+ units, custom needs</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-[#1a3355]">Custom</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Dedicated compliance SLA, custom audit reporting, and tailored
                workflows for larger portfolios and multi-site operators.
              </p>
              <a
                href="mailto:hello@doorstep.ai"
                className="mt-6 inline-block rounded-lg border border-[#1a3355] px-5 py-2.5 text-sm font-semibold text-[#1a3355] transition-colors hover:bg-[#1a3355] hover:text-white"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compliance-First ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-[#c8842c]">
              Why We&rsquo;re Different
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
              Compliance-First, by Design
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Every leasing response is screened for fair housing compliance{" "}
              <strong>before</strong> it&rsquo;s sent. We run weekly
              protected-class self-tests to catch bias before it ever reaches a
              prospect. If it doesn&rsquo;t pass, it doesn&rsquo;t go out.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Property managers trust us because we treat compliance as a
              feature, not an afterthought. You get a fair-housing audit sample
              in every weekly digest — full visibility, no surprises.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Pre-Send Screening",
                body: "Every outbound leasing response is reviewed for fair housing compliance before delivery.",
              },
              {
                title: "Weekly Self-Testing",
                body: "Protected-class audit pairs test our agents every week. Results are shared in your digest.",
              },
              {
                title: "Full Transparency",
                body: "You see exactly what was flagged and why. No black-box AI making decisions you can't audit.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                  <svg
                    className="h-7 w-7 text-[#c8842c]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#1a3355]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-gray-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who It's For ── */}
      <section className="bg-[#1a3355] py-24 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Who It&rsquo;s For
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-300">
              Built for independent property managers (1&ndash;250 units),
              landlords, and single-site senior living communities. The
              operators who don&rsquo;t have an IT department — and
              don&rsquo;t want one.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-300">
              If you&rsquo;re spending evenings answering the same leasing
              emails and forwarding maintenance requests by hand, we built this
              for you. No software to learn, no dashboards to check — just
              forward your inbox and get your time back.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a3355] sm:text-4xl">
            Ready to Reclaim Your Inbox?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            For Enterprise plans or questions about your portfolio.
          </p>
          <div className="mt-10">
            <a
              href="mailto:hello@doorstep.ai"
              className="inline-block rounded-xl bg-[#c8842c] px-8 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#b07525]"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* ── Waitlist ── */}
      <WaitlistSection />

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          <div className="flex justify-center gap-6">
            <a href="/blog" className="hover:text-[#1a3355] transition-colors">
              Blog
            </a>
          </div>
          <div className="mt-4">
            &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
