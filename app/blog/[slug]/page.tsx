import { publicDocument } from "@/lib/public-cms";
import PublicDocument from "@/components/public-document";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await publicDocument("post", slug);
  return {
    title: d?.seo_title || d?.title || "Story",
    description: d?.seo_description || d?.excerpt,
    alternates: d?.canonical_url
      ? { canonical: String(d.canonical_url) }
      : undefined,
    openGraph: d
      ? {
          title: String(d.seo_title || d.title),
          description: String(d.seo_description || d.excerpt),
          type: "article",
          images:
            d.og_image || d.featured_image
              ? [String(d.og_image || d.featured_image)]
              : undefined,
        }
      : undefined,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = await publicDocument("post", slug);
  if (!d) notFound();
  return <PublicDocument document={d} />;
}
