import { publicDocument } from "@/lib/public-cms";
import PublicDocument from "./public-document";
export default async function CmsRoute({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const doc = await publicDocument("page", slug);
  return doc ? <PublicDocument document={doc} /> : children;
}
