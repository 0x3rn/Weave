export function exchangeWorkspacePath(id: string, view: unknown) {
  const suffix =
    view === "milestones_first"
      ? "/milestones"
      : view === "activity_first"
        ? "/activity"
        : "/messages";
  return `/exchanges/${encodeURIComponent(id)}${suffix}`;
}
