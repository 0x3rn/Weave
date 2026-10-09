"use client";

import ErrorPage from "./error";
import "./globals.css";
import styles from "@/components/feedback/unavailable.module.css";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className={styles.standalone} data-weave-fallback="true">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <title>Page unavailable | Weave</title>
      </head>
      <body>
        <ErrorPage {...props} />
      </body>
    </html>
  );
}
