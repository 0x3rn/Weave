import { publicBlog } from "@/lib/public-cms";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Weave Blog",
  description: "Community stories, guides, and updates from Weave.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const p = await searchParams,
    data = await publicBlog(p);
  const url = (page: number) =>
    "/blog?" +
    new URLSearchParams({
      q: p.q || "",
      category: p.category || "",
      page: String(page),
    });
  return (
    <>
      <Header />
      <main className="container max-w-6xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-bold">Stories from Weave</h1>
        <p className="text-muted">
          Guides, community stories, and product updates.
        </p>
        <form action="/blog" className="flex flex-wrap gap-3">
          <input
            name="q"
            aria-label="Search posts"
            placeholder="Search posts…"
            defaultValue={p.q}
            className="border border-border bg-surface rounded-lg p-3"
          />
          <select
            name="category"
            aria-label="Category"
            defaultValue={p.category || ""}
            className="border border-border bg-surface rounded-lg p-3"
          >
            <option value="">All categories</option>
            {data.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="rounded-lg bg-primary text-white px-5">
            Search
          </button>
        </form>
        <div className="grid md:grid-cols-3 gap-6">
          {data.rows.map((post) => (
            <article
              key={String(post.id)}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              {post.featured_image && (
                <img
                  src={String(post.featured_image)}
                  alt=""
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5 space-y-3">
                <p className="text-xs text-muted">
                  {String(post.category || "Weave")} ·{" "}
                  {post.publish_at
                    ? new Date(String(post.publish_at)).toLocaleDateString()
                    : ""}
                </p>
                <h2 className="font-bold text-xl">
                  <Link href={"/blog/" + String(post.slug)}>
                    {String(post.title)}
                  </Link>
                </h2>
                <p className="text-sm text-muted">{String(post.excerpt)}</p>
                <p className="text-xs">{String(post.author)}</p>
              </div>
            </article>
          ))}
        </div>
        {!data.rows.length && (
          <p className="py-10 text-muted">
            No published stories match your search.
          </p>
        )}
        <div className="flex justify-between">
          <span>{data.total} posts</span>
          <div className="flex gap-4">
            {data.page > 1 && <Link href={url(data.page - 1)}>Previous</Link>}
            {data.page * 12 < data.total && (
              <Link href={url(data.page + 1)}>Next</Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
