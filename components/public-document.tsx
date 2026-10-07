import Markdown from "react-markdown";
import Header from "./header";
import Footer from "./footer";
import type { PublicCmsDocument } from "@/lib/public-cms";
import ContentView from "./content-view";
export default function PublicDocument({
  document,
}: {
  document: PublicCmsDocument;
}) {
  return (
    <>
      <ContentView id={String(document.id)} />
      <Header />
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold mb-6">{String(document.title)}</h1>
        {document.kind === "post" && (
          <p className="text-muted mb-6">
            {String(document.author || "Weave")} ·{" "}
            {document.publish_at
              ? new Date(String(document.publish_at)).toLocaleDateString()
              : ""}
          </p>
        )}
        {document.featured_image && (
          <img
            src={String(document.featured_image)}
            alt={String(document.title)}
            className="w-full max-h-96 object-cover rounded-xl mb-8"
          />
        )}
        <div className="prose dark:prose-invert max-w-none leading-relaxed">
          <Markdown>{String(document.content || "")}</Markdown>
        </div>
      </main>
      <Footer />
    </>
  );
}
