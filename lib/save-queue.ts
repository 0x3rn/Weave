export type SaveOperation = () => Promise<unknown>;

export class SaveQueue {
  private tail = Promise.resolve();
  private failures: SaveOperation[] = [];
  pending = 0;
  error = "";
  get hasFailures() {
    return this.failures.length > 0;
  }
  takeFailures() {
    return this.failures.splice(0);
  }

  save(operation: SaveOperation) {
    this.pending++;
    const work = this.tail.then(async () => {
      try {
        const result = await operation();
        const response =
          result && typeof result === "object"
            ? (result as { error?: string; success?: boolean })
            : {};
        if (response.error || response.success === false)
          throw new Error(response.error || "Could not save changes");
        if (!this.hasFailures) this.error = "";
      } catch (error) {
        this.failures.push(operation);
        this.error =
          error instanceof Error ? error.message : "Could not save changes";
      } finally {
        this.pending--;
      }
    });
    this.tail = work;
    return work;
  }
}
