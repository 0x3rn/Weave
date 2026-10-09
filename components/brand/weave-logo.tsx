import Image from "next/image";
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
      style={{ fontSize: Math.round(size * 0.75) }}
      role={showWordmark ? undefined : "img"}
      aria-label={showWordmark ? undefined : "Weave"}
    >
      <span
        className={styles.mark}
        style={{ width: size, height: Math.round(size * 0.75) }}
        aria-hidden="true"
      >
        <Image
          src="/brand/weave-mark-black.svg"
          className={styles.lightMark}
          alt=""
          aria-hidden="true"
          width={size}
          height={Math.round(size * 0.75)}
          loading="eager"
          unoptimized
        />
        <Image
          src="/brand/weave-mark-dark.svg"
          className={styles.darkMark}
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
