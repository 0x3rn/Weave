/** Only accept paths that remain on the application origin after URL parsing. */
export function internalRedirect(value: unknown, fallback = "/dashboard") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return fallback;
  try {
    const origin = "https://weave.invalid";
    const url = new URL(value, origin);
    return url.origin === origin
      ? url.pathname + url.search + url.hash
      : fallback;
  } catch {
    return fallback;
  }
}
