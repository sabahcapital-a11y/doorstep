import { createFileRoute } from "@tanstack/react-router";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

const posts: BlogPost[] = [
  {
    slug: "/blog/ai-leasing-vs-va",
    title: "AI Leasing Assistant vs. Hiring a VA: The Real Cost for a 50-Unit Portfolio",
    date: "2026-07-15",
    excerpt:
      "A dollar-for-dollar comparison of Doorstep AI, offshore virtual assistants, and US-based VAs — plus the compliance edge no human can match.",
  },
  {
    slug: "/blog/fair-housing-ai",
    title: "Fair Housing Compliance for AI Leasing: What Property Managers Need to Know",
    date: "2026-07-10",
    excerpt:
      "Fair housing orgs are running automated tests against leasing bots. Here's what the HUD guidance says, what fines look like, and how to stay safe.",
  },
  {
    slug: "/blog/leasing-inbox-automation",
    title: "I Replaced My Leasing Inbox with AI — Here's What Changed",
    date: "2026-07-05",
    excerpt:
      "From 2-3 hours of daily email grind to a 30-minute weekly digest. One property manager's experience going all-in on AI leasing.",
  },
];

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="min-h-dvh bg-white text-gray-800">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-xl font-bold tracking-tight text-[#1a3355]">
            Doorstep AI
          </a>
          <a href="/" className="text-sm text-gray-500 hover:text-[#1a3355]">
            &larr; Back to site
          </a>
        </div>
      </nav>

      {/* ── Header ── */}
      <section className="bg-[#1a3355] py-16 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            The Doorstep AI Blog
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Insights on AI leasing, fair housing compliance, and the future of
            property management.
          </p>
        </div>
      </section>

      {/* ── Post List ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-10 px-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-gray-100 pb-10 last:border-b-0"
            >
              <p className="text-sm text-gray-400">{post.date}</p>
              <h2 className="mt-1">
                <a
                  href={post.slug}
                  className="text-xl font-semibold text-[#1a3355] hover:text-[#c8842c] transition-colors"
                >
                  {post.title}
                </a>
              </h2>
              <p className="mt-3 leading-relaxed text-gray-600">
                {post.excerpt}
              </p>
              <a
                href={post.slug}
                className="mt-3 inline-block text-sm font-medium text-[#c8842c] hover:underline"
              >
                Read more &rarr;
              </a>
            </article>
          ))}
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
