let chain: Promise<unknown> = Promise.resolve();

/** Serializes read-modify-write of the JSON runtime stores. Not re-entrant. */
export function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
