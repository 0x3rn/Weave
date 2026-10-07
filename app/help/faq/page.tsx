import { publicSiteContent } from "@/lib/public-cms";
import Markdown from "react-markdown";
import Header from "@/components/header";
import Footer from "@/components/footer";
export const dynamic = "force-dynamic";
export const metadata = { title: "Frequently Asked Questions" };
export default async function Page() {
  const data = await publicSiteContent();
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto p-8 space-y-5">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        {data.documents
          .filter((d) => d.kind === "faq")
          .map((d) => (
            <details
              key={String(d.id)}
              className="border border-border rounded-lg p-4"
            >
              <summary className="font-semibold">{String(d.title)}</summary>
              <div className="prose dark:prose-invert mt-3">
                <Markdown>{String(d.content)}</Markdown>
              </div>
            </details>
          ))}
      </main>
      <Footer />
    </>
  );
}
