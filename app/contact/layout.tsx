import CmsRoute from "@/components/cms-route";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <CmsRoute slug="contact">{children}</CmsRoute>;
}
