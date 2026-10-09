import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./weave-logo.module.css";

export default function WeaveLogo({
  size = 36,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={styles.logo}
      data-wordmark={showWordmark || undefined}
      style={{ fontSize: size * (2 / 3) }}
      role={showWordmark ? undefined : "img"}
      aria-label={showWordmark ? undefined : "Weave"}
    >
      <span
        className={styles.mark}
        style={{ "--weave-mark-size": `${size + 6}px` } as CSSProperties}
      >
        <Image
          src="/brand/weave-mark-black.svg"
          alt=""
          aria-hidden="true"
          width={size}
          height={Math.round(size * 0.75)}
          loading="eager"
          unoptimized
        />
      </span>
      {showWordmark && <span>Weave</span>}
    </span>
  );
}
