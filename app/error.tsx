"use client";

import { useTransition } from "react";
import UnavailableScreen from "@/components/feedback/unavailable-screen";
import { useOnlineStatus } from "@/components/feedback/use-online-status";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const online = useOnlineStatus();
  const [pending, startTransition] = useTransition();
  return (
    <UnavailableScreen
      kind={online ? "server" : "offline"}
      onRetry={() => startTransition(retry)}
      retrying={pending}
      reference={online ? error.digest : undefined}
    />
  );
}
