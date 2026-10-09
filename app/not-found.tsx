import type { Metadata } from "next";
import UnavailableScreen from "@/components/feedback/unavailable-screen";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <UnavailableScreen kind="not-found" />;
}
