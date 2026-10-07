import { publicDocument } from "@/lib/public-cms";
import PublicDocument from "@/components/public-document";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = await publicDocument("page", slug.join("/"));
  return {
    title: doc?.seo_title || doc?.title || "Page",
    description: doc?.seo_description || doc?.excerpt,
    alternates: doc?.canonical_url
      ? { canonical: String(doc.canonical_url) }
      : undefined,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const doc = await publicDocument("page", slug.join("/"));
  if (!doc) notFound();
  return <PublicDocument document={doc} />;
}
