"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, RotateCcw, WifiOff } from "lucide-react";
import styles from "./unavailable.module.css";
import WeaveLogo from "@/components/brand/weave-logo";

export type UnavailableKind = "not-found" | "server" | "offline";

const content = {
  "not-found": {
    label: "404 · Page not found",
    title: (
      <>
        This thread
        <br />
        went missing.
      </>
    ),
    description:
      "This link may be outdated, or the page may have moved. Let’s find your way back.",
    caption: "A little detour. Plenty of possibilities ahead.",
  },
  server: {
    label: "Something went wrong",
    title: (
      <>
        We couldn’t
        <br />
        load this page.
      </>
    ),
    description:
      "Something interrupted your request. Give it another try in a moment, or head back home.",
    caption:
      "If you just submitted something, check its status before submitting it again.",
  },
  offline: {
    label: "Connection lost",
    title: (
      <>
        Let’s get you
        <br />
        connected again.
      </>
    ),
    description:
      "Weave can’t connect right now. Check your Wi-Fi or mobile data, then try again.",
    caption: "Keep this tab open. Your connection may return in a moment.",
  },
};

function UnavailableIllustration({ kind }: { kind: UnavailableKind }) {
  return (
    <div className={styles.artwork} aria-hidden="true">
      <svg viewBox="0 0 440 410" fill="none" className={styles.illustration}>
        <circle cx="220" cy="200" r="130" fill="currentColor" opacity=".045" />
        <g
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {kind === "not-found" ? (
            <>
              <path
                d="M174 123H239L272 156V267C272 275 266 281 258 281H174C166 281 160 275 160 267V137C160 129 166 123 174 123Z"
                className={styles.artPaper}
              />
              <path d="M238 124V157H271" />
              <path d="M190 244H243" opacity=".25" />
            </>
          ) : kind === "server" ? (
            <>
              <rect
                x="150"
                y="135"
                width="140"
                height="53"
                rx="12"
                className={styles.artPaper}
              />
              <rect
                x="150"
                y="201"
                width="140"
                height="53"
                rx="12"
                className={styles.artPaper}
              />
              <circle
                cx="170"
                cy="162"
                r="3"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="170"
                cy="228"
                r="3"
                fill="currentColor"
                stroke="none"
              />
              <path d="M196 162H268M196 228H268" opacity=".3" />
            </>
          ) : (
            <>
              <path d="M148 168C188 132 252 132 292 168M171 194C198 170 242 170 269 194M197 220C210 208 230 208 243 220" />
              <circle
                cx="220"
                cy="245"
                r="5"
                fill="currentColor"
                stroke="none"
              />
              <path
                d="M151 134L288 270"
                className={styles.artSlash}
                strokeWidth="12"
              />
              <path d="M151 134L288 270" />
            </>
          )}
        </g>
        <text
          x="220"
          y={kind === "not-found" ? 215 : 296}
          textAnchor="middle"
          fill="currentColor"
          fontSize={kind === "not-found" ? 32 : 12}
          fontWeight="600"
          letterSpacing="2"
        >
          {kind === "not-found"
            ? "404"
            : kind === "server"
              ? "RETRY"
              : "OFFLINE"}
        </text>
      </svg>
      <div className={styles.artCaption}>
        <span />
        Every connection starts with a thread.
      </div>
    </div>
  );
}

export default function UnavailableScreen({
  kind,
  onRetry,
  retrying = false,
  reference,
}: {
  kind: UnavailableKind;
  onRetry?: () => void;
  retrying?: boolean;
  reference?: string;
}) {
  const copy = content[kind];
  const safeReference =
    reference && /^[A-Za-z0-9_-]{1,64}$/.test(reference)
      ? reference
      : undefined;
  return (
    <div className={styles.screen} data-weave-unavailable={kind}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Weave home">
          <WeaveLogo size={36} />
        </Link>
        <Link href="/help" className={styles.helpLink}>
          Help Center
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.copy}>
          <div className={styles.eyebrow}>
            <span />
            {copy.label}
          </div>
          <h1>{copy.title}</h1>
          <p className={styles.description}>{copy.description}</p>
          <div className={styles.actions}>
            {kind === "not-found" ? (
              <Link href="/" className={styles.primary}>
                <ArrowLeft size={17} aria-hidden="true" />
                Back to home
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying || !onRetry}
                className={styles.primary}
              >
                {kind === "offline" ? (
                  <WifiOff size={17} aria-hidden="true" />
                ) : (
                  <RotateCcw size={17} aria-hidden="true" />
                )}
                {retrying ? "Trying again…" : "Try again"}
              </button>
            )}
            <Link
              href={kind === "not-found" ? "/marketplace" : "/"}
              className={styles.secondary}
            >
              {kind === "not-found" ? "Explore marketplace" : "Back to home"}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.caption}>{copy.caption}</p>
          {safeReference && (
            <p className={styles.reference}>
              Support reference: <span>{safeReference}</span>
            </p>
          )}
        </div>
        <UnavailableIllustration kind={kind} />
      </main>
      <footer className={styles.footer}>
        <span>Good work starts with good connections.</span>
        <Link href="/support/contact">
          Need a hand?
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
